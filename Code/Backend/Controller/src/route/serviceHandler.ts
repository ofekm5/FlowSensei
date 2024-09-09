import dbClient from "../components/DBClient";
import logger from "../logger";
import { RabbitMQClient } from "../components/RabbitMQClient";
import { Node } from "../types";

export const createServiceHandler = async (req: any, res: any, rabbitMQClient: RabbitMQClient) => {
    try {
        const msg = req.body;
        const routerId = req.routerId;
        const service = msg.service;

        if (!msg || !service) {
            res.status(400).json({ error: 'invalid request' });
            logger.info('Invalid request: ' + msg);
            return;
        }

        const minPriorityResult = await dbClient.getMinPriority(routerId);
        let priority = minPriorityResult ? minPriorityResult.priority - 1 : 1;  // Default to 1 if no services exist

        await dbClient.insertService(
            service.name,
            service.protocol,
            service.dstPort,
            service.srcPort || '',  // Optional
            service.srcAddress || '',  // Optional
            service.dstAddress || ''   // Optional
        );

        await dbClient.insertServicePriority(routerId, service.name, priority);
        await rabbitMQClient.markService(service, routerId);

        const node: Node = { serviceName: service.name, parent: 'root', priority: String(priority) };
        await rabbitMQClient.addNodeToQueueTree(node, routerId);

        logger.info(`Inserted service: ${service} with priority: ${priority}`);
        res.status(200).json({ response: "Created new priority queue successfully" });
    } 
    catch (error) {
        logger.error('An error has occurred: ' + error);
        res.status(500).json({ error: 'An error has occurred ' + error });
    }
};


export const updateServiceHandler = async (req: any, res: any, rabbitMQClient: RabbitMQClient) => {
    try {
        const msg = req.body;
        const routerId = req.routerId;

        if (!msg || !msg.serviceName || !msg.priority || !routerId) {
            res.status(400).json({ error: 'Invalid request' });
            logger.info('Invalid request: ' + JSON.stringify(msg));
            return;
        }

        const serviceName = msg.serviceName;
        const priority = msg.priority;

        logger.info(`Updating service ${serviceName} with priority ${priority} for router ${routerId}`);

        await dbClient.updatePriority(routerId, serviceName, priority);
        logger.info(`Updated priority: ${priority} for service: ${serviceName} in DB`);

        await rabbitMQClient.updateNodePriority(routerId, serviceName, priority);
        logger.info(`Updated priority queue for service: ${serviceName} in router`);

        res.status(200).json({ response: `Updated priority for service: ${serviceName} successfully` });
    } catch (error) {
        logger.error('An error has occurred: ' + error);
        res.status(500).json({ error: 'An error has occurred ' + error });
    }
};

export const deleteServiceHandler = async (req: any, res: any, rabbitMQClient: RabbitMQClient) => {
    try {
        const msg = req.body;
        const routerId = req.routerId;

        if (!msg || !msg.serviceName || !routerId) {
            res.status(400).json({ error: 'invalid request' });
            logger.info('Invalid request: ' + msg);
            return;
        }

        const serviceName = msg.serviceName;

        await dbClient.deleteServicePriority(routerId, serviceName);
        await dbClient.deleteService(serviceName);

        logger.info(`Deleted service: ${serviceName} from DB`);

        await rabbitMQClient.deleteNode(routerId, serviceName);
        logger.info(`Deleted service: ${serviceName} from router`);

        res.status(200).json({ response: "Deleted service successfully" });
    } catch (error) {
        logger.error('An error has occurred: ' + error);
        res.status(500).json({ error: 'An error has occurred ' + error });
    }
};

