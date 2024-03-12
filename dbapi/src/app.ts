require('dotenv').config();
import express from "express";
import * as bodyParser from "body-parser";
import transactionRoutes from "./routes/transactionRoutes";
import swaggerUi from "swagger-ui-express";
import swaggerOutput from "./swagger_output.json";
import mongoose from "mongoose";
import { routes } from "./routes";

const app = express();
const port = process.env.PORT || 3001;
const mongoUri = process.env.MONGO_URI;

mongoose.connect(mongoUri)
    .then(() => console.log('MongoDB connection established'))
    .catch((error) => console.error('MongoDB connection error:', error));

app.use(bodyParser.json());

app.use('/', routes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerOutput));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});