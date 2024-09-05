"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.elasticsearchService = void 0;
const axios_1 = __importDefault(require("axios"));
const os_1 = __importDefault(require("os"));
class ElasticsearchService {
    constructor() {
        // this.baseUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
    }
    setBaseUrl(ip) {
        this.ipv4Addresses = this.getIPv4Addresses();
        const ipAddress = this.ipv4Addresses.length > 0 ? this.ipv4Addresses[0] : 'localhost';
        this.baseUrl = `${ipAddress}:9200`;
        this.ipv4Address = ipAddress;
    }
    getIPv4Addresses() {
        const networkInterfaces = os_1.default.networkInterfaces();
        const ipv4Addresses = [];
        for (const interfaces of Object.values(networkInterfaces)) {
            const ifaceArray = interfaces;
            for (const iface of ifaceArray) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    ipv4Addresses.push(iface.address);
                }
            }
        }
        return ipv4Addresses;
    }
    // Create dynamic index for a router
    async createDynamicIndex() {
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
        await axios_1.default.put(`${this.baseUrl}/${indexName}`, indexTemplate);
        console.log(`Created new index: ${indexName}`);
        return indexName;
    }
    // Example method to be used if dynamic templates are needed
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
exports.elasticsearchService = new ElasticsearchService();
