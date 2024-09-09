"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../logger"));
const node_routeros_1 = require("node-routeros");
class APIClient {
    constructor() {
        this.apiSessions = new Map();
    }
    async login(i_Host, i_Username, i_Password, i_RouterID) {
        if (this.apiSessions.get(i_RouterID)) {
            logger_1.default.warn(`API client already connected to ${i_Host} with username ${i_Username}`);
            return;
        }
        const sessionTry = new node_routeros_1.RouterOSAPI({
            host: i_Host,
            user: i_Username,
            password: i_Password,
            port: 8728
        });
        return sessionTry.connect().then(() => {
            logger_1.default.info(`API client connected to ${i_Host} with username ${i_Username}`);
            this.apiSessions.set(i_RouterID, sessionTry);
            this.startNetFlow(i_RouterID);
        }).catch((err) => {
            throw new Error(`API client connection error: ${err}`);
        });
    }
    //Each connection mark is uniquely associated with a single packet mark
    async markService(i_RouterID, params) {
        await this.markConnection(i_RouterID, params.service + "_connection", params.protocol, params.srcPort, params.dstPort, params.srcAddress, params.dstAddress)
            .then(() => {
            return this.markPacket(i_RouterID, params.service + "_packet", params.service + "_connection", params.protocol, params.srcPort, params.dstPort, params.srcAddress, params.dstAddress);
        })
            .then(() => {
            logger_1.default.info(`Successfully marked connection and packet for service: ${params.service}`);
        })
            .catch((error) => {
            throw new Error(`Failed to mark service for ${params.service}: ${error}`);
        });
    }
    async markConnection(i_RouterID, connectionMark, protocol, srcPort, dstPort, srcAddress, dstAddress) {
        if (!i_RouterID || !this.apiSessions.get(i_RouterID)) {
            throw new Error('API session not initialized');
        }
        const command = [
            '=action=mark-connection',
            `=chain=prerouting`,
            `=new-connection-mark=${connectionMark}`,
            `=passthrough=yes`,
        ];
        command.push(`=dst-port=${dstPort}`);
        if (protocol)
            command.push(`=protocol=${protocol}`);
        if (srcAddress)
            command.push(`=src-address=${srcAddress}`);
        if (dstAddress)
            command.push(`=dst-address=${dstAddress}`);
        if (srcPort)
            command.push(`=src-port=${srcPort}`);
        return this.apiSessions.get(i_RouterID).write('/ip/firewall/mangle/add', command)
            .then(() => logger_1.default.info(`Mangle connection rule for ${connectionMark} added successfully`))
            .catch((error) => {
            throw new Error(`Failed to add mangle connection rule for ${connectionMark}: ${error}`);
        });
    }
    async markPacket(i_RouterID, packetMark, connectionMark, protocol, srcPort, dstPort, srcAddress, dstAddress) {
        if (!i_RouterID || !this.apiSessions.get(i_RouterID)) {
            throw new Error('API session not initialized');
        }
        const command = [
            '=action=mark-packet',
            `=chain=prerouting`,
            `=connection-mark=${connectionMark}`,
            `=new-packet-mark=${packetMark}`,
        ];
        command.push(`=dst-port=${dstPort}`);
        if (srcAddress)
            command.push(`=src-address=${srcAddress}`);
        if (dstAddress)
            command.push(`=dst-address=${dstAddress}`);
        if (srcPort)
            command.push(`=src-port=${srcPort}`);
        if (protocol)
            command.push(`=protocol=${protocol}`);
        return this.apiSessions.get(i_RouterID).write('/ip/firewall/mangle/add', command)
            .then(() => logger_1.default.info(`Mangle packet rule for ${packetMark} added successfully`))
            .catch((error) => {
            throw new Error(`Failed to add mangle packet rule for ${packetMark}: ${error}`);
        });
    }
    async addNodeToQueueTree(i_RouterID, params) {
        if (!i_RouterID || !this.apiSessions.get(i_RouterID)) {
            throw new Error('API session not initialized');
        }
        const { serviceName, packetMark, priority, } = params;
        const command = [
            `=name=${serviceName}`,
            `=parent=global`,
            `=packet-mark=${packetMark}`,
            `=priority=${priority}`,
            `=queue=default`,
        ];
        return this.apiSessions.get(i_RouterID).write('/queue/tree/add', command)
            .then(() => logger_1.default.info(`Node ${name} added to queue tree successfully`))
            .catch((error) => {
            throw new Error(`Failed to add node to queue tree for ${name}: ${error}`);
        });
    }
    async deleteNodeFromGlobalQueue(i_RouterID, nodeName) {
        try {
            if (!i_RouterID || !this.apiSessions.get(i_RouterID)) {
                throw new Error('API session not initialized');
            }
            const nodes = await this.apiSessions.get(i_RouterID).write('/queue/tree/print', [
                `?name=${nodeName}`,
                `?parent=global`,
            ]);
            if (nodes.length === 0) {
                logger_1.default.warn(`Node with name '${nodeName}' not found in the global queue.`);
                return;
            }
            const nodeId = nodes[0]['.id'];
            await this.apiSessions.get(i_RouterID).write('/queue/tree/remove', [
                `=.id=${nodeId}`,
            ]);
            logger_1.default.info(`Node '${nodeName}' successfully deleted from the global queue.`);
        }
        catch (error) {
            throw new Error(`Failed to delete node '${nodeName}' from the global queue: ${error}`);
        }
    }
    async updateNodePriority(i_RouterID, name, newPriority) {
        if (!i_RouterID || !this.apiSessions.get(i_RouterID)) {
            throw new Error('API session not initialized');
        }
        const command = [
            `=numbers=${name}`,
            `=priority=${newPriority}`,
        ];
        return this.apiSessions.get(i_RouterID).write('/queue/tree/set', command)
            .then(() => logger_1.default.info(`Priority for node ${name} updated successfully`))
            .catch((error) => {
            throw new Error(`Failed to update priority for node ${name}: ${error}`);
        });
    }
    async startNetFlow(i_RouterID) {
        try {
            if (!i_RouterID || !this.apiSessions.get(i_RouterID)) {
                throw new Error('API session not initialized');
            }
            const activeTimeout = 60;
            const inactiveTimeout = 15;
            await this.apiSessions.get(i_RouterID).write('/ip/traffic-flow/set', [
                '=enabled=yes',
                `=interfaces=all`,
                `=active-flow-timeout=${activeTimeout}`,
                `=inactive-flow-timeout=${inactiveTimeout}`,
            ]);
            logger_1.default.info('NetFlow started');
        }
        catch (error) {
            throw new Error('Failed to start NetFlow');
        }
    }
    async calculateTotalUsage(i_RouterID) {
        if (!i_RouterID || !this.apiSessions.get(i_RouterID)) {
            throw new Error('API session not initialized');
        }
        const interfaces = await this.apiSessions.get(i_RouterID).write('/interface/print', []);
        let totalInUsage = 0;
        let totalOutUsage = 0;
        for (const iface of interfaces) {
            const [interfaceStats] = await this.apiSessions.get(i_RouterID).write('/interface/monitor-traffic', [
                `=interface=${iface.name}`,
                '=once=',
            ]);
            const inUsage = parseInt(interfaceStats['rx-bits-per-second'], 10) / 1000; // Convert to kbps
            const outUsage = parseInt(interfaceStats['tx-bits-per-second'], 10) / 1000; // Convert to kbps
            totalInUsage += inUsage;
            totalOutUsage += outUsage;
        }
        return totalInUsage + totalOutUsage;
    }
    async adjustLimit() {
        const maxBandwidth = 100000; // 100 Mbps in kbps, according to MikroTik standards
        const threshold = 50; // 50% threshold for bandwidth usage
        const incrementStep = 1000; // 1000 kbps increment step
        const minLimitAt = 10000; // 10,000 kbps minimum limit-at value
        const maxLimitAt = 50000; // 50,000 kbps maximum limit-at value
        // Burst parameters
        const defaultBurstLimit = 60000; // 60,000 kbps burst limit
        const defaultBurstThreshold = 40000; // 40,000 kbps burst threshold
        const defaultBurstTime = 15; // 15 seconds burst time
        for (const [routerID, apiSession] of this.apiSessions) {
            try {
                const totalUsage = await this.calculateTotalUsage(routerID);
                const [globalQueue] = await apiSession.write('/queue/tree/print', [
                    `?name=global`, // Assuming the global queue is named 'global'
                ]);
                const globalMaxLimit = parseInt(globalQueue['max-limit'], 10);
                const globalLimitAt = parseInt(globalQueue['limit-at'], 10);
                const globalAvailableBandwidth = globalMaxLimit - globalLimitAt;
                let newLimitAt = globalLimitAt;
                let newBurstLimit = defaultBurstLimit;
                let newBurstThreshold = defaultBurstThreshold;
                // Check if the global queue has enough bandwidth available
                if (totalUsage > (maxBandwidth * threshold / 100) && globalAvailableBandwidth > incrementStep) {
                    newLimitAt = Math.min(globalLimitAt + incrementStep, maxLimitAt);
                    logger_1.default.info(`Router ${routerID}: Bandwidth exceeded ${threshold}%, increasing global limit-at to ${newLimitAt} kbps`);
                    // Increase burst limit and threshold if increasing limit-at
                    newBurstLimit = Math.min(newBurstLimit + incrementStep, maxLimitAt);
                    newBurstThreshold = Math.min(newBurstThreshold + (incrementStep / 2), maxLimitAt);
                    logger_1.default.info(`Router ${routerID}: Increasing burst limit to ${newBurstLimit} kbps and burst threshold to ${newBurstThreshold} kbps`);
                }
                else if (totalUsage <= (maxBandwidth * threshold / 100)) {
                    newLimitAt = Math.max(globalLimitAt - incrementStep, minLimitAt);
                    logger_1.default.info(`Router ${routerID}: Bandwidth below ${threshold}%, decreasing global limit-at to ${newLimitAt} kbps`);
                    // Decrease burst limit and threshold if decreasing limit-at
                    newBurstLimit = Math.max(newBurstLimit - incrementStep, minLimitAt);
                    newBurstThreshold = Math.max(newBurstThreshold - (incrementStep / 2), minLimitAt);
                    logger_1.default.info(`Router ${routerID}: Decreasing burst limit to ${newBurstLimit} kbps and burst threshold to ${newBurstThreshold} kbps`);
                }
                else {
                    logger_1.default.warn(`Router ${routerID}: Not enough available bandwidth in global queue to increase limit-at`);
                }
                await apiSession.write('/queue/tree/set', [
                    `=name=global`,
                    `=limit-at=${newLimitAt}`,
                    `=burst-limit=${newBurstLimit}`,
                    `=burst-threshold=${newBurstThreshold}`,
                    `=burst-time=${defaultBurstTime}`,
                ]);
                logger_1.default.info(`Router ${routerID}: Set global limit-at to ${newLimitAt} kbps, burst limit to ${newBurstLimit} kbps, and burst threshold to ${newBurstThreshold} kbps`);
            }
            catch (error) {
                throw new Error(`Router ${routerID}: Failed to adjust global limit-at ${error}`);
            }
        }
    }
    async disconnect(i_RouterID) {
        if (this.apiSessions.get(i_RouterID)) {
            await this.apiSessions.get(i_RouterID).close();
            this.apiSessions.delete(i_RouterID);
            logger_1.default.info(`${i_RouterID} session ended`);
        }
        else {
            throw new Error(`API session of ${i_RouterID} not initialized`);
        }
    }
}
const apiClient = new APIClient();
exports.default = apiClient;
