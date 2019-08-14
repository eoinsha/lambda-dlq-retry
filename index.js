'use strict';

const AWS = require('aws-sdk');
const once = require('once');

const sqs = new AWS.SQS({endpoint: process.env.SQS_ENDPOINT_URL});

const DLQ_QUEUE_NAME = process.env.DLQ_QUEUE_NAME;
const MAX_MESSAGES = process.env.DLQ_RETRY_MAX_MESSAGES || 10;

function dlqHandlerCreator({handler, log = console}) {
  const queueUrlPromise = sqs
    .getQueueUrl({
      QueueName: DLQ_QUEUE_NAME,
    })
    .promise()
    .then(({QueueUrl: queueUrl}) => {
      log.debug({queueUrl}, 'Using queue URL');
      return queueUrl;
    });

  function retry(event) {
    return queueUrlPromise.then(queueUrl => {
      return sqs
        .receiveMessage({QueueUrl: queueUrl, MaxNumberOfMessages: MAX_MESSAGES})
        .promise()
        .then(data => {
          if (data.Messages) {
            const count = data.Messages.length;
            return handleSqsMessages(data.Messages, {queueUrl}).then(() => ({
              count,
            }));
          }
        });
    });
  }

  function handleSqsMessages(sqsMessages, {queueUrl}) {
    if (sqsMessages.length > 0) {
      const [message, ...rest] = sqsMessages;
      const {
        Body: body,
        MessageId: messageId,
        ReceiptHandle: receiptHandle,
      } = message;

      log.debug({messageId}, 'Handling SQS DLQ Messges');

      const dlqEvent = JSON.parse(body);

      return new Promise((resolve, reject) => {
        const successHandler = once(result =>
          sqs
            .deleteMessage({
              QueueUrl: queueUrl,
              ReceiptHandle: receiptHandle,
            })
            .promise()
            .then(() => resolve(result)),
        );

        const errorHandler = once(err => reject(err));
        let handlerResult;
        try {
          handlerResult = handler(dlqEvent, {}, (err, result) => {
            if (err) {
              return errorHandler(err);
            }
            successHandler(null, result);
          });
        } catch (err) {
          return errorHandler(err);
        }

        if (handlerResult) {
          if (handlerResult.then && handlerResult.catch) {
            handlerResult.then(successHandler).catch(errorHandler);
          } else {
            successHandler(handlerResult);
          }
        }
      }).then(() => handleSqsMessages(rest, {queueUrl}));
    }
  }

  return retry;
}

module.exports = dlqHandlerCreator;
