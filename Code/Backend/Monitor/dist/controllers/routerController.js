"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeELKForRouter = void 0;
const elasticsearchService_1 = require("../services/elasticsearchService");
const kibanaService_1 = require("../services/kibanaService");
const logger_1 = __importDefault(require("../logger"));
const initializeELKForRouter = async (req, res) => {
    const { routerIp } = req.params;
    const elasticsearchServiceURL = `http://localhost:9200`;
    const kibanaServiceURL = `http://localhost:5601`;
    try {
        const elasticsearchService = new elasticsearchService_1.ElasticsearchService(routerIp, elasticsearchServiceURL);
        await elasticsearchService.createIndexTemplate();
        logger_1.default.info(`Index template created in Elasticsearch for router ${routerIp}`);
        const kibanaService = new kibanaService_1.KibanaService(routerIp, kibanaServiceURL);
        await kibanaService.createIndexPattern();
        logger_1.default.info(`Index pattern created in Kibana for router ${routerIp}`);
        const filePath = './KibanaSetup.ndjson';
        const dashboardId = await kibanaService.importDashboard(filePath);
        logger_1.default.info('Pre-created Kibana dashboard imported successfully.');
        logger_1.default.info(`reactjs link to paste in iframe: ${kibanaServiceURL}/app/kibana#/dashboard/${dashboardId}?embed=true&_g=()`);
        const iframeUrl = `${kibanaServiceURL}/app/kibana#/dashboard/${dashboardId}?embed=true&_g=()`;
        return res.status(200).json({
            message: `Router ${routerIp} initialized with Elasticsearch and Kibana, and panel imported.`,
            iframeUrl: iframeUrl,
        });
    }
    catch (error) {
        logger_1.default.error(`Error initializing router ${routerIp}: ${error.message}`);
        res.status(500).json({ error: `Failed to initialize router ${routerIp}` });
    }
};
exports.initializeELKForRouter = initializeELKForRouter;
