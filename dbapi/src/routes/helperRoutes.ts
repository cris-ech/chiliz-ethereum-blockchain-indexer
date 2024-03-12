import express from 'express';
import { createOrUpdateBlockNumber, getBlockNumber } from '../controllers/helperController'; // Adjust the import path as necessary

const helperRouter = express.Router();

helperRouter.post('/', createOrUpdateBlockNumber);
helperRouter.get('/', getBlockNumber);

export default helperRouter;