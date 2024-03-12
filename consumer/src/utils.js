require('dotenv').config();
const amqp = require('amqplib');
const axios = require('axios');
const { Web3 } = require('web3');
const web3 = new Web3();
const DB_API_ENDPOINT = process.env.DB_API_ENDPOINT;

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
 * Performs a health check by making a request to the DB API endpoint.
 * Keeps retrying until a successful response is received.
 * @returns {Promise<void>} A promise that resolves when the health check is successful.
 */
async function performHealthCheck() {
    let healthCheck = false;
    while (!healthCheck) {
        try {
            const response = await axios.get(
                `${DB_API_ENDPOINT}transactions/test`
            );
            if (response.status === 200) {
                healthCheck = true;
            }
        } catch (error) {
            console.error('DB API not ready, waiting 10 seconds');
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }
}

/**
 * Processes the input data of a transaction and returns the amount of tokens transferred.
 *
 * @param {object} tx - The transaction object.
 * @returns {number} The amount of tokens transferred.
 */
function processTransactionInput(tx) {
    const inputData = tx.input;
    console.log('inputData', inputData);
    const transferAbi = web3.eth.abi.encodeFunctionSignature(
        'transfer(address,uint256)'
    );
    const methodSignature = transferAbi.slice(0, 10);
    if (inputData.startsWith(methodSignature)) {
        const paramsData = inputData.slice(10);
        const params = web3.eth.abi.decodeParameters(
            ['address', 'uint256'],
            paramsData
        );
        const amountInTokens = web3.utils.fromWei(params[1], 'ether');
        console.log(`Transfer to: ${params[0]}, amount: ${amountInTokens}`);
        return amountInTokens;
    }
    return 0;
}

module.exports = { initAmqp, performHealthCheck, processTransactionInput };
