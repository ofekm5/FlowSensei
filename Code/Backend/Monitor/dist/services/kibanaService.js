"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KibanaService = void 0;
const axios_1 = __importDefault(require("axios"));
//import os from 'os';
const logger_1 = __importDefault(require("../logger"));
class KibanaService {
    constructor(ip) {
        //this.baseUrl = process.env.KIBANA_URL || 'http://localhost:5601';
        //this.ipv4Addresses = this.getIPv4Addresses();
        //const ipAddress = this.ipv4Addresses.length > 0 ? this.ipv4Addresses[0] : 'localhost';
        this.ipv4Address = ip;
        this.baseUrl = `http://localhost:5601`;
        logger_1.default.info(`kibana URL: ${this.baseUrl} and IP: ${this.ipv4Address}`);
        //this.ipv4Address = ipAddress;
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
    // Create Index Pattern
    async createIndexPattern() {
        try {
            const indexPattern = `netflow-${this.ipv4Address}-*`;
            const data = {
                attributes: {
                    title: indexPattern,
                    timeFieldName: '@timestamp',
                },
            };
            await axios_1.default.post(`${this.baseUrl}/api/saved_objects/index-pattern`, data, {
                headers: { 'kbn-xsrf': 'true' },
            });
            logger_1.default.info(`Index pattern created: ${indexPattern}`);
        }
        catch (error) {
            logger_1.default.error(`Error creating index pattern: ${error}`);
        }
    }
    // Create Visualization
    async createVisualization() {
        try {
            const data = {
                attributes: {
                    title: `Protocol Distribution - ${this.ipv4Address}`,
                    visState: JSON.stringify({
                        title: `Protocol Distribution - ${this.ipv4Address}`,
                        type: 'pie',
                        params: { shareYAxis: true, addTooltip: true, addLegend: true, isDonut: false },
                        aggs: [
                            { id: '1', enabled: true, type: 'count', schema: 'metric' },
                            {
                                id: '2',
                                enabled: true,
                                type: 'terms',
                                schema: 'segment',
                                params: {
                                    field: 'protocol.keyword',
                                    size: 5,
                                    order: 'desc',
                                    orderBy: '1',
                                },
                            },
                        ],
                    }),
                    uiStateJSON: '{}',
                    description: '',
                    version: 1,
                    kibanaSavedObjectMeta: {
                        searchSourceJSON: JSON.stringify({
                            index: `netflow-${this.ipv4Address}-*`,
                            query: { query: '', language: 'lucene' },
                            filter: [],
                        }),
                    },
                },
            };
            const response = await axios_1.default.post(`${this.baseUrl}/api/saved_objects/visualization`, data, {
                headers: { 'kbn-xsrf': 'true' },
            });
            const visualizationId = response.data.id; // Capture the ID of the created visualization
            logger_1.default.info(`Visualization created for ${this.ipv4Address} with ID: ${visualizationId}`);
            return visualizationId; // Return the ID for later use
        }
        catch (error) {
            logger_1.default.error(`Error creating visualization: ${error}`);
            throw error;
        }
    }
    // Create Top Source Addresses Visualization
    async createTopSourceAddressesVisualization() {
        try {
            const data = {
                attributes: {
                    title: `Top Source Addresses - ${this.ipv4Address}`,
                    visState: JSON.stringify({
                        title: `Top Source Addresses - ${this.ipv4Address}`,
                        type: 'bar',
                        params: {
                            shareYAxis: true,
                            addTooltip: true,
                            addLegend: true,
                            stacked: false
                        },
                        aggs: [
                            { id: '1', enabled: true, type: 'count', schema: 'metric' },
                            {
                                id: '2',
                                enabled: true,
                                type: 'terms',
                                schema: 'segment',
                                params: {
                                    field: 'srcAddress.keyword',
                                    size: 5,
                                    order: 'desc',
                                    orderBy: '1',
                                },
                            },
                        ],
                    }),
                    uiStateJSON: '{}',
                    description: '',
                    version: 1,
                    kibanaSavedObjectMeta: {
                        searchSourceJSON: JSON.stringify({
                            index: `netflow-${this.ipv4Address}-*`,
                            query: { query: '', language: 'lucene' },
                            filter: [],
                        }),
                    },
                },
            };
            await axios_1.default.post(`${this.baseUrl}/api/saved_objects/visualization`, data, {
                headers: { 'kbn-xsrf': 'true' },
            });
            logger_1.default.info(`Top Source Addresses visualization created for ${this.ipv4Address}`);
        }
        catch (error) {
            logger_1.default.error(`Error creating Top Source Addresses visualization: ${error}`);
        }
    }
    // Create Top Destination Addresses Visualization
    async createTopDestinationAddressesVisualization() {
        try {
            const data = {
                attributes: {
                    title: `Top Destination Addresses - ${this.ipv4Address}`,
                    visState: JSON.stringify({
                        title: `Top Destination Addresses - ${this.ipv4Address}`,
                        type: 'bar',
                        params: {
                            shareYAxis: true,
                            addTooltip: true,
                            addLegend: true,
                            stacked: false
                        },
                        aggs: [
                            { id: '1', enabled: true, type: 'count', schema: 'metric' },
                            {
                                id: '2',
                                enabled: true,
                                type: 'terms',
                                schema: 'segment',
                                params: {
                                    field: 'dstAddress.keyword',
                                    size: 5,
                                    order: 'desc',
                                    orderBy: '1',
                                },
                            },
                        ],
                    }),
                    uiStateJSON: '{}',
                    description: '',
                    version: 1,
                    kibanaSavedObjectMeta: {
                        searchSourceJSON: JSON.stringify({
                            index: `netflow-${this.ipv4Address}-*`,
                            query: { query: '', language: 'lucene' },
                            filter: [],
                        }),
                    },
                },
            };
            await axios_1.default.post(`${this.baseUrl}/api/saved_objects/visualization`, data, {
                headers: { 'kbn-xsrf': 'true' },
            });
            logger_1.default.info(`Top Destination Addresses visualization created for ${this.ipv4Address}`);
        }
        catch (error) {
            logger_1.default.error(`Error creating Top Destination Addresses visualization: ${error}`);
        }
    }
    // Create Traffic Over Time Visualization
    async createTrafficOverTimeVisualization() {
        try {
            const data = {
                attributes: {
                    title: `Traffic Over Time - ${this.ipv4Address}`,
                    visState: JSON.stringify({
                        title: `Traffic Over Time - ${this.ipv4Address}`,
                        type: 'line',
                        params: {
                            shareYAxis: true,
                            addTooltip: true,
                            addLegend: true,
                            smoothLines: true,
                        },
                        aggs: [
                            { id: '1', enabled: true, type: 'count', schema: 'metric' },
                            {
                                id: '2',
                                enabled: true,
                                type: 'date_histogram',
                                schema: 'segment',
                                params: {
                                    field: '@timestamp',
                                    interval: 'auto',
                                    min_doc_count: 1,
                                },
                            },
                        ],
                    }),
                    uiStateJSON: '{}',
                    description: '',
                    version: 1,
                    kibanaSavedObjectMeta: {
                        searchSourceJSON: JSON.stringify({
                            index: `netflow-${this.ipv4Address}-*`,
                            query: { query: '', language: 'lucene' },
                            filter: [],
                        }),
                    },
                },
            };
            await axios_1.default.post(`${this.baseUrl}/api/saved_objects/visualization`, data, {
                headers: { 'kbn-xsrf': 'true' },
            });
            logger_1.default.info(`Traffic Over Time visualization created for ${this.ipv4Address}`);
        }
        catch (error) {
            logger_1.default.error(`Error creating Traffic Over Time visualization: ${error}`);
        }
    }
    // Create and Update Dashboard
    async createDashboard() {
        try {
            logger_1.default.info('Creating dashboard');
            // Capture the visualization IDs after creation
            const protocolDistId = await this.createVisualization();
            const topSourceId = await this.createTopSourceAddressesVisualization();
            const topDestId = await this.createTopDestinationAddressesVisualization();
            const trafficOverTimeId = await this.createTrafficOverTimeVisualization();
            // Now proceed with creating the dashboard
            const dashboardData = {
                attributes: {
                    title: `Network Dashboard - ${this.ipv4Address}`,
                    panelsJSON: '[]',
                    optionsJSON: '{}',
                    version: 1,
                },
            };
            // Creating the dashboard
            const dashboardResponse = await axios_1.default.post(`${this.baseUrl}/api/saved_objects/dashboard`, dashboardData, {
                headers: { 'kbn-xsrf': 'true' },
            });
            const dashboardId = dashboardResponse.data.id;
            logger_1.default.info(`Dashboard created with ID: ${dashboardId}`);
            // Add visualizations to the dashboard using the correct IDs
            const panelData = {
                attributes: {
                    panelsJSON: JSON.stringify([
                        {
                            panelIndex: '1',
                            gridData: { x: 0, y: 0, w: 24, h: 15, i: '1' },
                            version: '7.9.3',
                            type: 'visualization',
                            id: protocolDistId, // Use the correct ID here
                        },
                        {
                            panelIndex: '2',
                            gridData: { x: 0, y: 15, w: 24, h: 15, i: '2' },
                            version: '7.9.3',
                            type: 'visualization',
                            id: topSourceId, // Use the correct ID here
                        },
                        {
                            panelIndex: '3',
                            gridData: { x: 0, y: 30, w: 24, h: 15, i: '3' },
                            version: '7.9.3',
                            type: 'visualization',
                            id: topDestId, // Use the correct ID here
                        },
                        {
                            panelIndex: '4',
                            gridData: { x: 0, y: 45, w: 24, h: 15, i: '4' },
                            version: '7.9.3',
                            type: 'visualization',
                            id: trafficOverTimeId, // Use the correct ID here
                        },
                    ]),
                },
            };
            // Updating dashboard
            await axios_1.default.put(`${this.baseUrl}/api/saved_objects/dashboard/${dashboardId}/_update`, panelData, {
                headers: { 'kbn-xsrf': 'true' },
            });
            logger_1.default.info('Dashboard updated successfully');
        }
        catch (error) {
            logger_1.default.error(`Error creating or updating dashboard: ${error}`);
        }
    }
}
exports.KibanaService = KibanaService;
