"use strict";
// import logger from "../logger";
// import apiClient from "./APIClient";
// class TransportMonitor {
//     private apiClient: any;
//     private interval: number;
//     constructor(apiClient: any, interval: number = 1) {
//         this.apiClient = apiClient;
//         this.interval = interval;
//     }
//     public async startNetFlow(interfaceName: string, activeTimeout: number = 60, inactiveTimeout: number = 15) {
//         try {
//             await this.apiClient.write('/ip/traffic-flow/set', [
//                 '=enabled=yes',
//                 `=interfaces=${interfaceName}`,
//                 `=active-flow-timeout=${activeTimeout}`,
//                 `=inactive-flow-timeout=${inactiveTimeout}`,
//             ]);
//             logger.info('NetFlow started');
//         } catch (error) {
//             logger.error('Failed to start NetFlow: ' + error);
//             throw new Error('Failed to start NetFlow');
//         }
//     }
//     public async stopNetFlow() {
//         try {
//             await this.apiClient.write('/ip/traffic-flow/set', [
//                 '=enabled=no',
//             ]);
//             logger.info('NetFlow stopped');
//         } catch (error) {
//             logger.error('Failed to stop NetFlow: ' + error);
//             throw new Error('Failed to stop NetFlow');
//         }
//     }
// }
// export default TransportMonitor;
