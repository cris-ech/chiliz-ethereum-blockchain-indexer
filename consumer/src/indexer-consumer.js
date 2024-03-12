require('dotenv').config();
const {
    initAmqp,
    performHealthCheck,
    processTransactionInput,
} = require('./utils');

const axios = require('axios');
const DB_API_ENDPOINT = process.env.DB_API_ENDPOINT;

// Initialize RabbitMQ connection params
let connection;
let channel;
const queue = 'transactionsQueue';

const consume = async () => {
    if (!connection || !channel) {
        ({ connection, channel } = await initAmqp(queue));
    }

    await performHealthCheck();

    // Ensuring that a queue exists or creating it if it doesn't
    await channel.assertQueue(queue, { durable: false });
    console.log('Waiting for messages in %s.', queue);

    channel.consume(
        queue,
        async msg => {
            console.log('Received: ', msg.content.toString());
            const transaction = JSON.parse(msg.content.toString());
            //Check if the transaction already had a tokensTransferred property dont processTransactionInput
            //If transaction.tokensTransferred is truthy, use it; otherwise, call processTransactionInput
            transaction.tokensTransferred =
                transaction.tokensTransferred ||
                processTransactionInput(transaction);
            //Forward the transaction to the DB API
            try {
                const response = await axios.post(
                    `${DB_API_ENDPOINT}transactions`,
                    transaction
                );
                console.log(response);
                console.log('Transaction forwarded to DB API');
            } catch (error) {
                console.error('Failed to forward transaction to DB API', error);
            }
        },
        { noAck: true }
    );
};

consume();

process.on('exit', () => {
    connection.close();
});
