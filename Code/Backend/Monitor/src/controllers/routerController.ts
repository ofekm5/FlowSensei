// src/controllers/routerController.ts

import { Request, Response } from 'express';
import { elasticsearchService } from '../services/elasticsearchService';
import { kibanaService } from '../services/kibanaService';
import { Router } from '../models/router';

export class RouterController {
  static async addRouter(req: Request, res: Response): Promise<void> {
    try {
      const router: Router = req.body;

      // Set up Elasticsearch index template for the new router
      await elasticsearchService.createIndexTemplate(router.ip);

      // Set up Kibana index pattern and visualizations for the new router
      await kibanaService.createIndexPattern(router.ip);
      await kibanaService.createVisualization(router.ip);
      await kibanaService.createDashboard(router.ip);

      res.status(201).json({ message: 'Router added and ELK set up successfully.' });
    } catch (error) {
      console.error('Error setting up ELK for router:', error);
      res.status(500).json({ message: 'Error setting up ELK for router.' });
    }
  }
}
