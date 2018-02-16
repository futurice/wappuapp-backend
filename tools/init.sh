#!/bin/sh

# exits on error
set -e

cd "$(command dirname -- "${0}")"
cd ..

if ! [ -e ".env" ]; then
  ( cp .env-sample .env &&
  echo "Created .env file. Fill in the env-variables." )
else 
  echo ".env file exists, did not rewrite"
fi;
  
fi;
