"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KibanaService = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const form_data_1 = __importDefault(require("form-data"));
const logger_1 = __importDefault(require("../logger"));
class KibanaService {
    constructor(ip, serviceUrl) {
        this.serviceUrl = serviceUrl;
        this.ipv4Address = ip;
        logger_1.default.info(`Kibana URL: ${this.serviceUrl}`);
    }
    async importDashboard(filePath) {
        const savedObjectsFile = path_1.default.resolve(filePath);
        const form = new form_data_1.default();
        form.append('file', fs_1.default.createReadStream(savedObjectsFile));
        try {
            const response = await axios_1.default.post(`${this.serviceUrl}/api/saved_objects/_import`, form, {
                headers: Object.assign({ 'kbn-xsrf': 'true' }, form.getHeaders()),
                params: {
                    overwrite: true,
                },
            });
            logger_1.default.info(`Imported saved objects successfully: ${response.statusText}`);
        }
        catch (error) {
            logger_1.default.error(`Error importing saved objects: ${error.message}`);
            throw new Error(`Failed to import saved objects: ${error.message}`);
        }
    }
    async createIndexPattern() {
        const indexPattern = `netflow-${this.ipv4Address}-*`;
        const data = {
            attributes: {
                title: indexPattern,
                timeFieldName: '@timestamp',
            },
        };
        try {
            await axios_1.default.post(`${this.serviceUrl}/api/saved_objects/index-pattern`, data, {
                headers: { 'kbn-xsrf': 'true' },
            });
            logger_1.default.info(`Index pattern created: ${indexPattern}`);
        }
        catch (error) {
            logger_1.default.error(`Error creating index pattern: ${error.message}`);
            throw new Error(error.message);
        }
    }
}
exports.KibanaService = KibanaService;
