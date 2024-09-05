// src/controllers/routerController.ts

import { Request, Response } from 'express';
import { elasticsearchService } from '../services/elasticsearchService';
import { kibanaService } from '../services/kibanaService';
import logger from '../logger';
// import { Router } from '../models/router';

export class RouterController {
  static async addRouter(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Adding router and setting up ELK for router:' + req.body);
      const router: any = req.body;
      logger.info('Router:' + router);
      logger.info("setting base url for kibana and elasticsearch for router:" + router.ip);
      await kibanaService.setBaseUrl(router.ip);
      await elasticsearchService.setBaseUrl(router.ip);
      logger.info("succeeded setting base url for kibana and elasticsearch for router:" + router.ip);

      // Set up Elasticsearch index template for the new router
      logger.info("creating index template for router:" + router.ip); 
      await elasticsearchService.createIndexTemplate();

      // Set up Kibana index pattern and visualizations for the new router
      await kibanaService.createIndexPattern();
      await kibanaService.createVisualization();
      await kibanaService.createDashboard();

      res.status(201).json({ message: 'Router added and ELK set up successfully.' });
    } catch (error) {
      console.error('Error setting up ELK for router:', error);
      res.status(500).json({ message: 'Error setting up ELK for router.' });
    }
  }
}
