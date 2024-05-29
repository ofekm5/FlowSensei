import express, { Request, Response } from 'express';
import logger from './logger';
import cron from 'node-cron';
import dotenv from 'dotenv';
import transporter from './components/TransportMonitor'
import transceiver from './components/MQTransceiver';
import publisher   from './components/MQPublisher';
import consumer from './components/MQConsumer';
dotenv.config();

const app = express();
let isRunning = false;
(async () => {
    await initializeConsumerAndPublisher();
})();

//Cron job is added to the event loop and executed every 10sec
cron.schedule('*/10 * * * * *', () => {
    try {
        if (!isRunning) {
            isRunning = true;
            consumer.consume();
            consumer.events.on('message', (message: any) => {
                logger.info('Message received: ' + message);
                //process the message and later sending the answer
                //publisher.publish({ message: 'Message received'); 
            });
            transceiver.consumeAndSendMessages();//write here the tested function
            isRunning = false;
        } 
        else {
            logger.info("Previous task still running. Skipping...");
        }
    } 
    catch (error) {
        logger.error(`${error}`);
    }
});
cron.schedule(`*/${transporter.interval}* * * * *`, () => {
    const data = transporter.fetchRouterTransport();
    transceiver.sendMessage(data);
})

async function initializeConsumerAndPublisher() {
    await consumer.initConsumer();
    await publisher.initPublisher();
}
  
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'up', timestamp: new Date().toISOString() });
});
  
const PORT = process.env.PORT || 5000;
  
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});


