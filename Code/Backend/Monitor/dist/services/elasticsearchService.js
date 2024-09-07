"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElasticsearchService = void 0;
const elasticsearch_1 = require("@elastic/elasticsearch");
const logger_1 = __importDefault(require("../logger"));
class ElasticsearchService {
    constructor(ip) {
        this.ipv4Address = ip;
        this.client = new elasticsearch_1.Client({
            node: 'http://localhost:9200',
        });
        logger_1.default.info(`Initialized Elasticsearch client for IP: ${this.ipv4Address}`);
    }
    // Create an index template to ensure consistent mappings
    async createIndexTemplate() {
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
            logger_1.default.info(`Created index template: ${templateName}`);
        }
        catch (error) {
            logger_1.default.error(`Error creating index template: ${error.message}`);
            throw new Error(`Failed to create index template: ${error.message}`);
        }
    }
}
exports.ElasticsearchService = ElasticsearchService;
