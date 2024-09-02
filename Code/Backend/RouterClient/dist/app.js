"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = __importDefault(require("./logger"));
const APIClient_1 = __importDefault(require("./components/APIClient"));
const node_cron_1 = __importDefault(require("node-cron"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'up', timestamp: new Date().toISOString() });
});
app.get('/test-api-client', async (req, res) => {
    const routerID = '1';
    const i_Host = '147.235.196.0';
    const i_Username = 'admin';
    const i_Password = '9DCMK8E5PU';
    try {
        // Test login
        await APIClient_1.default.login(i_Host, i_Username, i_Password, routerID);
        // Test markService
        await APIClient_1.default.markService(routerID, {
            service: 'testService',
            protocol: 'tcp',
            dstPort: '80',
            srcPort: '1234',
            srcAddress: '192.168.0.1',
            dstAddress: '192.168.0.2',
        });
        // Test addNodeToQueueTree
        await APIClient_1.default.addNodeToQueueTree(routerID, {
            name: 'testNode',
            parent: 'global',
            packetMark: 'testPacketMark',
            priority: '1',
        });
        // Test updateNodePriority
        await APIClient_1.default.updateNodePriority(routerID, 'testNode', '2');
        // Test deleteNodeFromGlobalQueue
        await APIClient_1.default.deleteNodeFromGlobalQueue(routerID, 'testNode');
        // Test disconnect
        await APIClient_1.default.disconnect(routerID);
        res.status(200).json({ status: 'success', message: 'APIClient methods executed successfully' });
    }
    catch (error) {
        logger_1.default.error(`Error testing APIClient methods: ${error.message}`);
        res.status(500).json({ status: 'error', message: error.message });
    }
});
const PORT = process.env.PORT || 3000;
const exchange = process.env.EXCHANGE_NAME || 'requests_exchange';
const rabbitMqUrl = process.env.RABBIT_URL || 'amqp://myuser:mypass@localhost:5672';
app.listen(PORT, () => {
    // const messageProcessor = new MessageProcessor();
    // messageProcessor.ConnectToRabbit(rabbitMqUrl, exchange);
    logger_1.default.info(`Server is running on port ${PORT}`);
    node_cron_1.default.schedule('0 */3 * * *', async () => {
        try {
            await APIClient_1.default.adjustLimit();
            logger_1.default.info('Successfully ran adjustLimit cron job');
        }
        catch (error) {
            logger_1.default.error(`Failed to run adjustLimit cron job: ${error.message}`);
        }
    });
});
exports.default = app;
// app.get('/health', (req: Request, res: Response) => {
//     res.status(200).json({ status: 'up', timestamp: new Date().toISOString() });
// });
// const PORT = process.env.PORT || 5000;
// const exchange = process.env.EXCHANGE_NAME || 'requests_exchange';
// const rabbitMqUrl = process.env.RABBIT_URL || 'amqp://myuser:mypass@localhost:5672';
// app.listen(PORT, () => {
//     const messageProcessor = new MessageProcessor();
//     messageProcessor.ConnectToRabbit(rabbitMqUrl, exchange);
//     logger.info(`Server is running on port ${PORT}`);
//     cron.schedule('0 */3 * * *', async () => {
//         try {
//             await apiClient.adjustLimit();
//             logger.info('Successfully ran adjustLimit cron job');
//         } catch (error:any) {
//             logger.error(`Failed to run adjustLimit cron job: ${error.message}`);
//         }
//     });
// });
