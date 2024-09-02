import axios from 'axios';

class ElasticsearchService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
  }

  async createIndexTemplate(routerIp: string): Promise<void> {
    const indexPattern = `netflow-${routerIp}-*`;
    const template = {
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

    await axios.put(`${this.baseUrl}/_template/netflow_template_${routerIp}`, template);
  }
}

export const elasticsearchService = new ElasticsearchService();
