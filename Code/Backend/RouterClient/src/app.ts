import express, { Request, Response } from 'express';
import logger from './logger';
import cron from 'node-cron';
import dotenv from 'dotenv';
import transporter from './components/TransportMonitor'
import transceiver from './components/MQTransceiver';
dotenv.config();

const app = express();
let isRunning = false;

//Cron job is added to the event loop and executed every 10sec
cron.schedule('*/10 * * * * *', () => {
    try {
        if (!isRunning) {
            isRunning = true;
            transceiver.consumeAndSendMessages();//write here the tested function
            isRunning = false;
        } 
        else {
            logger.info("Previous task still running. Skipping...");
        }
    } 
    catch (error) {
        logger.error(error);
    }
});
cron.schedule(`*/${transporter.interval}* * * * *`, () => {
    const data = transporter.fetchRouterTransport();
    transceiver.sendMessage(data);
})
  
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'up', timestamp: new Date().toISOString() });
});
  
const PORT = process.env.PORT || 5000;
  
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});
