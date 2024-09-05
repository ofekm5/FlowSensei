import axios from 'axios';
import os from 'os';
class ElasticsearchService {
 
  private baseUrl: string | undefined;
  private ipv4Addresses: string[] | undefined;
  private ipv4Address: string | undefined;

  constructor() {
    // this.baseUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
  }

  setBaseUrl(ip: any) {
    this.ipv4Addresses = this.getIPv4Addresses();
    const ipAddress = this.ipv4Addresses.length > 0 ? this.ipv4Addresses[0] : 'localhost';
    this.baseUrl = `${ipAddress}:9200`;  
    this.ipv4Address = ipAddress;
  }

  private getIPv4Addresses(): string[] {
    const networkInterfaces = os.networkInterfaces();
    const ipv4Addresses: string[] = [];

    for (const interfaces of Object.values(networkInterfaces)) {
      const ifaceArray = interfaces as os.NetworkInterfaceInfo[];
      for (const iface of ifaceArray) {
        if (iface.family === 'IPv4' && !iface.internal) {
          ipv4Addresses.push(iface.address);
        }
      }
    }

    return ipv4Addresses;
  }

  // Create dynamic index for a router
  async createDynamicIndex(): Promise<string> {
    const indexName = `netflow-${this.ipv4Address}-${new Date().toISOString().slice(0, 10)}`;
    
    // Define index settings and mappings
    const indexTemplate = {
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

    // Create the new index dynamically
    await axios.put(`${this.baseUrl}/${indexName}`, indexTemplate);
    console.log(`Created new index: ${indexName}`);
    
    return indexName;
  }

  // Example method to be used if dynamic templates are needed
  async createIndexTemplate(): Promise<void> {
    const indexPattern = `netflow-${this.ipv4Address}-*`;
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

    await axios.put(`${this.baseUrl}/_template/netflow_template_${this.ipv4Address}`, template);
  }
}

export const elasticsearchService = new ElasticsearchService();
