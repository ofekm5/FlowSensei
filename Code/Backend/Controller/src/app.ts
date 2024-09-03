import dotenv from 'dotenv';
import express from 'express';
import dbClient from "./components/DBClient";
import logger from "./logger";
import { RabbitMQClient } from "./components/RabbitMQClient";
import createRouter from './Router';

dotenv.config();

const PORT = process.env.PORT || 5000;
const exchange = process.env.EXCHANGE_NAME || 'requests_exchange';
const rabbitURL = process.env.RABBIT_URL || 'amqp://myuser:mypass@localhost:5672';
const DATABASE_URL = process.env.DB_URL || 'mongodb://localhost:27017/mydb';

const app = express();
const rabbitMQClient = new RabbitMQClient(rabbitURL, exchange);

app.use(express.json());
app.use('/api', createRouter(rabbitMQClient));  

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
