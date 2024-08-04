import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import logger from './logger';
import initMQTransport from './components/MQClient';

dotenv.config();
const app = express();
  
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'up', timestamp: new Date().toISOString() });
});
  
const PORT = process.env.PORT || 5000;
  
app.listen(PORT, () => {
    initMQTransport();
    logger.info(`Server is running on port ${PORT}`);
});
