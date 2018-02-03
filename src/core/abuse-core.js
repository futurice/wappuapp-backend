import _ from 'lodash';
const { knex } = require('../util/database').connect();

function _sanitizeText(text) {
  if (!text) {
    return text;
  }
  return text.replace(/(\n|\r)+/g, " ");
}

function reportFeedItem(reportObj) {
  return knex('users').select('id').where('uuid', reportObj.reportCreatorUuid)
    .then(users => {
      if (_.isEmpty(users)) {
        throw new Error('User not found: ' + reportObj.reportCreatorUuid);
      }
      const dbRow = {
        'feed_item_id': reportObj.feedItemId,
        'report_creator_id': users[0].id,
        'report_description': _sanitizeText(reportObj.reportDescription)
      }
      return knex('feed_item_reports').insert(dbRow).returning('id')
        .then(rows => {
          if (_.isEmpty(rows)) {
            throw new Error('Feed item report creation failed: ' + dbRow);
          }
          return rows.length;
        })
        .catch(err => {
          if (err.constraint === 'feed_item_reports_feed_item_id_foreign') {
            err.status = 404;
            err.message = `No such feed item: ${ dbRow.feed_item_id }`;
          } else if (err.constraint === 'feed_item_reports_report_creator_id_foreign') {
            err.status = 404;
            err.message = `No such user: ${ dbRow.report_creator_uuid }`;
          }
          throw err;
        });
    });
}

function resolveReport(reportParams) {
  return knex.transaction(function(trx) {
    return trx('feed_item_reports').update('is_resolved', true)
      .where('id', reportParams.reportId)
      .returning(['id', 'feed_item_id'])
      .then(reports => {
        if (_.isEmpty(reports)) {
          throw new Error('Feed item report resolving failed: ' + reportParams);
        }
        if (reportParams.banned) {
          return trx('feed_items').update('is_banned', true)
            .where('id', reports[0].feed_item_id)
            .returning('id')
            .then(feedItems=> {
              if (_.isEmpty(feedItems)) {
                throw new Error('Feed item not found: ' + reports[0].feed_item_id);
              }
              return trx('feed_item_reports').update('is_resolved', true).where('feed_item_id', feedItems[0]).returning('id');
            });
        }
      })
      .catch(err => {
        throw err;
      });
    });
}

function getReportedFeedItems(params){

  let whereClause = []
  if (params.beforeId){
    whereClause.push('feed_item_reports.id < ' + params.beforeId + ' AND ');
  }
  whereClause += 'is_resolved = false'

  return knex('feed_item_reports').count('id').where('is_resolved', false)
  .then(number_of_rows =>{
    return knex.from('feed_item_reports')
    .select("feed_item_reports.id as report_id",
    "feed_item_reports.feed_item_id as id",
    "report_creator_id",
    "feed_item_reports.created_at",
    "report_description",
    "is_resolved",
    "user_id",
    "location",
    "feed_items.image_path",
    "uuid",
    "teams.name as team_name",
    "users.name",
    "users.id as user_id",
    "text",
    "type",
    "feed_items.is_banned",
    "hot_score",
    "teams.city_id",
    "parent_id",)
    .innerJoin('feed_items', 'feed_item_reports.feed_item_id', 'feed_items.id' )
    .innerJoin('users', 'feed_item_reports.report_creator_id', 'users.id')
    .innerJoin('teams', 'users.team_id', 'teams.id')
    .whereRaw(whereClause)
    .limit(20)
    .orderBy('report_id', 'desc')
    .then(feed => {
      for (var i = 0; i < feed.length; i++){
        feed[i].author = {
          id: feed[i].user_id,
          name: feed[i]['name'],
          team: feed[i]['team_name']
        }
      }
      return _.map([number_of_rows, feed])
    })
  })
  .catch(err =>{
    throw err;
  });
}

export {
  reportFeedItem,
  resolveReport,
  getReportedFeedItems
};
