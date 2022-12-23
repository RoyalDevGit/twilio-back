FROM node:16-alpine3.12
RUN apk add --no-cache wget
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN wget https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem -P /usr/src/app/ssl
RUN yarn install
RUN yarn build
ENTRYPOINT ["yarn", "daemon:run"]