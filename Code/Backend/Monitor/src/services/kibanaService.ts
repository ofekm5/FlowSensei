// src/services/kibanaService.ts

import axios from 'axios';
import os from 'os';

class KibanaService {
  
  private baseUrl: string | undefined;
  private ipv4Addresses: string[] | undefined;
  private ipv4Address: string | undefined;

  constructor() {
    // this.baseUrl = process.env.KIBANA_URL || 'http://localhost:5601';
  }

  setBaseUrl(ip: any) {
    this.ipv4Addresses = this.getIPv4Addresses();
    const ipAddress = this.ipv4Addresses.length > 0 ? this.ipv4Addresses[0] : 'localhost';
    this.baseUrl = `${ipAddress}:5601`;  
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

  async createIndexPattern(): Promise<void> {
    const indexPattern = `netflow-${this.ipv4Address}-*`;
    const data = {
      attributes: {
        title: indexPattern,
        timeFieldName: "@timestamp",
      },
    };

    await axios.post(`${this.baseUrl}/api/saved_objects/index-pattern`, data, {
      headers: { 'kbn-xsrf': 'true' },
    });
  }

  async createVisualization(): Promise<void> {
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

    await axios.post(`${this.baseUrl}/api/saved_objects/visualization`, data, {
      headers: { 'kbn-xsrf': 'true' },
    });
  }

  async createDashboard(): Promise<void> {
    const dashboardData = {
      attributes: {
        title: `Network Dashboard - ${this.ipv4Address}`,
        panelsJSON: "[]",
        optionsJSON: "{}",
        version: 1,
      },
    };

    const dashboardResponse = await axios.post(`${this.baseUrl}/api/saved_objects/dashboard`, dashboardData, {
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

    await axios.post(`${this.baseUrl}/api/saved_objects/dashboard/${dashboardId}/_update`, panelData, {
      headers: { 'kbn-xsrf': 'true' },
    });
  }
}

export const kibanaService = new KibanaService();
