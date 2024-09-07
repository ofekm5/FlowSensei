"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeRouter = void 0;
const elasticsearchService_1 = require("../services/elasticsearchService");
const kibanaService_1 = require("../services/kibanaService");
const logger_1 = __importDefault(require("../logger"));
// Controller to initialize router in Elasticsearch and Kibana
const initializeRouter = async (req, res) => {
    const { routerIp } = req.params; // Capture the router's public IP address
    try {
        // Step 1: Initialize Elasticsearch service for the router IP and create the index template
        const elasticsearchService = new elasticsearchService_1.ElasticsearchService(routerIp);
        await elasticsearchService.createIndexTemplate(); // Create index template to ensure consistent mappings
        logger_1.default.info(`Index template created in Elasticsearch for router ${routerIp}`);
        // Step 2: Initialize Kibana service for the router IP and create the Kibana index pattern
        const kibanaService = new kibanaService_1.KibanaService(routerIp);
        await kibanaService.createIndexPattern(); // Create Kibana index pattern
        logger_1.default.info(`Index pattern created in Kibana for router ${routerIp}`);
        // Step 3: Create the Kibana dashboard
        await kibanaService.createDashboard(); // Create Kibana dashboard
        logger_1.default.info(`Dashboard created and updated in Kibana for router ${routerIp}`);
        // Step 4: Import pre-created Kibana panels (e.g., used ports graph) from .ndjson file
        const filePath = './panels/usedports.ndjson'; // Adjust the file path to where the ndjson file is stored
        await kibanaService.importSavedObjects(filePath); // Import pre-created Kibana panel
        logger_1.default.info('Pre-created Kibana panel imported successfully.');
        // Send success response after everything has been initialized and imported
        res.status(200).json({
            message: `Router ${routerIp} initialized with Elasticsearch and Kibana, and panel imported.`,
        });
    }
    catch (error) {
        // Handle any errors that occur during the initialization process
        logger_1.default.error(`Error initializing router ${routerIp}: ${error.message}`);
        res.status(500).json({ error: `Failed to initialize router ${routerIp}` });
    }
};
exports.initializeRouter = initializeRouter;
