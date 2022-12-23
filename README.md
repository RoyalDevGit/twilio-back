# Expert Session API

This is the API of the Expert Session project.

## Local Development

In order to run the API locally, follow these steps:

1. Install [Docker](https://www.docker.com/) installed.
2. Install Node.js version 16 or higher [Node](https://nodejs.org/).
3. Install the latest version [Yarn](https://yarnpkg.com/).
4. Make a copy of the file `.env.example` and rename it to `.env`. Make sure you don't delete `.env.example`.
5. Create a key file for your local Mongo DB replica set.

   ```
   openssl rand -base64 756 > ./ssl/mongo-keyfile
   chmod 400 ./ssl/mongo-keyfile
   ```

6. Run `yarn install`
7. Start the app by running `yarn dev`
8. API will now be available at http://localhost:4000/

You can use whatever client you prefer to connect such as the CLI or [Compass](https://www.mongodb.com/products/compass).keych

## Special considerations for Linux

On a Linux machine you may have some specific issues with the containers.
The following have been tested on an Ubuntu machine:

- In docker-compose.yml, the logging and logging.driver keys need to be disabled for each db instance if you get logging errors
- If you get an error about ssl/mongo-keyfile being a "bad file," you may need to change the owner ID to 999 (interpreted by Docker as the mongo user):
  - `chown 999:999 ssl/mongo-keyfile`

## Accessing your local MongoDB instance

Connect to your local MongoDB instance using the following connection string:

```
mongodb://admin:admin@localhost:27017
```

## Accessing your local Open Search instance

Connect to your local OpenSearch instance by navigating to http://localhost:5601.

Username: admin
Password: admin

## Daemon

The API project has a set of daemon jobs that need to be run on a schedule. Learn more about these background processes by visiting the [daemon's README](~/src/../../src/daemon/README.md).

## OAuth Provider Setup

Ask the lead engineer on the project to provide you a copy of these values. If they do not exist, you can follow the instructions on each of the respective providers.

### Facebook

[Account Setup Instructions](https://thinkbean.atlassian.net/wiki/spaces/ES/pages/2208694277/OAuth+Facebook+Setup)

You will need two environment variables in order to use Facebook as an OAuth client:

- FACEBOOK_CLIENT_ID
- FACEBOOK_CLIENT_SECRET

### Google

[Account Setup Instructions](https://thinkbean.atlassian.net/wiki/spaces/ES/pages/2209054729/Google+OAuth+Setup)

You will need two environment variables in order to use Facebook as an OAuth client:

- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET

### Microsoft

[Account Setup Instructions](https://thinkbean.atlassian.net/wiki/spaces/ES/pages/2209218565/Microsoft+AD+OAuth+Setup)

You will need 2 environment variables to use M$ as an OAuth client:

- MICROSOFT_CLIENT_ID
- MICROSOFT_CLIENT_SECRET

### Apple

[Account Setup Instructions](https://thinkbean.atlassian.net/wiki/spaces/ES/pages/2209153075/Apple+OAuth+Setup)

You need to place the Apple key (provided when setting up the account) at the root of the project. The key name needs to be apple-key.p8. It should not be included in the repo.

You will need 3 environment variables to use AD as an OAuth client:

- APPLE_CLIENT_ID
- APPLE_TEAM_ID
- APPLE_KEY_ID

## New Relic Integration

### Enabling the Runtime agent

If you wish to enable the New Relic agent at runtime, you must first provide the two environment variables listed below. New Relic configurations can be found in the newrelic.js file at the root of this project. Upon providing these variables, the New Relic module will be triggered and look for the configuration file at the root of this project.

- NEW_RELIC_LICENSE_KEY={your-key}
- NEW_RELIC_APP_NAME=expert-session-api-{local|dev|prod}

---

### Tagging Deployments

In addition, if you wish to tag your deployments upon build time, you will need two additional variables. Note that the app does not use these variables at runtime like the two above. Your CI tool will need them.

- NEW_RELIC_APP_ID {dev and prod should have different app ids}
- NEW_RELIC_API_KEY {can be shared across projects}

Example CI

```
 post_build:
    commands:
      - |
        curl --location --request POST "https://api.newrelic.com/v2/applications/$NEW_RELIC_APP_ID/deployments.json" \
        -i \
        --header "Api-Key: $NEW_RELIC_API_KEY" \
        --header "Content-Type: application/json" \
        --data-raw \
        "{
          \"deployment\": {
            \"revision\": $CODEBUILD_RESOLVED_SOURCE_VERSION
          }
        }"
```

## GitHub Actions Pipeline

The pipeline for this project is built upon [GitHub Actions](https://docs.github.com/en/actions). The build files can be found in the `.github/workflows` directory.

### Deployment Flow

Pushing changes to `develop`, `main` or any branch with the following prefix `ft-*` will trigger a Docker build / push to ECR on AWS. If there is a pre-existing cluster that matches the branch name, GHA will deploy the new image to the cluster.

You may read up fully on the deployment steps [here](https://thinkbean.atlassian.net/wiki/spaces/ES/pages/2227273729/Pipeline+Flow+for+Web+and+API+Applications).

### Environment Variables

All environment variables for remote deployments can be found in the `.github/variables` directory. The `main` branch will pull from the `production.json` file. All other branches will pull from the `develop.json` file.

You may read up fully on this concept [here](https://thinkbean.atlassian.net/wiki/spaces/ES/pages/2227142660/How+Environment+Variables+are+Handled+CI+CD).
