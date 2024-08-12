import logger from "../logger";
import { RouterOSAPI } from 'node-routeros';

interface markServiceParams {
    service: string;
    protocol: string;
    dstPort: string;
    srcPort?: string;
    srcAddress?: string;
    dstAddress?: string;
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

    //Each connection mark is uniquely associated with a single packet mark
    public markService(i_RouterID: string, params: markServiceParams): void {
        this.markConnection(i_RouterID, params.service + "_connection", params.protocol, params.srcPort, params.dstPort, params.srcAddress, params.dstAddress)
            .then(() => {
                return this.markPacket(i_RouterID, params.service + "_packet", params.service + "_connection", params.protocol, params.srcPort, params.dstPort, params.srcAddress, params.dstAddress);
            })
            .then(() => {
                logger.info(`Successfully marked connection and packet for service: ${params.service}`);
            })
            .catch((error) => {
                logger.error(`Failed to mark service for ${params.service}: ${error}`);
            });
    }

    private async markConnection(i_RouterID: string, connectionMark: string, protocol: string, srcPort: string | undefined, dstPort: string, srcAddress: string | undefined, dstAddress: string | undefined): Promise<void> {
        if (!this.apiSessions[i_RouterID]) {
            throw new Error('API session not initialized');
        }

        const command = [
            '=action=mark-connection',
            `=chain=prerouting`,
            `=new-connection-mark=${connectionMark}`,
            `=passthrough=yes`,
        ];
    
        command.push(`=dst-port=${dstPort}`);
        if (protocol) command.push(`=protocol=${protocol}`);
        if (srcAddress) command.push(`=src-address=${srcAddress}`);
        if (dstAddress) command.push(`=dst-address=${dstAddress}`);
        if (srcPort) command.push(`=src-port=${srcPort}`);
    
        return this.apiSessions[i_RouterID].write('/ip/firewall/mangle/add', command)
            .then(() => logger.info(`Mangle connection rule for ${connectionMark} added successfully`))
            .catch((error) => {
                logger.error(`Failed to add mangle connection rule for ${connectionMark}: ${error}`);
                throw new Error(`Failed to add mangle connection rule for ${connectionMark}`);
            });
    }
    
    private async markPacket(i_RouterID: string, packetMark: string, connectionMark: string, protocol: string, srcPort: string | undefined, dstPort: string, srcAddress: string | undefined, dstAddress: string | undefined): Promise<void> {
        if (!this.apiSessions[i_RouterID]) {
            throw new Error('API session not initialized');
        }
        
        const command = [
            '=action=mark-packet',
            `=chain=prerouting`,
            `=connection-mark=${connectionMark}`,
            `=new-packet-mark=${packetMark}`,
        ];
    
        command.push(`=dst-port=${dstPort}`);
        if (srcAddress) command.push(`=src-address=${srcAddress}`);
        if (dstAddress) command.push(`=dst-address=${dstAddress}`);
        if (srcPort) command.push(`=src-port=${srcPort}`);
        if (protocol) command.push(`=protocol=${protocol}`);
    
        return this.apiSessions[i_RouterID].write('/ip/firewall/mangle/add', command)
            .then(() => logger.info(`Mangle packet rule for ${packetMark} added successfully`))
            .catch((error) => {
                logger.error(`Failed to add mangle packet rule for ${packetMark}: ${error}`);
                throw new Error(`Failed to add mangle packet rule for ${packetMark}`);
            });
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


    public async adjustLimit(queueName: string, maxBandwidth: number, threshold: number, incrementStep: number, minLimitAt: number, maxLimitAt: number) {
        for (const [routerID, apiSession] of Object.entries(this.apiSessions)) {
            try {
                const [interfaceStats] = await apiSession.write('/interface/monitor-traffic', [
                    '=interface=ether1', // Replace 'ether1' with your interface name
                    '=once=',
                ]);
    
                const inUsage = parseInt(interfaceStats['rx-bits-per-second'], 10) / 1000; // Convert to kbps
                const outUsage = parseInt(interfaceStats['tx-bits-per-second'], 10) / 1000; // Convert to kbps
                const totalUsage = inUsage + outUsage;
    
                const [queue] = await apiSession.write('/queue/tree/print', [
                    `?name=${queueName}`,
                ]);
                const currentLimitAt = parseInt(queue['limit-at'], 10);
    
                let newLimitAt = currentLimitAt;
    
                if (totalUsage > (maxBandwidth * threshold / 100)) {
                    newLimitAt = Math.min(currentLimitAt + incrementStep, maxLimitAt);
                    logger.info(`Router ${routerID}: Bandwidth exceeded ${threshold}%, increasing limit-at to ${newLimitAt} kbps`);
                } 
                else {
                    newLimitAt = Math.max(currentLimitAt - incrementStep, minLimitAt);
                    logger.info(`Router ${routerID}: Bandwidth below ${threshold}%, decreasing limit-at to ${newLimitAt} kbps`);
                }
    
                await apiSession.write('/queue/tree/set', [
                    `=name=${queueName}`,
                    `=limit-at=${newLimitAt}`,
                ]);
                logger.info(`Router ${routerID}: Set limit-at for ${queueName} to ${newLimitAt} kbps`);
    
            } 
            catch (error) {
                logger.error(`Router ${routerID}: Failed to adjust limit-at ${error}`);
            }
        }
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
