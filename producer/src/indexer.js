require('dotenv').config();
const axios = require('axios');
const amqp = require('amqplib');
const { Web3 } = require('web3');
const {
    initAmqp,
    sendToQueue,
    processTransaction,
    performHealthCheck,
} = require('./utils');

const CHZ_ADDRESS = '0x3506424f91fd33084466f402d5d97f05f8e3b4af';
const TOKEN_ABI = require('./token-abi.json');
const START_BLOCK = process.env.START_BLOCK;
const DB_API_ENDPOINT = process.env.DB_API_ENDPOINT;

// Initialize web3 with an Ethereum node provider
const web3 = new Web3(process.env.INFURA_WS_ENDPOINT);
const tokenContract = new web3.eth.Contract(TOKEN_ABI, CHZ_ADDRESS);

// Initialize RabbitMQ connection params
let connection;
let channel;
const queue = 'transactionsQueue';

// Initialize helper state
let latestProcessedBlock;
let startBlock;
let lastProcessedEventBlockNumber;
let startBlockEvent;

// Add a toJSON method to BigInt to convert it to a string when stringified
BigInt.prototype.toJSON = function () {
    return this.toString();
};

/**
 * Starts listening for new Ethereum blocks and processes the transactions in the blocks.
 * If a startBlock is provided, it starts from that block, otherwise it starts from the latest block.
 *
 * @param {number} [startBlockParam] - The starting block number. If not provided, starts from the latest block.
 * @returns {Promise<void>}
 */
const startListening = async startBlockParam => {
    console.log('blockNumber initial:', START_BLOCK);
    if (!connection || !channel) {
        ({ connection, channel } = await initAmqp(queue));
    }

    await performHealthCheck();

    let latest = Number(await web3.eth.getBlockNumber());

    // Fetch the last processed block number from the database or default to the start block
    const { lastProcessedBlockNumber, startBlockNumber, lastEventBlock } =
        await getLastState();
    lastProcessedEventBlockNumber = lastEventBlock;

    // If the start block is greater than the latest block, we will wait for new blocks
    if (Number(startBlockParam) > Number(latest)) {
        startBlock = latest;
        startBlockEvent = latest;
        console.log(`Waiting for new blocks from block ${latest}`);
    }
    // If the last processed block number is not found, we will start from the startBlockParam or the latest block
    else if (!lastProcessedBlockNumber && !lastEventBlock) {
        startBlock = startBlockParam || latest;
        startBlockEvent = startBlock;
        console.log(`Starting from block ${startBlock}`);
    }
    // If startBlockParam is the same as startBlockNumber, we can continue from the last processed block
    else if (Number(startBlockParam) === Number(startBlockNumber)) {
        startBlock = lastProcessedBlockNumber;
        startBlockEvent =
            lastProcessedEventBlockNumber || lastProcessedBlockNumber;
        console.log(`Continuing from block ${startBlock}`);
    }
    // If startBlockParam is not the same as startBlockNumber, start from the startBlockParam or the latest block
    else {
        startBlock = startBlockParam || latest;
        startBlockEvent = startBlock;
        console.log(`Starting from block ${startBlock}`);
    }

    await saveHelperState();

    // Process past events to handle internal transactions
    let pastEvents = await fetchPastEvents(tokenContract, startBlockEvent);
    await processEvents(pastEvents, queue);

    // Process blocks to handle regular transactions that may not have emitted events
    // The other services will handle repeated transactions
    if (startBlock <= latest) {
        try {
            latestProcessedBlock = await processBlocks(
                startBlock,
                latest,
                queue
            );
            await saveHelperState();
        } catch (error) {
            console.error('Error processing blocks:', error);
            // Handle the error
            await saveHelperState();
        }
    }

    let subscription;
    try {
        subscription = await web3.eth.subscribe('newHeads');
    } catch (error) {
        console.error('Error subscribing to new heads:', error);
        // Attempt to reconnect
        setTimeout(startListening, 5000, startBlock);
        return;
    }

    //if no block processed yet set lattestProcessedBlock to startBlock
    if (!latestProcessedBlock) {
        latestProcessedBlock = startBlock;
    }

    subscription.on('data', async blockHeader => {
        console.log('New blockheader received:', blockHeader.number);
        let blockHeaderConverted;
        if (typeof blockHeader.number === 'bigint') {
            blockHeaderConverted = Number(blockHeader.number);
        } else {
            blockHeaderConverted = blockHeader.number;
        }

        if (blockHeaderConverted > latestProcessedBlock) {
            try {
                latestProcessedBlock = await processBlocks(
                    latestProcessedBlock + 1,
                    blockHeader.number,
                    queue
                );
            } catch (error) {
                console.error('Error processing blocks:', error);
                // Handle the error
            }
        }
        await saveHelperState();
    });

    subscription.on('error', error => {
        console.error('Subscription error:', error);
        // Attempt to reconnect
        setTimeout(startListening, 5000, startBlock);
    });
};

