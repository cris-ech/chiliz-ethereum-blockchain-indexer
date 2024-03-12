import express from 'express';
import queryRouter from './queryRoutes';

export const routes = express.Router();

routes.use('/query', queryRouter );