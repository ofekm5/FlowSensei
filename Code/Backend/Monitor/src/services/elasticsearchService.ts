import axios from 'axios';
import os from 'os';
import logger from '../logger';

export class ElasticsearchService {
  private baseUrl: string | undefined;
  //private ipv4Addresses: string[] | undefined;
  private ipv4Address: string | undefined;

  constructor(ip:string) {
    //this.ipv4Addresses = this.getIPv4Addresses();
    //const ipAddress = this.ipv4Addresses.length > 0 ? this.ipv4Addresses[0] : 'localhost';
    this.ipv4Address = ip;
    this.baseUrl = `http://localhost:9200`;  // Ensure 'http://' is included
    //this.ipv4Address = ipAddress;
    logger.info(`Elasticsearch URL: ${this.baseUrl} and IP: ${this.ipv4Address}`);
  }  

  // private getIPv4Addresses(): string[] {
  //   const networkInterfaces = os.networkInterfaces();
  //   const ipv4Addresses: string[] = [];

  //   for (const interfaces of Object.values(networkInterfaces)) {
  //     const ifaceArray = interfaces as os.NetworkInterfaceInfo[];
  //     for (const iface of ifaceArray) {
  //       if (iface.family === 'IPv4' && !iface.internal) {
  //         ipv4Addresses.push(iface.address);
  //       }
  //     }
  //   }

  //   return ipv4Addresses;
  // }

  public async createDynamicIndex(): Promise<string> {
    const indexName = `netflow-${this.ipv4Address}-${new Date().toISOString().slice(0, 10)}`;
    logger.info(`Creating new index: ${indexName}`);
    
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

    logger.info("indexTemplate: "+ JSON.stringify(indexTemplate));
    logger.info("creating index " + this.baseUrl + "/" + indexName);
    await axios.put(`${this.baseUrl}/${indexName}`, indexTemplate);
    console.log(`Created new index: ${indexName}`);
    
    return indexName;
  }

  public async createIndexTemplate(): Promise<void> {
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
