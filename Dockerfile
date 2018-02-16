FROM node:9.5.0-alpine

# For Google Cloud Services
RUN apk upgrade
RUN apk add --update \
  libc6-compat

WORKDIR /app

COPY package.json .

RUN npm install

COPY data ./data
COPY migrations ./migrations
COPY seeds ./seeds
COPY src ./src
COPY .env .
COPY knexfile.js .
COPY newrelic.js .

EXPOSE 80

CMD ["npm", "start"]
