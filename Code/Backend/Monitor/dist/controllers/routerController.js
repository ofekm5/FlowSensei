"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeRouter = void 0;
const elasticsearchService_1 = require("../services/elasticsearchService");
const kibanaService_1 = require("../services/kibanaService");
const logger_1 = __importDefault(require("../logger"));
const axios_1 = __importDefault(require("axios"));
// Controller to initialize router in Elasticsearch and Kibana
const initializeRouter = async (req, res) => {
    var _a, _b, _c;
    const { routerIp } = req.params; // Capture the router's public IP address
    try {
        // Initialize Elasticsearch service for the router IP
        const elasticsearchService = new elasticsearchService_1.ElasticsearchService(routerIp);
        logger_1.default.info(`Initializing Elasticsearch service for router ${routerIp}`);
        const indexName = await elasticsearchService.createDynamicIndex();
        logger_1.default.info(`Index ${indexName} created in Elasticsearch for router ${routerIp}`);
        // Initialize Kibana service for the router IP
        const kibanaService = new kibanaService_1.KibanaService(routerIp);
        logger_1.default.info(`Initializing Kibana service for router ${routerIp}`);
        await kibanaService.createIndexPattern(); // Create Kibana index pattern
        logger_1.default.info(`Index pattern created in Kibana for router ${routerIp}`);
        await kibanaService.createDashboard(); // Create Kibana dashboard
        logger_1.default.info(`Dashboard created and updated in Kibana for router ${routerIp}`);
        // Send success response
        res.status(200).json({
            message: `Router ${routerIp} initialized with Elasticsearch and Kibana`,
            index: indexName,
        });
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            logger_1.default.error(`Error initializing router ${routerIp}: ${(_a = error.response) === null || _a === void 0 ? void 0 : _a.status} - ${(_b = error.response) === null || _b === void 0 ? void 0 : _b.statusText}`);
            logger_1.default.error(`Error details: ${JSON.stringify((_c = error.response) === null || _c === void 0 ? void 0 : _c.data)}`);
        }
        else {
            logger_1.default.error(`Unexpected error initializing router ${routerIp}: ${error.message}`);
        }
        res.status(500).json({ error: `Failed to initialize router ${routerIp}` });
    }
};
exports.initializeRouter = initializeRouter;
