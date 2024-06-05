import express, { Request, Response } from 'express';
import logger from './logger';
//import cron from 'node-cron';
import apiClient from './components/APIClient';
// import transporter from './components/TransportMonitor'
// import transceiver from './components/MQTransceiver';
const app = express();
//let isRunning = false;
async function test() {
    try {
        await apiClient.connectSSH().then(() => {
            return apiClient.login();
        });
        console.log('SSH and API connection established, and user logged in');
    } catch (error) {
        console.error('Failed to establish SSH and API connection or login:', error);
    }
}

test();
//Cron job is added to the event loop and executed every 10sec
// cron.schedule('*/10 * * * * *', () => {
//     try {
//         if (!isRunning) {
//             isRunning = true;
//             transceiver.consumeAndSendMessages();//write here the tested function
//             isRunning = false;
//         } 
//         else {
//             logger.info("Previous task still running. Skipping...");
//         }
//     } 
//     catch (error) {
//         logger.error(`${error}`);
//     }
// });

// cron.schedule(`*/${transporter.interval}* * * * *`, () => {
//     const data = transporter.fetchRouterTransport();
//     transceiver.sendMessage(data);
// })
  
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'up', timestamp: new Date().toISOString() });
});
  
const PORT = process.env.PORT || 5000;
  
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});
