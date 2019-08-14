# lambda-dlq-retry

[![license](https://img.shields.io/npm/l/lambda-dlq-retry.svg)](./LICENSE)

This module providedes the functionality for you to build a Lambda function that retries messages from a Dead Letter Queue (DLQ) for another Lambda. It pulls messages from the SQS DLQ (up to 10 at a time) and passes them back to the original Lambda function in sequence.

`lambda-dlq-retry` allows you to inspect messages in the DLQ and manually trigger a retry by invoking a retry Lambda.


## Usage

To use `lambda-dlq-retry`, you define a retry Lambda function which passes the event to `lambda-dlq-retry`. You just need to set the `DLQ_QUEUE_NAME` and pass the original handler function. Your deployment should

```
npm install --save lambda-dlq-retry
```

Add a `dlq-handler.js`:

```javascript
const lambdaDlqRetry = require('lambda-dlq-retry')
const handler = require('./handler')

module.exports = {
  retry: lambdaDlqRetry({ handler: handler.original })
}
```

If you are using the Serverless Framework, the following is an example of the `serverless.yml` configuration. It creates the SQS queue and sets it as the Dead Letter Queue for the Lambda function. This example has all the relevant Serverless Framework configuration to do that.

```yaml
functions
  original:
    handler: handler.original
    onError: !GetAtt dlq.Arn
  retryDlq:
    handler: dlq-handler.retry
    environment:
      DLQ_QUEUE_NAME: ${self:custom.dlqQueueName}

resources:
  Resources:
    dlq:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: ${self:provider.stage}-my-dlq
        MessageRetentionPeriod: 86400 # 1 day
```

## Configuration

Environment variables:

- `DLQ_QUEUE_NAME`: Required. The name of the queue where failed messages have been sent.
- `DLQ_RETRY_MAX_MESSAGES`: The maximum number of messages to retrieve and process for a single 'retry' invocation. The default is 10.

You can also pass a logger to `lambda-dlq-retry` to get debug-level logs on execution. By default, the `console` object is used.

```javascript
  retry: lambdaDlqRetry({ handler: handler.original, log: customLogger })
```

## LICENSE

[MIT](./LICENSE)

