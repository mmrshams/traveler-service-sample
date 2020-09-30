FROM node:12.16.3-alpine

RUN apk update && apk add --no-cache wget openssl tini

ARG NODE_ENV='production'
ENV NODE_ENV = ${NODE_ENV}

WORKDIR /usr/service
COPY ./package.json ./
COPY ./build ./build
RUN apk add --no-cache make gcc g++ python
RUN yarn install --production --pure-lockfile
RUN apk del make gcc g++ python

RUN yarn global add pm2

CMD yarn run start:prd
