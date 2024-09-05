"use strict";
// src/services/kibanaService.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.kibanaService = void 0;
const axios_1 = __importDefault(require("axios"));
const os_1 = __importDefault(require("os"));
class KibanaService {
    constructor() {
        // this.baseUrl = process.env.KIBANA_URL || 'http://localhost:5601';
    }
    setBaseUrl(ip) {
        this.ipv4Addresses = this.getIPv4Addresses();
        const ipAddress = this.ipv4Addresses.length > 0 ? this.ipv4Addresses[0] : 'localhost';
        this.baseUrl = `${ipAddress}:5601`;
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
    async createIndexPattern() {
        const indexPattern = `netflow-${this.ipv4Address}-*`;
        const data = {
            attributes: {
                title: indexPattern,
                timeFieldName: "@timestamp",
            },
        };
        await axios_1.default.post(`${this.baseUrl}/api/saved_objects/index-pattern`, data, {
            headers: { 'kbn-xsrf': 'true' },
        });
    }
    async createVisualization() {
        const data = {
            attributes: {
                title: `Protocol Distribution - ${this.ipv4Address}`,
                visState: JSON.stringify({
                    title: `Protocol Distribution - ${this.ipv4Address}`,
                    type: "pie",
                    params: { shareYAxis: true, addTooltip: true, addLegend: true, isDonut: false },
                    aggs: [
                        { id: "1", enabled: true, type: "count", schema: "metric" },
                        {
                            id: "2",
                            enabled: true,
                            type: "terms",
                            schema: "segment",
                            params: {
                                field: "protocol.keyword",
                                size: 5,
                                order: "desc",
                                orderBy: "1",
                            },
                        },
                    ],
                }),
                uiStateJSON: "{}",
                description: "",
                version: 1,
                kibanaSavedObjectMeta: {
                    searchSourceJSON: JSON.stringify({
                        index: `netflow-${this.ipv4Address}-*`,
                        query: { query: "", language: "lucene" },
                        filter: [],
                    }),
                },
            },
        };
        await axios_1.default.post(`${this.baseUrl}/api/saved_objects/visualization`, data, {
            headers: { 'kbn-xsrf': 'true' },
        });
    }
    async createDashboard() {
        const dashboardData = {
            attributes: {
                title: `Network Dashboard - ${this.ipv4Address}`,
                panelsJSON: "[]",
                optionsJSON: "{}",
                version: 1,
            },
        };
        const dashboardResponse = await axios_1.default.post(`${this.baseUrl}/api/saved_objects/dashboard`, dashboardData, {
            headers: { 'kbn-xsrf': 'true' },
        });
        const dashboardId = dashboardResponse.data.id;
        const panelData = {
            attributes: {
                panelsJSON: JSON.stringify([
                    {
                        panelIndex: "1",
                        gridData: { x: 0, y: 0, w: 24, h: 15, i: "1" },
                        version: "7.10.1",
                        type: "visualization",
                        id: `Protocol Distribution - ${this.ipv4Address}`,
                    },
                ]),
            },
        };
        await axios_1.default.post(`${this.baseUrl}/api/saved_objects/dashboard/${dashboardId}/_update`, panelData, {
            headers: { 'kbn-xsrf': 'true' },
        });
    }
}
exports.kibanaService = new KibanaService();
