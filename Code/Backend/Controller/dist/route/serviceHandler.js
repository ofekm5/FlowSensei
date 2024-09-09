"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteServiceHandler = exports.updateServiceHandler = exports.createServiceHandler = void 0;
const DBClient_1 = __importDefault(require("../components/DBClient"));
const logger_1 = __importDefault(require("../logger"));
const createServiceHandler = async (req, res, rabbitMQClient) => {
    try {
        const msg = req.body;
        const routerId = req.routerId;
        const service = msg.service;
        if (!msg || !service) {
            res.status(400).json({ error: 'invalid request' });
            logger_1.default.info('Invalid request: ' + msg);
            return;
        }
        const minPriorityResult = await DBClient_1.default.getMinPriority(routerId);
        let priority = minPriorityResult ? minPriorityResult.priority - 1 : 1; // Default to 1 if no services exist
        await DBClient_1.default.insertService(service.name, service.protocol, service.dstPort, service.srcPort || '', // Optional
        service.srcAddress || '', // Optional
        service.dstAddress || '' // Optional
        );
        await DBClient_1.default.insertServicePriority(routerId, service.name, priority);
        await rabbitMQClient.markService(service, routerId);
        const node = { serviceName: service.name, parent: 'root', priority: String(priority) };
        await rabbitMQClient.addNodeToQueueTree(node, routerId);
        logger_1.default.info(`Inserted service: ${service} with priority: ${priority}`);
        res.status(200).json({ response: "Created new priority queue successfully" });
    }
    catch (error) {
        logger_1.default.error('An error has occurred: ' + error);
        res.status(500).json({ error: 'An error has occurred ' + error });
    }
};
exports.createServiceHandler = createServiceHandler;
const updateServiceHandler = async (req, res, rabbitMQClient) => {
    try {
        const msg = req.body;
        const routerId = req.routerId;
        if (!msg || !msg.serviceName || !msg.priority || !routerId) {
            res.status(400).json({ error: 'Invalid request' });
            logger_1.default.info('Invalid request: ' + JSON.stringify(msg));
            return;
        }
        const serviceName = msg.serviceName;
        const priority = msg.priority;
        logger_1.default.info(`Updating service ${serviceName} with priority ${priority} for router ${routerId}`);
        await DBClient_1.default.updatePriority(routerId, serviceName, priority);
        logger_1.default.info(`Updated priority: ${priority} for service: ${serviceName} in DB`);
        await rabbitMQClient.updateNodePriority(routerId, serviceName, priority);
        logger_1.default.info(`Updated priority queue for service: ${serviceName} in router`);
        res.status(200).json({ response: `Updated priority for service: ${serviceName} successfully` });
    }
    catch (error) {
        logger_1.default.error('An error has occurred: ' + error);
        res.status(500).json({ error: 'An error has occurred ' + error });
    }
};
exports.updateServiceHandler = updateServiceHandler;
const deleteServiceHandler = async (req, res, rabbitMQClient) => {
    try {
        const msg = req.body;
        const routerId = req.routerId;
        if (!msg || !msg.serviceName || !routerId) {
            res.status(400).json({ error: 'invalid request' });
            logger_1.default.info('Invalid request: ' + msg);
            return;
        }
        const serviceName = msg.serviceName;
        await DBClient_1.default.deleteServicePriority(routerId, serviceName);
        await DBClient_1.default.deleteService(serviceName);
        logger_1.default.info(`Deleted service: ${serviceName} from DB`);
        await rabbitMQClient.deleteNode(routerId, serviceName);
        logger_1.default.info(`Deleted service: ${serviceName} from router`);
        res.status(200).json({ response: "Deleted service successfully" });
    }
    catch (error) {
        logger_1.default.error('An error has occurred: ' + error);
        res.status(500).json({ error: 'An error has occurred ' + error });
    }
};
exports.deleteServiceHandler = deleteServiceHandler;
