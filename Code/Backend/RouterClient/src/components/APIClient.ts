import logger from "./logger";
import { RouterOSAPI } from 'node-routeros';

interface MarkParams{
    chain: string;
    connectionMark?: string;
    passthrough?: string;
    protocol?: string;
    inInterface?: string;
    outInterface?: string;
    srcAddress?: string;
    srcPort?: string;
    dstAddress?: string;
}

interface ConnectionMarkParams extends MarkParams{
    ports?: string;
    srcAddress?: string;
    inBridgePort?: string;
    outBridgePort?: string;
}

interface PacketMarkParams extends MarkParams{
    srcAddress?: string;
    packetMark?: string;
    dstAddress?: string;
    dstPort?: string;
    inBridgePort?: string;
    outBridgePort?: string;
}

interface PacketDropParams extends MarkParams{
    packetMark?: string;
    dstAddress?: string;
    dstPort?: string;
}

interface AddNodeToQueueTreeParams {
    name: string;
    parent: string;
    packetMark: string;
    priority: string;
    maxLimit: string;
    limitAt: string;
    burstLimit: string;
    burstThreshold: string;
    burstTime: string;
    queueType: string;
}

class APIClient {
    private apiSessions: { [key: string]: RouterOSAPI } = {};

    public async login(i_Host:string, i_Username:string, i_Password:string, i_RouterID:string){
        try{
            this.apiSessions[i_RouterID] = new RouterOSAPI({
                host: i_Host,
                user: i_Username,
                password: i_Password,
                port: 8728
            });
    
            return this.apiSessions[i_RouterID].connect().then(() => {
                logger.info('API client connected');
            }).catch((err: any) => {
                logger.error(`API client connection error: ${err}`);
            });
        }
        catch(error){
            logger.error('Failed to login');
            throw new Error('Failed to login');
        }
    }

    public async markConnection(i_RouterID:string, params: ConnectionMarkParams): Promise<void> {
        if (!this.apiSessions) {
            throw new Error('API session not initialized');
        }
        const {
            chain,
            connectionMark,
            passthrough = 'yes',
            ports,
            protocol,
            srcAddress,
            dstAddress,
            srcPort,
            inInterface,
            outInterface,
            inBridgePort,
            outBridgePort,
        } = params;
    
        const command = [
            '=action=mark-connection',
            `=chain=${chain}`,
            `=new-connection-mark=${connectionMark}`,
            `=passthrough=${passthrough}`,
        ];
    
        if (ports) command.push(`=dst-port=${ports}`);
        if (protocol) command.push(`=protocol=${protocol}`);
        if (srcAddress) command.push(`=src-address=${srcAddress}`);
        if (dstAddress) command.push(`=dst-address=${dstAddress}`);
        if (srcPort) command.push(`=src-port=${srcPort}`);
        if (inInterface) command.push(`=in-interface=${inInterface}`);
        if (outInterface) command.push(`=out-interface=${outInterface}`);
        if (inBridgePort) command.push(`=in-bridge-port=${inBridgePort}`);
        if (outBridgePort) command.push(`=out-bridge-port=${outBridgePort}`);
    
        return this.apiSessions[i_RouterID].write('/ip/firewall/mangle/add', command)
            .then(() => logger.info(`Mangle connection rule for ${connectionMark} added successfully`))
            .catch((error) => {
                logger.error(`Failed to add mangle connection rule for ${connectionMark}: ${error}`);
                throw new Error(`Failed to add mangle connection rule for ${connectionMark}`);
            });
    }    
    
