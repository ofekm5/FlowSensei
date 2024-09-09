import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import logger from '../logger';

export class KibanaService {
  private serviceUrl: string;
  private ipv4Address: string;

  constructor(ip: string, serviceUrl: string) {
    this.serviceUrl = serviceUrl;
    this.ipv4Address = ip;
    logger.info(`Kibana URL: ${this.serviceUrl}`);
  }

  public async importDashboard(filePath: string): Promise<void> {
    const savedObjectsFile = path.resolve(filePath);

    const form = new FormData();
    form.append('file', fs.createReadStream(savedObjectsFile));

    try {
      const response = await axios.post(`${this.serviceUrl}/api/saved_objects/_import`, form, {
        headers: {
          'kbn-xsrf': 'true',
          ...form.getHeaders(),  
        },
        params: {
          overwrite: true, 
        },
      });

      logger.info(`Imported saved objects successfully: ${response.statusText}`);
    } catch (error: any) {
      logger.error(`Error importing saved objects: ${error.message}`);
      throw new Error(`Failed to import saved objects: ${error.message}`);
    }
  }


  public async createIndexPattern(): Promise<void> {
    const indexPattern = `netflow-${this.ipv4Address}-*`;
    const data = {
      attributes: {
        title: indexPattern,
        timeFieldName: '@timestamp',
      },
    };

    try {
      await axios.post(`${this.serviceUrl}/api/saved_objects/index-pattern`, data, {
        headers: { 'kbn-xsrf': 'true' },
      });
      logger.info(`Index pattern created: ${indexPattern}`);
    } catch (error: any) {
      logger.error(`Error creating index pattern: ${error.message}`);
      throw new Error(error.message);
    }
  }
}
