import { Request, Response } from 'express';
import { RabbitMQClient } from '../components/RabbitMQClient'; // Assuming RabbitMQClient is imported from this path
import logger from '../logger';

export const fetchKibana = async (req: Request, res: Response, rabbitMQClient: RabbitMQClient) => {
    const routerIp = req.params.routerIp;

    if (!routerIp) {
        logger.error('No router IP provided');
        return res.status(400).json({ error: 'Router IP is required' });
    }

    try {
        const response = await rabbitMQClient.fetchKibana(routerIp);

        if (response) {
            const parsedResponse = JSON.parse(response);
            if (parsedResponse.error) {
                logger.error(`Failed to initialize ELK for router ${routerIp}: ${parsedResponse.error}`);
                return res.status(500).json({ error: parsedResponse.error });
            }

            return res.status(200).json({
                message: `Router ${routerIp} initialized successfully.`,
                iframeUrl: parsedResponse.iframeUrl
            });
        } 
        else {
            logger.error(`No response received from RabbitMQ for router ${routerIp}`);
            return res.status(500).json({ error: 'No response received from RabbitMQ' });
        }
    } catch (error: any) {
        logger.error(`Error during ELK initialization for router ${routerIp}: ${error.message}`);
        return res.status(500).json({ error: 'An error occurred during ELK setup' });
    }
};
