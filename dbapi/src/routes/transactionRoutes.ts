import express from 'express';
import * as transactionController from '../controllers/transactionController';

const transactionRouter = express.Router();

transactionRouter.get('/test', (req, res) => { res.send('Hello from transactionRoutes') });
transactionRouter.get('/tokensTransferedSinceBlock/:blocknumber', transactionController.getTokensTransferredSinceBlock);
transactionRouter.post('/', transactionController.createTransaction);
transactionRouter.get('/', transactionController.getTransactions);
transactionRouter.get('/:id', transactionController.getTransactionById);
transactionRouter.put('/:id', transactionController.updateTransaction);
transactionRouter.delete('/:id', transactionController.deleteTransaction);



export default transactionRouter;
