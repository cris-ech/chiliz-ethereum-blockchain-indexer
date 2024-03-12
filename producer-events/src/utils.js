const amqp = require('amqplib');
const CHZ_ADDRESS = '0x3506424f91fd33084466f402d5d97f05f8e3b4af';

let connection, channel;

/**
 * Initializes the AMQP connection and channel.
 * @returns {Promise<{connection: Object, channel: Object}>} A promise that resolves when the AMQP connection and channel are successfully initialized.
 */
async function initAmqp(queue) {
    try {
        connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertQueue(queue, { durable: false });
        return { connection, channel };
    } catch (error) {
        console.error(
            'Failed to initialize AMQP connection: TRYING AGAIN IN 5 SECONDS...',
            error
        );
        // Retry after a delay
        await new Promise(resolve => setTimeout(resolve, 5000));
        return initAmqp(queue);
    }
}

/**
 * Sends a transaction to the specified queue.
 *
 * @param {string} queue - The name of the queue to send the transaction to.
 * @param {object} transaction - The transaction object to send.
 * @returns {Promise<void>} - A promise that resolves when the transaction is sent.
 */
async function sendToQueue(queue, transaction) {
    if (!connection || !channel) {
        await initAmqp();
    }

    channel.sendToQueue(queue, Buffer.from(JSON.stringify(transaction)));

    console.log('Sent: ', transaction);
}

/**
 * Processes a transaction and sends it to the queue if the recipient address matches CHZ_ADDRESS.
 *
 * @param {Queue} queue - The queue to send the transaction to.
 * @param {Transaction} tx - The transaction to process.
 * @returns {Promise<void>} - A promise that resolves when the transaction is processed.
 */
async function processTransaction(queue, tx) {
    if (tx.to && tx.to.toLowerCase() === CHZ_ADDRESS.toLowerCase()) {
        console.log('CHZ Transaction Found:', tx);
        // Send the transaction to the queue
        sendToQueue(queue, tx);
    }
}

module.exports = {
    initAmqp,
    sendToQueue,
    processTransaction,
};
