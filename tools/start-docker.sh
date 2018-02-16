#!/bin/sh

set -e

cd $(dirname $0)
cd ..

if ! [ -e ".env" ]; then
  echo "Run init-script in tools and fill in";
  exit 0;
fi;

port () {
  docker ps --filter ancestor=$1 --format {{.Ports}} | cut -d : -f2 | grep -Eo ^[0-9]+
}

project="wappuapp"
backend_container="${project}_backend"
database_container="${project}_database"

docker-compose -p ${project} down &&
docker-compose -p ${project} -f docker-compose.yml up -d --build && (
  echo "Development environment is now running. Good job."
  echo ""
  echo "Backend: \"http://localhost:$(port $backend_container)\" "
  echo "Database: \"http://localhost:$(port $database_container)\""
  echo "Database credentials: wappu / wappu / wappuapp"
  echo ""
  echo "To see logs: \"docker-compose -p wappuapp logs -f\""
  echo "To run adminpanel: \"cd wappuapp-adminpanel && npm run start\""
  echo ""
  echo "To restart, run the script again"
)
