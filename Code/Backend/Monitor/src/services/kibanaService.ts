// src/services/kibanaService.ts

import axios from 'axios';

class KibanaService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.KIBANA_URL || 'http://localhost:5601';
  }

  async createIndexPattern(routerIp: string): Promise<void> {
    const indexPattern = `netflow-${routerIp}-*`;
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

  async createVisualization(routerIp: string): Promise<void> {
    const data = {
      attributes: {
        title: `Protocol Distribution - ${routerIp}`,
        visState: JSON.stringify({
          title: `Protocol Distribution - ${routerIp}`,
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
            index: `netflow-${routerIp}-*`,
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

  async createDashboard(routerIp: string): Promise<void> {
    const dashboardData = {
      attributes: {
        title: `Network Dashboard - ${routerIp}`,
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
            id: `Protocol Distribution - ${routerIp}`,
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
