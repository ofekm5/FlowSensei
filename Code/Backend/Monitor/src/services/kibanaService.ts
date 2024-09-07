import axios from 'axios';
import fs from 'fs';
import path from 'path';
import logger from '../logger';

export class KibanaService {
  private baseUrl: string;
  private ipv4Address: string;

  constructor(ip: string) {
    this.baseUrl = `http://localhost:5601`;  // Ensure Kibana is reachable here
    this.ipv4Address = ip;
    logger.info(`Kibana URL: ${this.baseUrl}`);
  }

  // Import saved objects (visualizations, dashboards, etc.)
  public async importSavedObjects(filePath: string): Promise<void> {
    const savedObjectsFile = path.resolve(filePath);

    // Read the file as a string
    const savedObjectsData = fs.readFileSync(savedObjectsFile, 'utf8');

    logger.info(`File content before sending: ${savedObjectsData}`);

    try {
      // Send the file data as a string
      const response = await axios.post(
        `${this.baseUrl}/api/saved_objects/_import`,
        savedObjectsData,
        {
          headers: {
            'kbn-xsrf': 'true',
            'Content-Type': 'application/ndjson',
          },
          params: {
            overwrite: true,
          },
        }
      );
      logger.info(`Imported saved objects successfully: ${response.statusText}`);
    } catch (error: any) {
      logger.error(`Error importing saved objects: ${error.message}`);
      throw new Error(`Failed to import saved objects: ${error.message}`);
    }
  }

  // Create Index Pattern
  public async createIndexPattern(): Promise<void> {
    const indexPattern = `netflow-${this.ipv4Address}-*`;  // Use wildcard to match all indices with the same IP, regardless of the date
    const data = {
      attributes: {
        title: indexPattern,
        timeFieldName: '@timestamp',
      },
    };

    try {
      await axios.post(`${this.baseUrl}/api/saved_objects/index-pattern`, data, {
        headers: { 'kbn-xsrf': 'true' },
      });
      logger.info(`Index pattern created: ${indexPattern}`);
    } catch (error: any) {
      logger.error(`Error creating index pattern: ${error.message}`);
      throw new Error(error.message);
    }
  }

  // Create Visualization
  public async createVisualization(): Promise<string> {
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

    try {
      const response = await axios.post(`${this.baseUrl}/api/saved_objects/visualization`, data, {
        headers: { 'kbn-xsrf': 'true' },
      });
      const visualizationId = response.data.id;
      logger.info(`Visualization created for ${this.ipv4Address}`);
      return visualizationId;
    } catch (error: any) {
      logger.error(`Error creating visualization: ${error.message}`);
      throw new Error(error.message);
    }
  }

  // Create Dashboard and Add Visualizations
  public async createDashboard(): Promise<void> {
    try {
      const dashboardData = {
        attributes: {
          title: `Network Dashboard - ${this.ipv4Address}`,
          panelsJSON: '[]',
          optionsJSON: '{}',
          version: 1,
        },
      };

      // Create Dashboard
      const dashboardResponse = await axios.post(`${this.baseUrl}/api/saved_objects/dashboard`, dashboardData, {
        headers: { 'kbn-xsrf': 'true' },
      });
      const dashboardId = dashboardResponse.data.id;
      logger.info(`Dashboard created with ID: ${dashboardId}`);

      // Create Visualization and Add to Dashboard
      const visualizationId = await this.createVisualization();
      const panelData = {
        attributes: {
          panelsJSON: JSON.stringify([
            {
              panelIndex: '1',
              gridData: { x: 0, y: 0, w: 24, h: 15, i: '1' },
              version: '7.9.3',
              type: 'visualization',
              id: visualizationId,
            },
          ]),
        },
      };

      await axios.put(`${this.baseUrl}/api/saved_objects/dashboard/${dashboardId}`, panelData, {
        headers: { 'kbn-xsrf': 'true' },
      });
      logger.info('Dashboard updated successfully');
    } catch (error: any) {
      logger.error(`Error creating/updating dashboard: ${error.message}`);
      throw new Error(error.message);
    }
  }
}

