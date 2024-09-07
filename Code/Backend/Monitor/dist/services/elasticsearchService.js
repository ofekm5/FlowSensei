"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElasticsearchService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../logger"));
class ElasticsearchService {
    constructor(ip) {
        //this.ipv4Addresses = this.getIPv4Addresses();
        //const ipAddress = this.ipv4Addresses.length > 0 ? this.ipv4Addresses[0] : 'localhost';
        this.ipv4Address = ip;
        this.baseUrl = `http://localhost:9200`; // Ensure 'http://' is included
        //this.ipv4Address = ipAddress;
        logger_1.default.info(`Elasticsearch URL: ${this.baseUrl} and IP: ${this.ipv4Address}`);
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
    async createDynamicIndex() {
        const indexName = `netflow-${this.ipv4Address}-${new Date().toISOString().replace(/[:.]/g, '-')}`.toLowerCase();
        logger_1.default.info(`Creating new index: ${indexName}`);
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
        logger_1.default.info("indexTemplate: " + JSON.stringify(indexTemplate));
        logger_1.default.info("creating index " + this.baseUrl + "/" + indexName);
        await axios_1.default.put(`${this.baseUrl}/${indexName}`, indexTemplate);
        console.log(`Created new index: ${indexName}`);
        return indexName;
    }
    async createIndexTemplate() {
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
        await axios_1.default.put(`${this.baseUrl}/_template/netflow_template_${this.ipv4Address}`, template);
    }
}
exports.ElasticsearchService = ElasticsearchService;
