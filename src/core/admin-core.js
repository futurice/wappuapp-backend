const { knex } = require("../util/database").connect();
const logger = require("../util/logger")(__filename);
import { createFeedItem } from "../core/feed-core";

/*
  Bans the selected feed item, does not actually delete it.
*/
function deleteFeedItem(id) {
  return knex("feed_items")
    .update({ is_banned: true })
    .where({
      id: id
    })
    .then(deletedCount => {
      if (deletedCount > 1) {
        logger.error("Banned feed item", id);
        throw new Error("Unexpected amount of bans happened: " + deletedCount);
      }

      return deletedCount;
    });
}

/*
  Bans the given user based on user id, with additional check
  that prevents banning moderators by accident.
*/
function shadowBanUser(id) {
  return knex("users")
    .select("role")
    .where({ id: id })
    .then(role_ => {
      const [role] = role_;
      if (role.role !== null) {
        throw new Error("Cannot ban moderator");
      } else {
        return knex("users")
          .where("id", id)
          .update({ is_banned: true })
          .then(updatedCount => {
            if (updatedCount > 1) {
              logger.error("Banned user with ID ", id);
              throw new Error(
                "Unexpected amount of bans happened: ",
                updatedCount
              );
            }
            return updatedCount;
          });
      }
    });
}

/*
  Removes shadowban from the user.
  NOTE: There is no frontend for this as of now.
*/
function unBanUser(id) {
  return knex("users")
    .where("id", id)
    .update({ is_banned: false })
    .then(updatedCount => {
      if (updatedCount > 1) {
        logger.error("Unbanned user with ID ", id);
        throw new Error("Unexpected amount of unbans happened: ", updatedCount);
      }
      return updatedCount;
    });
}

function sendSystemMessage(action) {
  action.client.id = null;
  return createFeedItem({
    type: "TEXT",
    text: action.text,
    user: null,
    client: action.client,
    parent_id: null,
    city: action.city
  });
}

export { deleteFeedItem, shadowBanUser, unBanUser, sendSystemMessage };
