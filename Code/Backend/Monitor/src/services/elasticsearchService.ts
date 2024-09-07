import { Client } from '@elastic/elasticsearch';
import logger from '../logger';

export class ElasticsearchService {
  private client: Client;
  private ipv4Address: string;

  constructor(ip: string) {
    this.ipv4Address = ip;

    this.client = new Client({
      node: 'http://localhost:9200',
    });

    logger.info(`Initialized Elasticsearch client for IP: ${this.ipv4Address}`);
  }

  // Create an index template to ensure consistent mappings
  public async createIndexTemplate(): Promise<void> {
    const templateName = `netflow_template_${this.ipv4Address}`;
    const indexPattern = `netflow-${this.ipv4Address}-*`;

    const indexTemplate = {
      index_patterns: [indexPattern],
      settings: {
        number_of_shards: 1,
        number_of_replicas: 1,
      },
      mappings: {
        properties: {
          srcAddress: { type: 'ip' },
          dstAddress: { type: 'ip' },
          srcPort: { type: 'integer' },
          dstPort: { type: 'integer' },
          protocol: { type: 'keyword' },
          service: { type: 'keyword' },
          router_ip: { type: 'ip' },
          "@timestamp": { type: 'date' },
        },
      },
    };

    try {
      await this.client.indices.putTemplate({
        name: templateName,
        body: indexTemplate,
      });
      logger.info(`Created index template: ${templateName}`);
    } catch (error: any) {
      logger.error(`Error creating index template: ${error.message}`);
      throw new Error(`Failed to create index template: ${error.message}`);
    }
  }
}
