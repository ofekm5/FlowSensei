import axios from 'axios';
//import os from 'os';
import logger from '../logger';

export class KibanaService {
  private baseUrl: string | undefined;
  //private ipv4Addresses: string[] | undefined;
  private ipv4Address: string | undefined;

  constructor(ip:string) {
    //this.baseUrl = process.env.KIBANA_URL || 'http://localhost:5601';
    //this.ipv4Addresses = this.getIPv4Addresses();
    //const ipAddress = this.ipv4Addresses.length > 0 ? this.ipv4Addresses[0] : 'localhost';
    this.ipv4Address = ip;
    this.baseUrl = `http://localhost:5601`;
    logger.info(`kibana URL: ${this.baseUrl} and IP: ${this.ipv4Address}`);
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
  async createIndexPattern(): Promise<void> {
    try {
      const indexPattern = `netflow-${this.ipv4Address}-*`;
      const data = {
        attributes: {
          title: indexPattern,
          timeFieldName: '@timestamp',
        },
      };

      await axios.post(`${this.baseUrl}/api/saved_objects/index-pattern`, data, {
        headers: { 'kbn-xsrf': 'true' },
      });
      logger.info(`Index pattern created: ${indexPattern}`);
    } catch (error) {
      logger.error(`Error creating index pattern: ${error}`);
    }
  }

  // Create Visualization
  private async createVisualization(): Promise<string> {
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
  
      const response = await axios.post(`${this.baseUrl}/api/saved_objects/visualization`, data, {
        headers: { 'kbn-xsrf': 'true' },
      });
      const visualizationId = response.data.id;  // Capture the ID of the created visualization
      logger.info(`Visualization created for ${this.ipv4Address} with ID: ${visualizationId}`);
      return visualizationId;  // Return the ID for later use
    } catch (error) {
      logger.error(`Error creating visualization: ${error}`);
      throw error;
    }
  }

  // Create Top Source Addresses Visualization
  private async createTopSourceAddressesVisualization(): Promise<void> {
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

      await axios.post(`${this.baseUrl}/api/saved_objects/visualization`, data, {
        headers: { 'kbn-xsrf': 'true' },
      });
      logger.info(`Top Source Addresses visualization created for ${this.ipv4Address}`);
    } catch (error) {
      logger.error(`Error creating Top Source Addresses visualization: ${error}`);
    }
  }
  
   // Create Top Destination Addresses Visualization
   private async createTopDestinationAddressesVisualization(): Promise<void> {
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
  
      await axios.post(`${this.baseUrl}/api/saved_objects/visualization`, data, {
        headers: { 'kbn-xsrf': 'true' },
      });
      logger.info(`Top Destination Addresses visualization created for ${this.ipv4Address}`);
    } catch (error) {
      logger.error(`Error creating Top Destination Addresses visualization: ${error}`);
    }
  }
  
  // Create Traffic Over Time Visualization
  private async createTrafficOverTimeVisualization(): Promise<void> {
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

      await axios.post(`${this.baseUrl}/api/saved_objects/visualization`, data, {
        headers: { 'kbn-xsrf': 'true' },
      });
      logger.info(`Traffic Over Time visualization created for ${this.ipv4Address}`);
    } catch (error) {
      logger.error(`Error creating Traffic Over Time visualization: ${error}`);
    }
  }


  // Create and Update Dashboard
  async createDashboard(): Promise<void> {
    try {
      logger.info('Creating dashboard');

      // Call the visualization creation methods
      await this.createVisualization(); // Protocol Distribution
      await this.createTopSourceAddressesVisualization(); // Top Source Addresses
      await this.createTopDestinationAddressesVisualization(); // Top Destination Addresses
      await this.createTrafficOverTimeVisualization(); // Traffic Over Time

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
      const dashboardResponse = await axios.post(`${this.baseUrl}/api/saved_objects/dashboard`, dashboardData, {
        headers: { 'kbn-xsrf': 'true' },
      });

      const dashboardId = dashboardResponse.data.id;
      logger.info(`Dashboard created with ID: ${dashboardId}`);

      // Add visualizations to the dashboard
      const panelData = {
        attributes: {
          panelsJSON: JSON.stringify([
            {
              panelIndex: '1',
              gridData: { x: 0, y: 0, w: 24, h: 15, i: '1' },
              version: '7.9.3',
              type: 'visualization',
              id: `Protocol Distribution - ${this.ipv4Address}`,
            },
            {
              panelIndex: '2',
              gridData: { x: 0, y: 15, w: 24, h: 15, i: '2' },
              version: '7.9.3',
              type: 'visualization',
              id: `Top Source Addresses - ${this.ipv4Address}`,
            },
            {
              panelIndex: '3',
              gridData: { x: 0, y: 30, w: 24, h: 15, i: '3' },
              version: '7.9.3',
              type: 'visualization',
              id: `Top Destination Addresses - ${this.ipv4Address}`,
            },
            {
              panelIndex: '4',
              gridData: { x: 0, y: 45, w: 24, h: 15, i: '4' },
              version: '7.9.3',
              type: 'visualization',
              id: `Traffic Over Time - ${this.ipv4Address}`,
            },
          ]),
        },
      };
      await axios.put(`${this.baseUrl}/api/saved_objects/dashboard/${dashboardId}`, panelData, {
        headers: { 'kbn-xsrf': 'true' },
      });
      
      logger.info('Dashboard updated successfully');
    } catch (error) {
      logger.error(`Error creating or updating dashboard: ${error}`);
    }
  }
}

