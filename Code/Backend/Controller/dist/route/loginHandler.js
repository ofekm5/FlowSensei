"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginHandler = void 0;
const DBClient_1 = __importDefault(require("../components/DBClient"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("../logger"));
const loginHandler = async (req, res, rabbitMQClient, i_Secret) => {
    try {
        const msg = req.body;
        const username = msg['username'];
        const password = msg['password'];
        const publicIp = msg['publicIp'];
        let status;
        if (!msg || !username || !password || !publicIp) {
            res.status(400).json({ error: 'invalid request' });
            logger_1.default.info('Invalid request: ' + msg);
            return res;
        }
        let router = await DBClient_1.default.getRouter(publicIp);
        if (!router) { // router does not exist in the DB
            router = await initializeNewRouter(publicIp, rabbitMQClient);
            logger_1.default.info(`New router with public IP ${publicIp} initialized`);
        }
        else {
            logger_1.default.info(`Router with public IP ${publicIp} already exists with ID ${router.router_id}`);
        }
        status = await rabbitMQClient.login(username.toString(), password.toString(), publicIp.toString(), router.router_id.toString());
        logger_1.default.info(`username: ${username} logged in to router ${router.router_id} with publicIp: ${publicIp}`);
        if (status === 'success') {
            const payload = { routerId: router.router_id };
            const secret = i_Secret;
            if (!secret) {
                throw new Error('ACCESS_TOKEN_SECRET is not defined');
            }
            const token = jsonwebtoken_1.default.sign(payload, secret, { expiresIn: '3h' });
            const responseToUser = {
                token: token,
                message: status
            };
            res.status(200).json({ response: responseToUser });
        }
        else {
            await DBClient_1.default.deleteRouter(publicIp);
            res.status(400).json({ response: "failed to login, could not connect to rabbitmq" });
        }
        return res;
    }
    catch (error) {
        logger_1.default.error('An error has occurred: ' + error);
        res.status(500).json({ error: 'An error has occurred ' + error });
    }
};
exports.loginHandler = loginHandler;
async function initializeNewRouter(publicIp, rabbitMQClient) {
    let priority = 1;
    await DBClient_1.default.insertRouter(publicIp);
    logger_1.default.info(`New router with public IP ${publicIp} inserted`);
    const newRouter = await DBClient_1.default.getRouter(publicIp);
    if (newRouter === null || newRouter === void 0 ? void 0 : newRouter.router_id) {
        const commonServices = [
            { name: 'DNS', protocol: 'UDP', dstPort: '53', srcPort: '53' }, // Domain Name System
            { name: 'HTTP', protocol: 'TCP', dstPort: '80' }, // Hypertext Transfer Protocol
            { name: 'HTTPS', protocol: 'TCP', dstPort: '443' }, // Hypertext Transfer Protocol Secure
            { name: 'FTP', protocol: 'TCP', dstPort: '21', srcPort: '20' }, // File Transfer Protocol
            { name: 'SSH', protocol: 'TCP', dstPort: '22' }, // Secure Shell
            { name: 'SMTP', protocol: 'TCP', dstPort: '25' }, // Simple Mail Transfer Protocol
            { name: 'IMAP', protocol: 'TCP', dstPort: '143' }, // Internet Message Access Protocol
            { name: 'POP3', protocol: 'TCP', dstPort: '110' }, // Post Office Protocol 3
        ];
        for (const service of commonServices) {
            try {
                const params = [
                    service.name,
                    service.protocol,
                    service.dstPort,
                    service.srcPort, // Could be undefined
                    service.srcAddress, // Could be undefined
                    service.dstAddress // Could be undefined
                ];
                await DBClient_1.default.insertService(params[0], // service
                params[1], // protocol
                params[2], // dstPort
                params[3] || '', // srcPort (optional)
                params[4] || '', // srcAddress (optional)
                params[5] || '' // dstAddress (optional)
                );
                await DBClient_1.default.insertServicePriority(newRouter.router_id, service.name, priority);
                await rabbitMQClient.markService(service, newRouter.router_id);
                const node = { serviceName: service.name, parent: 'root', priority: String(priority) };
                await rabbitMQClient.addNodeToQueueTree(node, newRouter.router_id);
                logger_1.default.info(`Inserted service: ${service.name} with priority: ${priority}`);
                priority++;
            }
            catch (error) {
                logger_1.default.error(`Failed to insert service: ${service.name}, Error: ${error}`);
            }
        }
    }
    else {
        throw new Error('Failed to retrieve the new router ID after insertion');
    }
    return newRouter;
}
