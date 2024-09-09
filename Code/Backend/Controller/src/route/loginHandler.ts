import dbClient from "../components/DBClient";
import jwt from 'jsonwebtoken';
import logger from "../logger";
import { RabbitMQClient } from "../components/RabbitMQClient";
import { Response, Request } from "express";
import { Service, Router, Node } from "../types";

export const loginHandler = async (req: Request, res: Response, rabbitMQClient: RabbitMQClient, i_Secret: string) => {
    try {
        const msg = req.body;
        const username = msg['username'];
        const password = msg['password'];
        const publicIp = msg['publicIp'];
        let status: string;

        if (!msg || !username || !password || !publicIp) {
            res.status(400).json({ error: 'invalid request' });
            logger.info('Invalid request: ' + msg);
            return res;
        }

        let router = await dbClient.getRouter(publicIp);

        if (!router) { // router does not exist in the DB
            router = await initializeNewRouter(publicIp, rabbitMQClient);
            logger.info(`New router with public IP ${publicIp} initialized`);
        } 
        else {
            logger.info(`Router with public IP ${publicIp} already exists with ID ${router.router_id}`);
        }

        status = await rabbitMQClient.login(username.toString(), password.toString(), publicIp.toString(),  router!.router_id.toString());
        logger.info(`username: ${username} logged in to router ${ router!.router_id} with publicIp: ${publicIp}`);

        if (status === 'success') {
            const payload = { routerId: router!.router_id };
            const secret = i_Secret;
    
            if (!secret) {
                throw new Error('ACCESS_TOKEN_SECRET is not defined');
            }

            const token = jwt.sign(payload, secret, { expiresIn: '3h' });
            const responseToUser = {
                token: token,
                message: status
            };
            res.status(200).json({ response: responseToUser });
        } 
        else {
            await dbClient.deleteRouter(publicIp);
            res.status(400).json({ response: "failed to login, could not connect to rabbitmq" });
        }
        return res;
    } 
    catch (error) {
        logger.error('An error has occurred: ' + error);
        res.status(500).json({ error: 'An error has occurred ' + error });
    }
};

async function initializeNewRouter(publicIp:string, rabbitMQClient:RabbitMQClient):Promise<Router>{
    let priority = 1;

    await dbClient.insertRouter(publicIp);
    logger.info(`New router with public IP ${publicIp} inserted`);
    
    const newRouter = await dbClient.getRouter(publicIp);
    
    if (newRouter?.router_id) {
        const commonServices: Service[] = [
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
                const params: (string | undefined)[] = [
                    service.name,
                    service.protocol,
                    service.dstPort,
                    service.srcPort,   // Could be undefined
                    service.srcAddress, // Could be undefined
                    service.dstAddress  // Could be undefined
                ];

                await dbClient.insertService(
                    params[0]!, // service
                    params[1]!, // protocol
                    params[2]!, // dstPort
                    params[3] || '',  // srcPort (optional)
                    params[4] || '',  // srcAddress (optional)
                    params[5] || ''   // dstAddress (optional)
                );
        
                await dbClient.insertServicePriority(newRouter.router_id, service.name, priority);
                await rabbitMQClient.markService(service, newRouter.router_id);
                const node: Node = { serviceName: service.name, parent: 'root', priority: String(priority) };
                await rabbitMQClient.addNodeToQueueTree(node, newRouter.router_id);
                logger.info(`Inserted service: ${service.name} with priority: ${priority}`);
                priority++;
            } 
            catch (error) {
                logger.error(`Failed to insert service: ${service.name}, Error: ${error}`);
            }
        }
    } 
    else {
        throw new Error('Failed to retrieve the new router ID after insertion');
    }

    return newRouter;
}

