[![Build Status](https://travis-ci.com/futurice/wappuapp-backend.svg?token=yjocXfDrdDpDqbwnbBG7&branch=master)](https://travis-ci.com/futurice/wappuapp-backend)

# Wappuapp backend

Dependencies:

* Node 9.x + npm 5.x

* Postgres with PostGis extension

  [Postgres.app](http://postgresapp.com/) has a built-in support.

  **Note: The command below has been done already for wappuapp-backend app. It is
  only useful if you create a new Heroku app.**

  You can add Postgis support to Heroku Postgres with:
  ```
  heroku pg:psql -a wappuapp-backend
  create extension postgis;
  ```

* Heroku toolbelt

* Docker

  Using Docker to run wappuapp-backend requires
  * Docker 17.0.6 =>
  * Docker Compose 1.11.2 =>

## Get started

* `bash ./tools/reset-database.sh`

  If this doesn't work, you can manually run SQL commands from ./tools/init-database.sql
  in Postgres console.

* `cp .env-sample .env && cp .env-test-sample .env-test`
* Fill in the blanks in `.env` and `.env-test` files

  Ask details from Kimmo Brunfeldt or Tomi Turtiainen.

* `source .env` or `bash .env`

  Or use [autoenv](https://github.com/kennethreitz/autoenv).

* `npm install`
* `npm install -g knex`
* `knex migrate:latest` Run migrations to local database
* `knex seed:run` Create seed data to local database
* `npm start` Start express server locally
* Server runs at http://localhost:9000

### Using Docker

* `sh tools/init.sh` to make sure .env exists, fill in the blanks
* `sh tools/start-docker-with-migrations.sh` to start the docker-environment with migrations and seeds
* `sh tools/start-docker.sh` to start the docker-environment after migrations and seeds have already been ran
* Postgres, Redis, Node are all installed and running, follow instructions on the screen.
* Server runs at http://localhost:9000

Start using [API endpoints](#api-endpoints).

Environments:

* `qa` https://wappuapp-backend-qa.herokuapp.com
* `prod` https://wappuapp-backend.herokuapp.com

Instructions for running wappuapp-backend with wappuapp-adminpanel are in the adminpanel's README.

## Techstack

* Node.js express app. Architecture explained here https://github.com/kimmobrunfeldt/express-example/
* Written in ES6
* Winston for logging
* Postgres

## Heroku/Cloud env

```bash
#!/bin/bash
heroku addons:create --app wappuapp-backend papertrail
heroku addons:create --app wappuapp-backend heroku-postgresql:hobby-dev
heroku addons:create --app wappuapp-backend newrelic
```

Add Postgis:

```bash
heroku pg:psql -a wappuapp-backend
create extension postgis;
```

Google Cloud Storage is used for storing images.

## Common tasks

### Release

Migrations and seeds are automatically run in Heroku when you deploy via git push.
Migrations are run if knex detects new files in migrations directory.
Seeds must be replayable, they must be upsert operations so they can be run
on each push.

1. Commit changes
2. Check that tests pass, remember to test migrations locally before push
3. Take manual backup of postgres

    `heroku pg:backups capture --app wappuapp-backend`

4. Push changes to production environment:

    ```bash
    git checkout master
    git pull
    git push prod
    ```

    **For testing environments:**

    You can also release a certain local branch. For example releasing from node
    branch to **dev**: `git push dev my-local-branch:master`.

5. Check that the environment responds and logs(Papertrail) look ok.

  Quick test endpoints:
  * https://wappuapp-backend.herokuapp.com/api/events
  * https://wappuapp-backend.herokuapp.com/api/feed
  * https://wappuapp-backend.herokuapp.com/api/action_types


### Update events

**NOTE:** Some data is added to the original Excel file via fuzzy match mappings.
This was done because initially we did not want to modify the original Excel file itself
to prevent csv export and character encoding problems. This is not true anymore
but some of the data is still added via fuzzy match mappings. These
could be transferred to the xlsx file already.

* Download newest .xlsx file containing events (in Drive)
* Open it in Excel
* Save as -> Windows Comma Separated. **Note:** use this specifically, not the general csv.
* If it asks: press "Save active Sheet" and "Continue"
* Run parse script:

  ```bash
  node tools/parse-events-csv.js ~/Downloads/wapputapahtumat.csv > data/events.json
  ```

* Make sure events.json looks fine
* Push newest code to remote, the events are directly read from JSON file

### Update markers

* Download the map markers spreadsheet as CSV
* Run parse script:

  ```bash
  node tools/parse-markers-csv.js ~/Downloads/markers.csv > data/markers.json
  ```

* Make sure markers.json looks fine
* Delete existing map markers from remote Postgres
* Push new code to production, knex seeds will update the markers to database

### Shadow ban user

```sql
UPDATE users SET is_banned = true WHERE uuid='D47DA01C-51BB-4F96-90B6-D64B77225EB7';
```

## API Endpoints

**READ THIS:**

* Always use `content-type: application/json` header when doing POST, PUT, PATCH requests
* All data is transferred in JSON format

  Even images are transferred as base64 strings in JSON. Why?
  - Why not?

* Be prepared that some of these endpoints are not documented correctly
* Token authentication is required. Token is sent in `x-token` header.



### `GET /api/heila/:uuid`

> List heila profiles customized to that uuid. This is what you call
when you want to get all unseen heilas. This filters them so that
previous matches, UPs and DOWNs are dropped.

Query parameters:

* `userId` Integer. If specified, returns only that single heila profile.

In essence, you can query in either of these three ways:

* /api/heila/lkjsadlkfj <--- returns customized list matching uuid
* /api/heila?userId=10 <--- returns heila profile by id 10
* /api/heila/?uuid=x <--- returns heila profile of the calling user

Responses:

* `200 OK` List of [heila object](#heila-object).

### `GET /api/heila-types`

> List all possible heila bio_looking_for types

Responses:

* `200 OK` [heila type object](#heila-type-object).

### `POST /api/heila-report`

> Reports a bad behaving user

* Body is [heila report object](#heila-report-object).

### `POST /api/heila-push-receipt`

> Lets the push notification service know that the user has seen
either a match notification or a msg notification and it's OK
to send a new one. This should be called every time the user has cleared 
the notifications.

* Body is [push notification read receipt object](#push-notification-read-receipt-object).

### `PUT /api/heila/:uuid`

> Update heila profile text fields.

* Body is [heila bio object](#heila-bio-object).

### `DELETE /api/heila/:uuid`

> Deletes the heila profile AND switches the user profile's heila to false.
  The user will also stop receiving any push notifications from the service.


### `POST /api/heila/matches`

> This POSTs a match telling that "this user made an UP for that user"

* Body is [match object](#match-object).

Responses:
* `200 OK`

### `GET /api/heila/matches/:uuid`

> List of matches

Responses:
* `200 OK` List of [match objects](#match-object).


### `POST /api/heila/matches/close`

> This POSTs a note that this particular chat should be CLOSED.
This will disable writing to that Firebase chat.
The chat will still be open for reading by the other user.

* Body is [match object close](#match-object-close).

Responses:
* `200 OK`




### `GET /api/events`

> List events

Query parameters:

* `cityId` Integer. If specified, returns only events in the city with given id.
* `showPast` Boolean. Should events that have ended also be returned. Defaults to false.

Responses:

* `200 OK` List of [event objects](#event-object).


### `GET /api/events/:id`

> Get event details

Responses:

* `200 OK` Body is one of [event object](#event-object) with an array of images that are [image feed objects](#feed-objects).
* `404 Not Found` Event not found


### `POST /api/feedback/:id`

Responses:

* `200 OK`

Body is a [feedback object](#feedback-object).


### `GET /api/teams`

> List all teams

Query parameters:

* `city` Integer. If specified, returns only teams based in the city with given id.

Responses:

* `200 OK` List of [team objects](#team-object).


### `POST /api/actions`

> Create a new action

Query parameters:

* `cityId` Integer. If specified, generated feed item show in this city's feed. Does nothing when checking into event.

Body is one of [action objects](#action-objects).

Responses:

* `200 OK`
* `404` No such city id or on CHECK_IN_EVENT; no such event id.
* `403` On CHECK_IN_EVENT; off time, off site or duplicate check in attempt.


### `PUT /api/vote`

> Vote on an feed item

Body is one of [vote object](#vote-object).

Responses:
* `200 OK`
* `404 Not found` Feed item not found


### `GET /api/users`

> Get user details

Query parameters:

* `userId` Integer. Required. User to whose details fetched

Responses:

* `200 OK` Body is one of [user details object](#user-details-object).
* `404 Not Found` User not found


### `PUT /api/users/:uuid`

> Create or update a user

Body is one of [user object](#user-object).

Responses:

* `200 OK`

### `PUT /api/users/:uuid/image`

> Saves user profile picture. If a picture was already set, overwrites it.

Body is one of [user image object](#user-image-object).

Responses:

* `200 OK`

### `GET /api/users/:uuid`

> Get user details

Responses:

* `200 OK` Body is one of [user object](#user-object).
* `404 Not Found` User not found


### `GET /api/action_types`

> List action types available

Body is one of [action type object](#action-type-object).

Responses:

* `200 OK`


### `GET /api/markers`

> List map markers

Body is list of [marker objects](#marker-object).

Responses:

* `200 OK`


### `GET /api/cities`

> List participating cities

Body is list of [city objects](#city-object).

Query parameters:

* `id` Integer. If specified, returns only cities with the given ID.
* `name` String. If specified, returns only cities with the given name.

Responses:

* `200 OK`


### `GET /api/feed`

> Get list of feed

Body is one of [feed objects](#feed-objects).

Query parameters:

* `beforeId` Return items before this id, can be used for "infinite scroll" in client.
* `limit` Integer. Default: 20. 1-100. If specified, at max this many items are returned.
* `sort` String. Default: 'new'. In which order the result should be returned. One of: 'new', 'hot'.
* `cityId` Integer. If specified, returns only posts by users belonging to guilds based in the city with given id.
* `type` String. If specified, only feed items of that type are returned. One of: 'IMAGE', 'TEXT'.
* `since` String. ISO-8601 format timestamp. If specified, only feed items created after given timestamp are returned. Note: If no time zone is specified, UTC is assumed.
* `offset` Integer. If specified, offsets the returned list by given amount.

Examples:

* Get 30 newest feed items: `GET /api/feed?limit=30`
* Get top 5-20 images: `GET /api/feed?sort=top&limit=15&offset=5&type=IMAGE`
* Load 20 more feed items: `GET /api/feed?beforeId=123&limit=20`

    Assuming the id of oldest/last feed item client currently has is `123`.

* Get the comments for a feed item with id 7: `GET /api/feed?parent_id=7`

Responses:

* `200 OK`

### `GET /api/refreshcommentnumber/:id`

> Get the number of comments for a feed item with the given feed_item id.

Example:

* Get the number of comments for a feed item with id 1: `GET /api/refreshcommentnumber/1`

Responses:

* `200 OK`


### `GET /api/image/:id`

> Get specific image

Body is one of [image objects](#image-objects).

Responses:

* `200 OK`
* `404 Not found`


### `DELETE /api/feed/:id`

> Delete item from feed

`:id` Is the id of an item in the feed.

### `GET /api/mood`

> Get list of day by day mood

Query parameters:

* `userId` Integer. If specified, returned ratingCity is for the given user.
* `cityId` Integer. If specified, returned ratingCity is for the given city.
* `teamId` Integer. If specified, returned ratingTeam is for the given team.

Body is a list of [mood objects](#mood-objects).


### `PUT /api/mood`

> Create or update mood

Body is one of [mood objects](#mood-objects).

Responses:

* `200 OK`
* `403 Forbidden` If uuid has not been included in header.


### `GET /api/radio`

> Get list of radio stations.

Query parameters:

* `cityId` String. If specified, returns only stations active in the given city.

Responses:

* `200 OK` Body is list of [radio objects](#radio-object).


### `GET /api/radio/:id`

> Get one of radio stations.

Responses:

* `200 OK` Body is one of [radio objects](#radio-object).

## Adminpanel endpoints

### `PUT /api/admin/feed/:id`

> Delete item from feed as a moderator (shadowbans it)

Query paramters:

* `:id` Is the id of an item in the feed.

Responses:

* `200 OK` with empty body

### `PUT /api/admin/users/:uuid/ban`

> Shadowban user as a moderator

Query paramters:

* `:uuid` Is the uuid of an user

Responses:

* `200 OK` with empty body

### `PUT /api/admin/users/:uuid/unban`

> Unban user as a moderator

Query paramters:

* `:uuid` Is the uuid of an user

Responses:

* `200 OK` with empty body

### `POST /api/admin/actions`

> Send a systemmessage

Responses:

* `200 OK`
* `400 Text cannot be empty.`
* `400 SystemMessage type must be text.`

### `GET /api/admin/reports`

> Get reported feed items, sorted by newest order

Query paramters:

* `beforeId` get reported feed_items before given Id

Responses:

* `200 OK` with empty body

### `POST /api/reports`

> Saves a report into the db

Responses:

* `200 OK` with empty body
* `404 No such feed item`
* `404 no such user`

### PUT `/api/admin/reports/:id`

> Resolves a report, on ban resolves all for the same feed item

Responses:

* `200 OK` with empty body
* `404 not found`

### `POST /api/login`

> Login to gain admin/moderator

Body:

* `email`
* `password`

Responses:

* `200 OK` with JWT token and level of rights
* `401 Unauthorized`

### `POST /api/addmoderator`

> New moderator creation, requires admin rights

Body:

* `email`

Responses:

* `200 OK`
* `401 Unauthorized`

### `DELETE /api/deletemoderator`

> Delete moderator or admin, requires admin rights

Query parameters:

* `:id` specifies the user id to delete

Responses:

* `200 OK`
* `401 Unauthorized`

### `PUT /api/promote`

> Promote moderator to admin, requires admin rights

Query parameters:

* `:id` specifies the user id to promote

Responses:

* `200 OK`
* `401 Unauthorized`

### `PUT /api/demote`

> Demote admin to moderator, requires admin rights

Query parameters:

* `:id` specifies the user id to demote

Responses:

* `200 OK`
* `401 Unauthorized`

### `POST /api/changepassword`

> Change password for current account

Body:

* `oldpassword` needs to match the old password
* `newpassword` new password to be set

Responses:

* `200 OK`
* `401 Unauthorized`

### `POST /api/activateaccount`

> Activate new account and set password for it

Body:

* `password`

Responses:

* `200 OK`
* `401 Unauthorized`

### `GET /api/forgottenpassword`

> Sends email to the account password has been forgotten from

Query parameters:

* `:email` email attached to the account that the password has been forgotten from


### `GET /api/moderatorlist`

> Lists moderators and admins in the system, requires admin rights

Responses:

* `200 OK` with list of moderators
* `401 Unauthorized`

### `POST /api/addevent`

> Add new event

Body:

* All the data for event

Responses:

* `200 OK`
* `401 Unauthorized`

### `DELETE /api/deleteevent`

> Deletes specific event

Query parameters:

* `:id` specifies the event id to delete

Responses:

* `200 OK`
* `401 Unauthorized`

### `GeT /api/updateevent`

> Get all data of specific event that is to be updated

Query parameters:

* `:id` specifies the user event id to be updated

Responses:

* `200 OK` with event data
* `401 Unauthorized`

### `POST /api/updateevent`

> Update event with the data in the body

Body:

* All event data

Responses:

* `200 OK`
* `401 Unauthorized`

## Response objects


### Match object

When you're POSTin your opinion about another user:

```js
{
  "uuid": "this is your own uuid",
  "matchedUserId": "this is the USERID of the user you're UPing/DOWNing",
  "opinion": "UP|DOWN"
}
```

When you're GETting your own list of matches:

```js
{
  NOT DECIDED YET BUT IS ALREADY RETURNING:
  "firebaseChatId": "key that points to /chats/*** in firebase"
}
```

### Match object close

```js
{
  "uuid": "this is your own uuid",
  "matchedUserId": "this is the USERID of the user you're closing the chat with",
  "firebaseChatId": "this is the firebaseChatId your chat is located at"
}
```

### Heila type object

```js
[
    {
        "id": 1,
        "type": "New buddies to spend this Wappu with"
    },
    {
        "id": 2,
        "type": "Light-hearted fun"
    },
    {
        "id": 3,
        "type": "Serious romantic buzz!!"
    },
    {
        "id": 4,
        "type": "Philosophical debates about the true nature of Wappu"
    }
]

```

### Heila object

```js
{
  "id": 2002,
  "name": "Pate Papparainen",
  "team_id": 1,
  "image_url": "https://..." | null // if no image, then null
  "bio_text": "I'm very nice",
  "bio_looking_for_type_id": TYPE_ID,
  "class_year": "11" // two char string 
}

```

### Heila bio object

```js
{
  "uuid": "UUID",
  "bio_text": string, // length of 0 is fine
  "bio_looking_for_type_id": TYPE_ID,
  "push_token": "this is the push notif token generated by FCM.getPushToken()",
  "class_year": "11"
}

```

### Heila report object

```js
{
  "reporter_uuid": "UUID",
  "bad_profile_id": "userId/heilaId (same) of the bad user",
  "text": "explanation for the report, required, max 500"
}

### Push notification read receipt object

```js
{
  "uuid": "UUID",
  "type": "match|msg" // depending on what was read
}

```

### Event object

```js
{
  "id": 121,
  "name": "Spinnin iltapäiväkertho",
  "locationName": "Spinnin kerhohuone SA014",
  "startTime": "2017-02-21T10:00:00.000Z",
  "endTime": "2017-04-21T15:00:00.000Z",
  "description": "Raining and freezing outside? Studying terrifies and starting to miss kindergarden times? Spinni solves your problems!\r\r\r\rClimb stairs down to the basement of Sähkötalo and arrive to the club room of Spinni, SA014 on <päivämäärä> starting at 1 PM. Spinni offers some snacks, coloring books (for adults), games, lot of friends to play with - not to mention awesome music and lights. Additionally you may have a look at the regular life of electronic music club that is celebrating its 20th anniversary this year.\r\r\r\rSpinni <3 you",
  "organizer": "Spinni",
  "contactDetails": "spinni-hallitus@listmail.tut.fi; Valtteri Taimela, valtteri.taimela@student.tut.fi",
  "teemu": false,
  "location": {
    "latitude": 61.450364,
    "longitude": 23.858384
  },
  "coverImage": "https://storage.googleapis.com/wappuapp/assets/spinni.jpg",
  "city": 3,
  "fbEventId": null,
  "attendingCount": 0,
  "checkingCount": 0,
  "radius": 400,
  "images": []
}
```

### Feedback object

```js
{
  "id": 1234,
  "text": "blaa blaa bububu pöx", // optional, max 5000 char
  "grade": [0-5], // optional,
  "uuid": "kdjfdakdf" // uuid of the giver
}
```

### Team object

```js
{
  "id": 1,
  "name": "Tietoteekkarikilta",
  "image_path": "foo.com/path_to_image.jpg",
  "score": "10",
  "city": 3
}
```

### User details object

Images is an array of [feed objects](#feed-objects).

```js
{
  "name": "Hessu Kypärä",
  "team": "TiTe",
  "numSimas": "1",
  "image_url": "https://...." || null,
  "heila": true|false,
  "images": [
    {
      "id": "2",
      "type": "IMAGE",
      "votes": "0",
      "userVote": 0,
      "hotScore": "195.2537",
      "author": {
        "id": "1",
        "name": "Hessu Kypärä",
        "team": "TiTe",
        "type": "ME"
      },
      "createdAt": "2017-04-12T16:40:14.308Z",
      "location": {
        "latitude": 0.123,
        "longitude": 0.123
      },
      "url": "https://storage.googleapis.com/wappuapp/user_content/123.jpg"
    }
  ]
}
```

### User object

If you're updating the user with a PUT from the client:


```js
{
  "uuid": "UUID",
  "name": "NAME",
  "team": team number,
}
```

If you're getting the user with a GET from the backend:

```js
{
  "uuid": "de305d54-75b4-431b-adb2-eb6b9e546014",
  "name": "Hessu Kypärä",
  "image_url": "https://..." | null , // if no image, null
  "heila": true|false // this field is automatically updated when the user creates/updates/removes the heila profile
}
```

### User image object

```
{ 
  "uuid": "UUID",
  "imageData": 'base64encodedimage'
}
```

### Action type object

```js
{
  "id": "3",
  "code": "CIDER",
  "name": "Grab a cider",
  "value": 10,
  "cooldown": 300000
}
```

### Marker object

```js
{
  location: {
    latitude: -1.2345,
    longitude: 56.2322
  },

  // One of STORE, ALKO, TOILET, TAXI, BAR, RESTAURANT
  type: "STORE",
  title: "K-Supermarket Herkkuduo",

  // Optional url
  url: "http://www.k-supermarket.fi/"
}
```

### Vote object

```js
{
  // one of 1, -1
  "value": 1,
  "feedItemId": 12
}
```

### City object

```js
{
  "id": 2,
  "name": "helsinki"
}
```

### Radio object

```js
{
  "id": 2,
  "name": "Radiodiodi",
  "stream": null,
  "website": null,
  "cityId": 2,
  "nowPlaying": {
    "programTitle": "Mustia kukkia ja kielimoukareita",
    "programHost": "Santtu, Jaati, Lari",
    "song": null,
    "left": 1132504   // How much longer the program is gonna be playing, in ms
  }
}
```

### Mood objects

#### GET mood object

```js
{
  "date": "2016-04-15T22:00:00.000Z",
  "ratingCity": "3.3333",     // May be null
  "ratingTeam": "5.0000",     // May be null
  "ratingPersonal": "10.0000" // May be null
}
```

#### PUT mood object

```js
{
  // Dacimal. Range [0, 10]. Rounded to 4th decimal mark.
  "rating": 10,
  // Optional
  "description": "Its friday!"

}
```

### Action objects

#### Basic action object

`type` is one of `SIMA`, `CHECK_IN_EVENT`.

```js
{
  // required when event type 'CHECK_IN_EVENT'
  location: {
    latitude: -1.2345,
    longitude: 56.2322
  },
  type: "SIMA",
  team: 1,
  user: 'UUID',
  // required when event type 'CHECK_IN_EVENT'
  eventId: 1
}
```

#### Image action object

```js
{
  location: {
    latitude: -1.2345,
    longitude: 56.2322
  },
  type: "IMAGE",
  team: 1,
  imageData: 'base64encodedimage',
  user: 'UUID'
}
```


### Feed objects

#### Image feed object

```js
{
  id: 1,
  // location is optional so it might be not provided
  location: {
    latitude: -1.2345,
    longitude: 56.2322
  },
  type: "IMAGE",
  createdAt: "2016-04-20T09:00:00.000Z",
  votes: 10,
  hotScore: 178.0032,
  author: {
    name: "Nahkasimo",
    team: "Sähkökilta",
    // Can be 'ME', 'OTHER_USER', 'SYSTEM'
    type: "ME"
  },
  url: "https://storage.googleapis.com/wappuapp/user_content/123.jpg"
}
```


### Image objects

```js
{
  createdAt: "2016-04-20T09:00:00.000Z",
  votes: 10,
  hotScore: 178.0032,
  author: {
    name: "Nahkasimo",
    team: "Sähkökilta",
  },
  url: "https://storage.googleapis.com/wappuapp/user_content/123.jpg"
}
```

#### Text feed object

```js
{
  id: 1,
  // location is optional so it might be not provided
  location: {
    latitude: -1.2345,
    longitude: 56.2322
  },
  type: "TEXT",
  createdAt: "2016-04-20T09:00:00.000Z",
  votes: 10,
  // If and how the user has voted. One of [-1, 0, 1].
  userVote: 0,
  hotScore: 178.0021,
  author: {
    name: "Nahkasimo",
    team: "Sähkökilta",
    // Can be 'ME', 'OTHER_USER', 'SYSTEM'
    type: "ME"
  },
  text: "Joujou"
}
```

## Error handling

When HTTP status code is 400 or higher, response is in format:

```json
{
  "error": "Internal Server Error"
}
```

=======

## Acknowledgements
This project is a grateful recipient of the [Futurice Open Source sponsorship program](http://futurice.com/blog/sponsoring-free-time-open-source-activities). ♥
