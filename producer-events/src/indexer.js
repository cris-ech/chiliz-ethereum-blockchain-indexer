/**
 * This script initializes a RabbitMQ connection and listens for new Ethereum blocks.
 * It processes the transactions in the blocks and adds them to a queue.
 */

require('dotenv').config();
const amqp = require('amqplib');
const { Web3 } = require('web3');
const CHZ_ADDRESS = '0x3506424f91fd33084466f402d5d97f05f8e3b4af'; // Replace with the actual contract address
const TOKEN_ABI = require('./token-abi.json');
const { initAmqp, sendToQueue } = require('./utils');

// Initialize web3 with an Ethereum node provider
const web3 = new Web3(process.env.INFURA_WS_ENDPOINT);
const tokenContract = new web3.eth.Contract(TOKEN_ABI, CHZ_ADDRESS);

// Initialize RabbitMQ connection params
let connection;
let channel;
const queue = 'transactionsQueue';

// Add a toJSON method to BigInt to convert it to a string when stringified
BigInt.prototype.toJSON = function () {
    return this.toString();
};

/**
 * Starts listening for new Ethereum blocks and processes the transactions in the blocks.
 * If a startBlock is provided, it starts from that block, otherwise it starts from the latest block.
 *
 * @returns {Promise<void>}
 */
const startListening = async () => {
    if (!connection || !channel) {
        ({ connection, channel } = await initAmqp(queue));
    }

    // Subscribe to events in token contract
    const subscription = tokenContract.events.allEvents();

    subscription.on('data', async event => {
        console.log('New event received:', event);
        await processEvents(event, queue);
    });

    subscription.on('error', error => {
        console.error('Event subscription error:', error);
    });
};

/**
 * Processes a list of events and adds them to a queue for further processing.
 *
 * @param {Array} events - The list of events to process.
 * @param {Queue} queue - The queue to add the processed events to.
 * @returns {Promise} A promise that resolves when all events have been processed.
 */
async function processEvents(event, queue) {
    let transaction;
    let transactionHash = event.transactionHash;
    try {
        transaction = await web3.eth.getTransaction(transactionHash);
        console.log('transaction', transaction);
        //check getTokensTransferred
        const tokensTransferred = getTokensTransferred(event);
        if (tokensTransferred > 0) {
            transaction.tokensTransferred = tokensTransferred;
        }
        await sendToQueue(queue, transaction);
    } catch (error) {
        console.error('error');
    }
}

/**
 * Retrieves the number of tokens transferred from the given event.
 * @param {Object} event - The event object.
 * @returns {number} The number of tokens transferred.
 */
function getTokensTransferred(event) {
    let tokensTransferred = 0;
    if (event.event === 'Transfer') {
        tokensTransferred = web3.utils.fromWei(
            event.returnValues.value,
            'ether'
        );
    }
    return tokensTransferred;
}

// Example: Start listening
startListening();

process.on('exit', () => {
    connection.close();
});
