"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchKibana = void 0;
const logger_1 = __importDefault(require("../logger"));
const fetchKibana = async (req, res, rabbitMQClient) => {
    const routerIp = req.params.routerIp;
    if (!routerIp) {
        logger_1.default.error('No router IP provided');
        return res.status(400).json({ error: 'Router IP is required' });
    }
    try {
        const response = await rabbitMQClient.fetchKibana(routerIp);
        if (response) {
            const parsedResponse = JSON.parse(response);
            if (parsedResponse.error) {
                logger_1.default.error(`Failed to initialize ELK for router ${routerIp}: ${parsedResponse.error}`);
                return res.status(500).json({ error: parsedResponse.error });
            }
            return res.status(200).json({
                message: `Router ${routerIp} initialized successfully.`,
                iframeUrl: parsedResponse.iframeUrl
            });
        }
        else {
            logger_1.default.error(`No response received from RabbitMQ for router ${routerIp}`);
            return res.status(500).json({ error: 'No response received from RabbitMQ' });
        }
    }
    catch (error) {
        logger_1.default.error(`Error during ELK initialization for router ${routerIp}: ${error.message}`);
        return res.status(500).json({ error: 'An error occurred during ELK setup' });
    }
};
exports.fetchKibana = fetchKibana;
