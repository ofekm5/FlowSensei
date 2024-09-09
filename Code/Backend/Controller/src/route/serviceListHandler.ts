import dbClient from "../components/DBClient";
import logger from "../logger";

export const serviceListHandler = async (req: any, res: any) => {
    try {
        const routerId = req.routerId;
        const services = await dbClient.getServices(routerId);
        res.status(200).json({ response: services });
    } catch (error) {
        logger.error('An error has occurred: ' + error);
        res.status(500).json({ error: 'An error has occurred ' + error });
    }
};
