"use strict";
// src/controllers/routerController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterController = void 0;
const elasticsearchService_1 = require("../services/elasticsearchService");
const kibanaService_1 = require("../services/kibanaService");
const logger_1 = __importDefault(require("../logger"));
// import { Router } from '../models/router';
class RouterController {
    static async addRouter(req, res) {
        try {
            logger_1.default.info('Adding router and setting up ELK for router:' + req.body);
            const router = req.body;
            logger_1.default.info('Router:' + router);
            logger_1.default.info("setting base url for kibana and elasticsearch for router:" + router.ip);
            await kibanaService_1.kibanaService.setBaseUrl(router.ip);
            await elasticsearchService_1.elasticsearchService.setBaseUrl(router.ip);
            logger_1.default.info("succeeded setting base url for kibana and elasticsearch for router:" + router.ip);
            // Set up Elasticsearch index template for the new router
            logger_1.default.info("creating index template for router:" + router.ip);
            await elasticsearchService_1.elasticsearchService.createIndexTemplate();
            // Set up Kibana index pattern and visualizations for the new router
            await kibanaService_1.kibanaService.createIndexPattern();
            await kibanaService_1.kibanaService.createVisualization();
            await kibanaService_1.kibanaService.createDashboard();
            res.status(201).json({ message: 'Router added and ELK set up successfully.' });
        }
        catch (error) {
            console.error('Error setting up ELK for router:', error);
            res.status(500).json({ message: 'Error setting up ELK for router.' });
        }
    }
}
exports.RouterController = RouterController;
