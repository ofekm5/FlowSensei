import { Request, Response } from 'express';
import { ElasticsearchService } from '../services/elasticsearchService';
import { KibanaService } from '../services/kibanaService';
import logger from '../logger';

// Controller to initialize router in Elasticsearch and Kibana
export const initializeRouter = async (req: Request, res: Response) => {
  const { routerIp } = req.params;  // Capture the router's public IP address

  try {
    // Step 1: Initialize Elasticsearch service for the router IP and create the index template
    const elasticsearchService = new ElasticsearchService(routerIp);
    await elasticsearchService.createIndexTemplate();  // Create index template to ensure consistent mappings
    logger.info(`Index template created in Elasticsearch for router ${routerIp}`);

    // Step 2: Initialize Kibana service for the router IP and create the Kibana index pattern
    const kibanaService = new KibanaService(routerIp);
    await kibanaService.createIndexPattern();  // Create Kibana index pattern
    logger.info(`Index pattern created in Kibana for router ${routerIp}`);

    // Step 3: Create the Kibana dashboard
    await kibanaService.createDashboard();  // Create Kibana dashboard
    logger.info(`Dashboard created and updated in Kibana for router ${routerIp}`);

    // Step 4: Import pre-created Kibana panels (e.g., used ports graph) from .ndjson file
    const filePath = './panels/usedports.ndjson';  // Adjust the file path to where the ndjson file is stored
    await kibanaService.importSavedObjects(filePath);  // Import pre-created Kibana panel
    logger.info('Pre-created Kibana panel imported successfully.');

    // Send success response after everything has been initialized and imported
    res.status(200).json({
      message: `Router ${routerIp} initialized with Elasticsearch and Kibana, and panel imported.`,
    });
  } catch (error: any) {
    // Handle any errors that occur during the initialization process
    logger.error(`Error initializing router ${routerIp}: ${error.message}`);
    res.status(500).json({ error: `Failed to initialize router ${routerIp}` });
  }
};
