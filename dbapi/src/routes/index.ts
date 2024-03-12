import express from 'express';
import transactionRouter from './transactionRoutes';
import helperRouter from './helperRoutes';

export const routes = express.Router();

routes.use('/transactions', transactionRouter);
routes.use('/helper', helperRouter);