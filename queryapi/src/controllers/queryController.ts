require('dotenv').config();
import { Request, Response } from 'express';
import { Transaction } from '../models/transactionModel';
import axios from 'axios';
const {Web3} = require('web3');
const DB_API_ENDPOINT = process.env.DB_API_ENDPOINT;
const CHZ_ADDRESS = '0x3506424f91fd33084466f402d5d97f05f8e3b4af';

const web3 = new Web3(process.env.INFURA_WS_ENDPOINT);

interface TokenTransferResult {
  totalTokensTransferred: number;
}

const getTotalTokensTransferredSinceBlock = async (blockNumber: number): Promise<TokenTransferResult> => {
  try {
    const response = await axios.get(`${DB_API_ENDPOINT}transactions/tokensTransferedSinceBlock/${blockNumber}`);
    return response.data;
  } catch (error) {
    console.error('Error calling dbapi to get tokens transferred:', error);
    throw new Error('Failed to get tokens transferred data from dbapi');
  }
};


export const handleGetTotalTokensTransferredSinceBlock = async (req: Request, res: Response) => {
  try {
    const helperState = await axios.get(`${DB_API_ENDPOINT}helper/`);
    const blockNumber = helperState.data.startBlockNumber;

    const result = await getTotalTokensTransferredSinceBlock(blockNumber);
    res.json(result);
  } catch (error) {
    console.error('Error fetching total tokens transferred:', error);
    res.status(500).json({ error: 'Error fetching total tokens transferred' });
  }
};

/**
 * Checks if a transaction interacts with a specific contract.
 * @param {string} transactionHash - The hash of the transaction to check.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the transaction interacts with the contract.
 */
async function checkTransactionInteractionHelper(transactionHash) {
    try {
        const tx = await web3.eth.getTransaction(transactionHash);
        if (!tx) {
            console.log('Transaction not found');
            return false;
        }

        // Check for direct interaction: Transaction's `to` address matches the contract address
        const directInteraction = tx.to && tx.to.toLowerCase() === CHZ_ADDRESS.toLowerCase();

        // Fetch the transaction receipt to check for indirect interaction via logs
      const receipt = await web3.eth.getTransactionReceipt(transactionHash);
      console.log('receipt:', receipt);
        const indirectInteraction = receipt.logs.some(log => log.address.toLowerCase() === CHZ_ADDRESS.toLowerCase());

        return directInteraction || indirectInteraction;
    } catch (error) {
        console.error('Error checking transaction interaction:', error);
        return false;
    }
}

export const isChzInteraction = async (req: Request, res: Response) => {
  const { transactionHash } = req.params;

  const isInteraction = await checkTransactionInteractionHelper(transactionHash);
  res.status(200).json({ isInteraction });
    
};