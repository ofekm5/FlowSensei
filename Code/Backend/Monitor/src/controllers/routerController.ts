import { Request, Response } from 'express';
import { ElasticsearchService } from '../services/elasticsearchService';
import { KibanaService } from '../services/kibanaService';
import logger from '../logger';
import axios from 'axios';

// Controller to initialize router in Elasticsearch and Kibana
export const initializeRouter = async (req: Request, res: Response) => {
  const { routerIp } = req.params;  // Capture the router's public IP address

  try {
    // Initialize Elasticsearch service for the router IP
    const elasticsearchService = new ElasticsearchService(routerIp);
    logger.info(`Initializing Elasticsearch service for router ${routerIp}`);
    const indexName = await elasticsearchService.createDynamicIndex();
    logger.info(`Index ${indexName} created in Elasticsearch for router ${routerIp}`);

    // Initialize Kibana service for the router IP
    const kibanaService = new KibanaService(routerIp);
    logger.info(`Initializing Kibana service for router ${routerIp}`);
    await kibanaService.createIndexPattern();  // Create Kibana index pattern
    logger.info(`Index pattern created in Kibana for router ${routerIp}`);

    await kibanaService.createDashboard();  // Create Kibana dashboard
    logger.info(`Dashboard created and updated in Kibana for router ${routerIp}`);

    // Send success response
    res.status(200).json({
      message: `Router ${routerIp} initialized with Elasticsearch and Kibana`,
      index: indexName,
    });
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      logger.error(`Error initializing router ${routerIp}: ${error.response?.status} - ${error.response?.statusText}`);
      logger.error(`Error details: ${JSON.stringify(error.response?.data)}`);
    } else {
      logger.error(`Unexpected error initializing router ${routerIp}: ${error.message}`);
    }
    res.status(500).json({ error: `Failed to initialize router ${routerIp}` });
  }
};
