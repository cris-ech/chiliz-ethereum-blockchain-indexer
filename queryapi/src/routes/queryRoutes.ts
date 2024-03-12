import express from 'express';
import * as queryController from '../controllers/queryController';

const queryRouter = express.Router();

queryRouter.get('/total-tokens-transferred', queryController.handleGetTotalTokensTransferredSinceBlock);
queryRouter.get('/isChzInteraction/:transactionHash', queryController.isChzInteraction);



export default queryRouter;
