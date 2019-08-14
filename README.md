# lambda-dlq-retry

[![license](https://img.shields.io/npm/l/lambda-dlq-retry.svg)](./LICENSE)

## Configuration

Environment variables:
`DLQ_QUEUE_NAME`: Required. The name of the queue where failed messages have been sent

`DLQ_RETRY_MAX_MESSAGES`: The maximum number of messages to retrieve and process for a single 'retry' invocation. The default is  10

## Usage

```
npm install --save lambda-dlq-retry
```

In `serverless.yml`:

```
asdf
```

## LICENSE

[MIT](./LICENSE)