    public async markPacket(i_RouterID:string, params: PacketMarkParams) {
        if (!this.apiSessions[i_RouterID]) {
            throw new Error('API session not initialized');
        }
        const {
            chain,
            connectionMark,
            packetMark,
            passthrough = 'no',
            srcAddress,
            dstAddress,
            srcPort,
            dstPort,
            protocol,
            inInterface,
            outInterface,
            inBridgePort,
            outBridgePort,
        } = params;
    
        const command = [
            '=action=mark-packet',
            `=chain=${chain}`,
            `=connection-mark=${connectionMark}`,
            `=new-packet-mark=${packetMark}`,
            `=passthrough=${passthrough}`,
        ];
    
        if (srcAddress) command.push(`=src-address=${srcAddress}`);
        if (dstAddress) command.push(`=dst-address=${dstAddress}`);
        if (srcPort) command.push(`=src-port=${srcPort}`);
        if (dstPort) command.push(`=dst-port=${dstPort}`);
        if (protocol) command.push(`=protocol=${protocol}`);
        if (inInterface) command.push(`=in-interface=${inInterface}`);
        if (outInterface) command.push(`=out-interface=${outInterface}`);
        if (inBridgePort) command.push(`=in-bridge-port=${inBridgePort}`);
        if (outBridgePort) command.push(`=out-bridge-port=${outBridgePort}`);
    
        return this.apiSessions[i_RouterID].write('/ip/firewall/mangle/add', command)
            .then(() => logger.info(`Mangle packet rule for ${packetMark} added successfully`))
            .catch((error) => {
                logger.error(`Failed to add mangle packet rule for ${packetMark}: ${error}`);
                throw new Error(`Failed to add mangle packet rule for ${packetMark}`);
            }
        );
    }
    
    public async dropPacket(i_RouterID:string, params: PacketDropParams) {
        if (!this.apiSessions[i_RouterID]) {
            throw new Error('API session not initialized');
        }
        const {
            chain,
            srcAddress,
            dstAddress,
            srcPort,
            dstPort,
            protocol,
            inInterface,
            outInterface,
            connectionMark
        } = params;
    
        const command = [
            '=action=drop',
            `=chain=${chain}`
        ];
    
        if (srcAddress) command.push(`=src-address=${srcAddress}`);
        if (dstAddress) command.push(`=dst-address=${dstAddress}`);
        if (srcPort) command.push(`=src-port=${srcPort}`);
        if (dstPort) command.push(`=dst-port=${dstPort}`);
        if (protocol) command.push(`=protocol=${protocol}`);
        if (inInterface) command.push(`=in-interface=${inInterface}`);
        if (outInterface) command.push(`=out-interface=${outInterface}`);
        if (connectionMark) command.push(`=connection-mark=${connectionMark}`);
    
        return this.apiSessions[i_RouterID].write('/ip/firewall/filter/add', command)
            .then(() => logger.info(`Drop packet rule added successfully`))
            .catch((error) => {
                logger.error(`Failed to add drop packet rule: ${error}`);
                throw new Error(`Failed to add drop packet rule`);
            }
        );
    }

    public async addNodeToQueueTree(i_RouterID:string, params: AddNodeToQueueTreeParams) {
        if (!this.apiSessions[i_RouterID]) {
            throw new Error('API session not initialized');
        }
        const {
            name,
            parent,
            packetMark,
            priority,
            maxLimit,
            limitAt,
            burstLimit,
            burstThreshold,
            burstTime,
            queueType,
        } = params;
    
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
    
        return this.apiSessions[i_RouterID].write('/queue/tree/add', command)
            .then(() => logger.info(`Node ${name} added to queue tree successfully`))
            .catch((error) => {
                logger.error(`Failed to add node to queue tree for ${name}: ${error}`);
                throw new Error(`Failed to add node to queue tree for ${name}`);
            }
        );
    }
    
    public async updateNodePriority(i_RouterID:string, name: string, newPriority: string) {
        if (!this.apiSessions[i_RouterID]) {
            throw new Error('API session not initialized');
        }
    
        const command = [
            `=numbers=${name}`,
            `=priority=${newPriority}`,
        ];
    
        return this.apiSessions[i_RouterID].write('/queue/tree/set', command)
            .then(() => logger.info(`Priority for node ${name} updated successfully`))
            .catch((error) => {
                logger.error(`Failed to update priority for node ${name}: ${error}`);
                throw new Error(`Failed to update priority for node ${name}`);
            }
        );
    }

    public async disconnect(i_RouterID:string): Promise<void> {
        if (this.apiSessions[i_RouterID]) {
            await this.apiSessions[i_RouterID].close();
            logger.info('API client disconnected');
        }
    }
}

const apiClient = new APIClient();

export default apiClient;
