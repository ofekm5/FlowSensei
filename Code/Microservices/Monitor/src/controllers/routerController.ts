import { Request, Response } from 'express';
import { ElasticsearchService } from '../services/elasticsearchService';
import { KibanaService } from '../services/kibanaService';
import logger from '../logger';

export const initializeELKForRouter = async (req: Request, res: Response) => {
  const { routerIp } = req.params;
  const elasticsearchServiceURL = `http://localhost:9200`;
  const kibanaServiceURL = `http://localhost:5601`;  

  try {
    const elasticsearchService = new ElasticsearchService(routerIp, elasticsearchServiceURL);
    await elasticsearchService.createIndexTemplate();  
    logger.info(`Index template created in Elasticsearch for router ${routerIp}`);

    const kibanaService = new KibanaService(routerIp, kibanaServiceURL);
    await kibanaService.createIndexPattern();  
    logger.info(`Index pattern created in Kibana for router ${routerIp}`);

    const filePath = './KibanaSetup.ndjson'; 
    const dashboardId = await kibanaService.importDashboard(filePath);  
    logger.info('Pre-created Kibana dashboard imported successfully.');
    logger.info(`reactjs link to paste in iframe: ${kibanaServiceURL}/app/kibana#/dashboard/${dashboardId}?embed=true&_g=()`);
    const iframeUrl = `${kibanaServiceURL}/app/kibana#/dashboard/${dashboardId}?embed=true&_g=()`;  

    return res.status(200).json({
      message: `Router ${routerIp} initialized with Elasticsearch and Kibana, and panel imported.`,
      iframeUrl: iframeUrl, 
    });
  } 
  catch (error: any) {
    logger.error(`Error initializing router ${routerIp}: ${error.message}`);
    res.status(500).json({ error: `Failed to initialize router ${routerIp}` });
  }
};
