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

const app = express();

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'up', timestamp: new Date().toISOString() });
});

app.get('/test-api-client', async (req: Request, res: Response) => {
    const routerID = '1';
    const i_Host = '147.235.196.0';
    const i_Username = 'admin';
    const i_Password = '9DCMK8E5PU';

    try {
        // Test login
        await apiClient.login(i_Host, i_Username, i_Password, routerID);
        
        // Test markService
        await apiClient.markService(routerID, {
            service: 'testService',
            protocol: 'tcp',
            dstPort: '80',
            srcPort: '1234',
            srcAddress: '192.168.0.1',
            dstAddress: '192.168.0.2',
        });
        
        // Test addNodeToQueueTree
        await apiClient.addNodeToQueueTree(routerID, {
            name: 'testNode',
            parent: 'global',
            packetMark: 'testPacketMark',
            priority: '1',
        });

        // Test updateNodePriority
        await apiClient.updateNodePriority(routerID, 'testNode', '2');

        // Test deleteNodeFromGlobalQueue
        await apiClient.deleteNodeFromGlobalQueue(routerID, 'testNode');

        // Test disconnect
        await apiClient.disconnect(routerID);

        res.status(200).json({ status: 'success', message: 'APIClient methods executed successfully' });
    } catch (error:any) {
        logger.error(`Error testing APIClient methods: ${error.message}`);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.listen(PORT, () => {
    const messageProcessor = new MessageProcessor();
    messageProcessor.ConnectToRabbit(rabbitMqUrl, exchange);
    
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

export default app;