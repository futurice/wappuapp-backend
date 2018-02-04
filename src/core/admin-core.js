const { knex } = require("../util/database").connect();
const logger = require("../util/logger")(__filename);
import { createFeedItem } from "../core/feed-core";

function deleteFeedItem(id) {
  return knex("feed_items")
    .update({ is_banned: true })
    .where({
      id: id
    })
    .then(deletedCount => {
      if (deletedCount > 1) {
        logger.error("Deleted feed item", id);
        throw new Error(
          "Unexpected amount of deletes happened: " + deletedCount
        );
      }

      return deletedCount;
    });
}

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
    //'isSticky': true,
    client: action.client,
    parent_id: null,
    city: action.city
  });
}

export { deleteFeedItem, shadowBanUser, unBanUser, sendSystemMessage };
