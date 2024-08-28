import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import logger from './logger';
import initMQTransport from './components/MQClient';
import apiClient from './components/APIClient';
import cron from 'node-cron';

dotenv.config();
const app = express();

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'up', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    initMQTransport();
    logger.info(`Server is running on port ${PORT}`);

    cron.schedule('0 */3 * * *', async () => {
        try {
            await apiClient.adjustLimit();
            logger.info('Successfully ran adjustLimit cron job');
        } catch (error:any) {
            logger.error(`Failed to run adjustLimit cron job: ${error.message}`);
        }
    });
});
