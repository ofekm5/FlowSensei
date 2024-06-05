"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const logger_1 = __importDefault(require("./logger"));
//import cron from 'node-cron';
const APIClient_1 = __importDefault(require("./components/APIClient"));
// import transporter from './components/TransportMonitor'
// import transceiver from './components/MQTransceiver';
const app = (0, express_1.default)();
//let isRunning = false;
async function test() {
    try {
        await APIClient_1.default.connectSSH().then(() => {
            return APIClient_1.default.login();
        });
        console.log('SSH and API connection established, and user logged in');
    }
    catch (error) {
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
    logger_1.default.info(`Server is running on port ${PORT}`);
});
