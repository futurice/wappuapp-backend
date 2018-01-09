#!/bin/bash

source .env
export PGSSLMODE=require
export DATABASE_URL=$(heroku config:get DATABASE_URL -a keba-whappu)
#export DATABASE_URL=$(heroku config:get DATABASE_URL -a keba-whappu)
knex migrate:rollback
knex migrate:latest
knex seed:run
