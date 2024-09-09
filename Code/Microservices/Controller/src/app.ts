import dotenv from 'dotenv';
import express from 'express';
import dbClient from "./components/DBClient";
import logger from "./logger";
import { RabbitMQClient } from "./components/RabbitMQClient";
import createAPIRouter from './route/createAPIRouter';
import cors from 'cors';

dotenv.config();

const PORT = process.env.PORT || 5000;
const exchange = process.env.EXCHANGE_NAME || 'requests_exchange';
const rabbitURL = process.env.RABBIT_URL || 'amqp://myuser:mypass@localhost:5672';
const DATABASE_URL = process.env.DB_URL || 'mongodb://localhost:27017/mydb';
const secret = process.env.JWT_SECRET || 'fd5ac1609d0f2d6a5b7c91385c09669f36137c427abdc4613b51c714ee47e9b6f8c4fd1f65d7bb2a79a00af7274aee19874c77148397aaaac82473eaadc4fc14';

const app = express();
const rabbitMQClient = new RabbitMQClient(rabbitURL, exchange);

const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    if (origin && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))) {
      callback(null, true);  
    } 
    else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};
  
app.use(cors(corsOptions));

app.use(express.json());
app.use('/api', createAPIRouter(rabbitMQClient, secret));  

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'up', timestamp: new Date().toISOString() });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error(`An error occurred: ${err.message}`);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

async function startServer() {
    try {
        await (dbClient.connectToDB(DATABASE_URL).then(() => { dbClient.createTables()}));
        logger.info('Connected to database and created tables');
        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        logger.error('An error has occurred: ' + error);
    }
}

startServer();
