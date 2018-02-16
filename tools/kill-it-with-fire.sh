#!/bin/sh

if [ "$(docker ps -qa)" ]; then
  echo "Stopping and removing all containers"
  docker stop $(docker ps -qa) && docker rm -f $(docker ps -qa)
fi

if
  [ "$(docker images -qa)" ]; then
  echo "Run prune to docker system"
  yes | docker system prune -a
fi

if
  [ "$(docker volume ls -q)" ]; then
  echo "Removing all volumes"
  docker volume rm -f $(docker volume ls -q)
fi
