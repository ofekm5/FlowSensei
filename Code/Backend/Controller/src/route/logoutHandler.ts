import { RabbitMQClient } from "../components/RabbitMQClient";
import logger from "../logger";

export const logoutHandler = async (req: any, res: any, rabbitMQClient: RabbitMQClient) => {
    try {
        const routerId = req.routerId;
        const response = await rabbitMQClient.disconnect(routerId);
        res.status(200).json({ response: response });
    } 
    catch (error) {
        logger.error('An error has occurred: ' + error);
        res.status(500).json({ error: 'An error has occurred ' + error });
    }
};
