# Expert Session Daemon

This is the daemon of Expert Session. It provides several background processes that are to be run on a schedule.

## Local Development

The daemon starts automatically when you run `yarn dev` so there is nothing extra you need to do. The jobs run on cron jobs powered by `node-cron`.

You can debug the jobs by using the "Attach to Daemon" launch profile within Visual Studio Code or by attaching to any other node debugger.

## CLI API

### notification-sender

Sends notifications queued by the API.

#### Recommended schedule

Every 10 seconds

#### Usage examples

```
# see the man page
yarn daemon notification-sender --help

# run the send notifications job
yarn daemon notification-sender
```

### upcoming-session-reminder

Sends a reminder to participants of any upcoming sessions.

#### Recommended schedule

Every minute

#### Usage examples

```
# see the man page
yarn daemon upcoming-session-reminder --help

# run the send notifications job
yarn daemon upcoming-session-reminder
```

### session-attendance-analyzer

Analyzes past sessions and calculates whether both parties joined the session.

#### Recommended schedule

Every minute

#### Usage examples

```
# see the man page
yarn daemon session-attendance-analyzer --help

# run the send notifications job
yarn daemon session-attendance-analyzer
```

### session-payment-authorizer

Checks for sessions that are within the authorization window and attempts to place a hold on the customer's card.

#### Recommended schedule

Every hour

#### Usage examples

```
# see the man page
yarn daemon session-payment-authorizer --help

# run the send notifications job
yarn daemon session-payment-authorizer
```

### session-payment-processor

Checks for sessions with full attendance (both expert and consumer) and captures the authorized amount of the related orders. This includes the session order and also any extensions that may have occurred during the life of the session.

#### Recommended schedule

Every 30 minutes

#### Usage examples

```
# see the man page
yarn daemon session-payment-processor --help

# run the send notifications job
yarn daemon session-payment-processor
```

### unpaid-session-canceller

Checks for sessions with failed payments that were not updated in the allowed time frame.

#### Recommended schedule

Every hour

#### Usage examples

```
# see the man page
yarn daemon unpaid-session-canceller --help

# run the send notifications job
yarn daemon unpaid-session-canceller
```

## Docker Image

A Docker image is provided with the project to facilitate using the CLI tool across multiple operating systems.

**Important**: Before building the image, create your own `.env` file. Use the `.env.example` as a starting point.

#### Build the Image

To build the image, run the following:

```
# Build the image
docker build --file ./src/daemon/Dockerfile --tag es-daemon .
```

#### Run the Image as a Container

After the image is built, you can use it to run the daemon from within the container like this:

```
# see the man page
docker run es-daemon --help

# run any job
docker run es-daemon notification-sender
docker run es-daemon session-attendance-analyzer
docker run es-daemon session-payment-authorizer
docker run es-daemon session-payment-processor
docker run es-daemon unpaid-session-canceller
```