/**
 * Processes blocks from startBlock to latest and adds transactions to the queue.
 *
 * @param {number} startBlock - The starting block number.
 * @param {number} latest - The latest block number.
 * @param {Array} queue - The queue to add transactions to.
 * @returns {Promise<number>} - The latest processed block number.
 */
async function processBlocks(startBlock, latest, queue) {
    let latestProcessedBlockInFunction = startBlock;

    for (let i = startBlock; i <= latest; i++) {
        try {
            let block = await web3.eth.getBlock(i, true);
            console.log('Processing block:', block.number);
            if (block.transactions?.length > 0) {
                for (let tx of block.transactions) {
                    await processTransaction(queue, tx);
                }
            }
            latestProcessedBlockInFunction = i;
            latestProcessedBlock = i;
            await saveHelperState();
        } catch (error) {
            console.error(`Error processing block ${i}:`, error);
            // Handle the error
            return latestProcessedBlockInFunction - 1;
        }
    }

    return latestProcessedBlockInFunction;
}

/**
 * Fetches past events from a token contract.
 * @param {Object} tokenContract - The token contract object.
 * @param {number} fromBlock - The starting block number.
 * @returns {Promise<Array>} - A promise that resolves to an array of events.
 */
async function fetchPastEvents(tokenContract, fromBlock) {
    let events;
    try {
        events = await tokenContract.getPastEvents('allEvents', {
            fromBlock: fromBlock,
            toBlock: 'latest',
        });
    } catch (error) {
        console.error(error);
    }
    return events;
}

/**
 * Processes a list of events and adds them to a queue for further processing.
 *
 * @param {Array} events - The list of events to process.
 * @param {Queue} queue - The queue to add the processed events to.
 * @returns {Promise} A promise that resolves when all events have been processed.
 */
async function processEvents(events, queue) {
    for (let event of events) {
        let transaction;
        try {
            transaction = await web3.eth.getTransaction(event.transactionHash);
            //check getTokensTransferred
            const tokensTransferred = getTokensTransferred(event);
            if (tokensTransferred > 0) {
                transaction.tokensTransferred = tokensTransferred;
            }
            await sendToQueue(queue, transaction);
            lastProcessedEventBlockNumber = transaction.blockNumber;
            await saveHelperState();
        } catch (error) {
            console.error(error);
        }
    }
    console.log('Events processed:', events.length);
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

/**
 * Retrieves the last state from the database.
 * @returns {Promise<Object>} The last state object containing the last processed block number and the start block number.
 */
async function getLastState() {
    try {
        const response = await axios.get(`${DB_API_ENDPOINT}helper/`);
        return response.data;
    } catch (error) {
        console.error(
            'Could not fetch last block number, defaulting to start.'
        );
        return { lastProcessedBlockNumber: false, startBlockNumber: false };
    }
}

/**
 * Saves the helper state by making a POST request to the DB API endpoint.
 * @async
 * @function saveHelperState
 * @returns {Promise<void>} A Promise that resolves when the helper state is successfully saved.
 */
async function saveHelperState() {
    try {
        await axios.post(`${DB_API_ENDPOINT}helper/`, {
            lastProcessedBlockNumber: latestProcessedBlock,
            startBlockNumber: startBlock,
            lastProcessedEventBlockNumber: lastProcessedEventBlockNumber,
        });
        console.log('Successfully saved last processed block number.');
    } catch (error) {
        console.error(
            'Failed to save last processed block number:',
            error.message
        );
    }
}

/**
 * Gracefully shuts down the application.
 * Closes the connection and saves the helper state before exiting the process.
 * @returns {Promise<void>} A promise that resolves when the shutdown process is complete.
 */
function gracefulShutdown() {
    console.log('Shutting down gracefully...');
    connection.close();
    saveHelperState()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Failed during graceful shutdown:', error);
            process.exit(1);
        });
}

// Example: Start listening
startListening(START_BLOCK);

process.on('exit', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
