#!/bin/sh

set -e

cd "$(command dirname -- "${0}")"
cd ..

project="wappuapp"
backend="${project}_backend"
database="${project}_database"

sh tools/start-dev-env.sh

export backend_container="$(docker ps --filter "name=${backend}" --format "{{.Names}}")"
export database_container="$(docker ps --filter "name=${database}" --format "{{.Names}}")"
export knexfile=./knexfile.js;
export migrations=./migrations;
export PGPASSWORD=wappu;

echo "Pinging PostgreSQL";
until docker exec -it $database_container psql -U "wappu" -d "wappuapp" -c '\l'; do
  echo "Postgres is unavailable";
  sleep 1;
done;

echo "Running migrations";
docker exec -it $backend_container ./node_modules/.bin/knex-migrate up --knexfile=$knexfile --migrations=$migrations;

echo "Running seeds";
docker exec -it $backend_container ./node_modules/.bin/knex seed:run;

echo "Get coding!";
