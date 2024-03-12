import { Request, Response } from 'express';
import { Transaction } from '../models/transactionModel';



export const createTransaction = async (req: Request, res: Response) => {
/**
  /transactions/:
    post:
      summary: "Create a new transaction"
      description: "Add a new transaction to the database"
      #swagger.requestBody = {
         required: true,
         content: {
             "application/json": {
                schema: { $ref: "#/components/schemas/Transaction" },
                 examples: {
                     transaction: {
                         summary: "Transaction example",
                         value: {
                             accessList: [],
                             blockHash: "0xabcd...",
                             blockNumber: "0x10d4f...",
                             chainId: "0x1...",
                            from: "0x1a2b3c...",
                            gas: "0x5208...",
                             gasPrice: "0x2540be400...",
                             hash: "0x123...",
                             input: "0x...",
                             maxFeePerGas: "0x...",
                             maxPriorityFeePerGas: "0x...",
                             nonce: "0x1...",
                             r: "0x...",
                             s: "0x...",
                             to: "0x...",
                             transactionIndex: "0x1...",
                             type: "0x0...",
                             v: "0x...",
                             value: "0x...",
                             tokensTransferred: 100
                         }
                     }
                 }
             }
         }
      }
 */
   try {
        const newTransaction = new Transaction(req.body);
        await newTransaction.save();
        res.status(201).json(newTransaction);
    } catch (error) {
        if (error.code === 11000) { // MongoDB duplicate key error
            res.status(409).json({ message: "Duplicate transaction" }); // HTTP 409 Conflict
        } else {
            res.status(500).json({ message: error.message });
        }
    }
};

export const getTransactions = async (_: Request, res: Response) => {
  try {
    const transactions = await Transaction.find();
    res.status(200).json(transactions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    res.status(200).json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


/**
 * Retrieves the total number of tokens transferred since a given block number.
 * @param req - The request object.
 * @param res - The response object.
 * @returns A JSON response containing the total number of tokens transferred.
 */
export const getTokensTransferredSinceBlock = async (req: Request, res: Response) => {
  const fromBlock = parseInt(req.params.blocknumber); // Ensure blockNumber is treated as an integer

  try {
    const result = await Transaction.aggregate([
      { $match: { blockNumber: { $gte: fromBlock.toString() } } },
      { $group: { _id: null, totalTokensTransferred: { $sum: "$tokensTransferred" } } }
    ]);

    // Check if there are any results
    if (result.length > 0) {
      res.status(200).json({ totalTokensTransferred: result[0].totalTokensTransferred });
    } else {
      res.status(200).json({ totalTokensTransferred: 0 }); // No transactions found since the given block
    }
  } catch (error) {
    console.error('Error fetching total tokens transferred:', error);
    res.status(500).json({ error: 'Error fetching total tokens transferred' }); // Handle errors gracefully
  }
};
