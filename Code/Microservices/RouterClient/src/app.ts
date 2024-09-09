import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import logger from './logger';
import MessageProcessor from './components/MQClient';
import apiClient from './components/APIClient';
import cron from 'node-cron';

dotenv.config();
const PORT = process.env.PORT || 3000;
const exchange = process.env.EXCHANGE_NAME || 'requests_exchange';
const rabbitMqUrl = process.env.RABBIT_URL || 'amqp://myuser:mypass@localhost:5672';
const hourLimitInterval = process.env.HOUR_LIMIT_INTERVAL || 2;

const app = express();

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'up', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    const messageProcessor = new MessageProcessor();
    messageProcessor.ConnectToRabbit(rabbitMqUrl, exchange);
    
    logger.info(`Server is running on port ${PORT}`);

    cron.schedule(`0 */${hourLimitInterval} * * *`, async () => {
        try {
            await apiClient.adjustLimit();
            logger.info('Successfully ran adjustLimit cron job');
        } catch (error:any) {
            logger.error(`Failed to run adjustLimit cron job: ${error.message}`);
        }
    });
});

export default app;