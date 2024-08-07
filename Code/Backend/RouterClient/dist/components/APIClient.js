"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../logger"));
const node_routeros_1 = require("node-routeros");
class APIClient {
    async login(i_Host, i_Username, i_Password) {
        try {
            this.apiSession = new node_routeros_1.RouterOSAPI({
                host: i_Host,
                user: i_Username,
                password: i_Password,
                port: 8728
            });
            return this.apiSession.connect().then(() => {
                logger_1.default.info('API client connected');
            }).catch((err) => {
                logger_1.default.error(`API client connection error: ${err}`);
            });
        }
        catch (error) {
            logger_1.default.error('Failed to login');
            throw new Error('Failed to login');
        }
    }
    async markConnection(params) {
        if (!this.apiSession) {
            throw new Error('API session not initialized');
        }
        const { chain, connectionMark, passthrough = 'yes', ports, protocol, srcAddress, dstAddress, srcPort, inInterface, outInterface, inBridgePort, outBridgePort, } = params;
        const command = [
            '=action=mark-connection',
            `=chain=${chain}`,
            `=new-connection-mark=${connectionMark}`,
            `=passthrough=${passthrough}`,
        ];
        if (ports)
            command.push(`=dst-port=${ports}`);
        if (protocol)
            command.push(`=protocol=${protocol}`);
        if (srcAddress)
            command.push(`=src-address=${srcAddress}`);
        if (dstAddress)
            command.push(`=dst-address=${dstAddress}`);
        if (srcPort)
            command.push(`=src-port=${srcPort}`);
        if (inInterface)
            command.push(`=in-interface=${inInterface}`);
        if (outInterface)
            command.push(`=out-interface=${outInterface}`);
        if (inBridgePort)
            command.push(`=in-bridge-port=${inBridgePort}`);
        if (outBridgePort)
            command.push(`=out-bridge-port=${outBridgePort}`);
        return this.apiSession.write('/ip/firewall/mangle/add', command)
            .then(() => logger_1.default.info(`Mangle connection rule for ${connectionMark} added successfully`))
            .catch((error) => {
            logger_1.default.error(`Failed to add mangle connection rule for ${connectionMark}: ${error}`);
            throw new Error(`Failed to add mangle connection rule for ${connectionMark}`);
        });
    }
    async markPacket(params) {
        if (!this.apiSession) {
            throw new Error('API session not initialized');
        }
        const { chain, connectionMark, packetMark, passthrough = 'no', srcAddress, dstAddress, srcPort, dstPort, protocol, inInterface, outInterface, inBridgePort, outBridgePort, } = params;
        const command = [
            '=action=mark-packet',
            `=chain=${chain}`,
            `=connection-mark=${connectionMark}`,
            `=new-packet-mark=${packetMark}`,
            `=passthrough=${passthrough}`,
        ];
        if (srcAddress)
            command.push(`=src-address=${srcAddress}`);
        if (dstAddress)
            command.push(`=dst-address=${dstAddress}`);
        if (srcPort)
            command.push(`=src-port=${srcPort}`);
        if (dstPort)
            command.push(`=dst-port=${dstPort}`);
        if (protocol)
            command.push(`=protocol=${protocol}`);
        if (inInterface)
            command.push(`=in-interface=${inInterface}`);
        if (outInterface)
            command.push(`=out-interface=${outInterface}`);
        if (inBridgePort)
            command.push(`=in-bridge-port=${inBridgePort}`);
        if (outBridgePort)
            command.push(`=out-bridge-port=${outBridgePort}`);
        return this.apiSession.write('/ip/firewall/mangle/add', command)
            .then(() => logger_1.default.info(`Mangle packet rule for ${packetMark} added successfully`))
            .catch((error) => {
            logger_1.default.error(`Failed to add mangle packet rule for ${packetMark}: ${error}`);
            throw new Error(`Failed to add mangle packet rule for ${packetMark}`);
        });
    }
    async dropPacket(params) {
        if (!this.apiSession) {
            throw new Error('API session not initialized');
        }
        const { chain, srcAddress, dstAddress, srcPort, dstPort, protocol, inInterface, outInterface, inBridgePort, outBridgePort, connectionMark } = params;
        const command = [
            '=action=drop',
            `=chain=${chain}`
        ];
        if (srcAddress)
            command.push(`=src-address=${srcAddress}`);
        if (dstAddress)
            command.push(`=dst-address=${dstAddress}`);
        if (srcPort)
            command.push(`=src-port=${srcPort}`);
        if (dstPort)
            command.push(`=dst-port=${dstPort}`);
        if (protocol)
            command.push(`=protocol=${protocol}`);
        if (inInterface)
            command.push(`=in-interface=${inInterface}`);
        if (outInterface)
            command.push(`=out-interface=${outInterface}`);
        if (inBridgePort)
            command.push(`=in-bridge-port=${inBridgePort}`);
        if (outBridgePort)
            command.push(`=out-bridge-port=${outBridgePort}`);
        if (connectionMark)
            command.push(`=connection-mark=${connectionMark}`);
        return this.apiSession.write('/ip/firewall/filter/add', command)
            .then(() => logger_1.default.info(`Drop packet rule added successfully`))
            .catch((error) => {
            logger_1.default.error(`Failed to add drop packet rule: ${error}`);
            throw new Error(`Failed to add drop packet rule`);
        });
    }
    async addNodeToQueueTree(params) {
        if (!this.apiSession) {
            throw new Error('API session not initialized');
        }
        const { name, parent, packetMark, priority, maxLimit, limitAt, burstLimit, burstThreshold, burstTime, queueType, } = params;
        const command = [
            `=name=${name}`,
            `=parent=${parent}`,
            `=packet-mark=${packetMark}`,
            `=priority=${priority}`,
            `=max-limit=${maxLimit}`,
            `=limit-at=${limitAt}`,
            `=burst-limit=${burstLimit}`,
            `=burst-threshold=${burstThreshold}`,
            `=burst-time=${burstTime}`,
            `=queue=${queueType}`,
        ];
        return this.apiSession.write('/queue/tree/add', command)
            .then(() => logger_1.default.info(`Node ${name} added to queue tree successfully`))
            .catch((error) => {
            logger_1.default.error(`Failed to add node to queue tree for ${name}: ${error}`);
            throw new Error(`Failed to add node to queue tree for ${name}`);
        });
    }
    async updateNodePriority(name, newPriority) {
        if (!this.apiSession) {
            throw new Error('API session not initialized');
        }
        const command = [
            `=numbers=${name}`,
            `=priority=${newPriority}`,
        ];
        return this.apiSession.write('/queue/tree/set', command)
            .then(() => logger_1.default.info(`Priority for node ${name} updated successfully`))
            .catch((error) => {
            logger_1.default.error(`Failed to update priority for node ${name}: ${error}`);
            throw new Error(`Failed to update priority for node ${name}`);
        });
    }
    async disconnect() {
        if (this.apiSession) {
            await this.apiSession.close();
            logger_1.default.info('API client disconnected');
        }
    }
}
const apiClient = new APIClient();
exports.default = apiClient;
