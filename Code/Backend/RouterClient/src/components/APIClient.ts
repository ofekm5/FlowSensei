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
            packetMark,
            priority,
        } = params;
    
        const command = [
            `=name=${name}`,
            `=parent=global`,
            `=packet-mark=${packetMark}`,
            `=priority=${priority}`,
            `=queue=default`,
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

    private async calculateTotalUsage(apiSession: RouterOSAPI): number {
        const interfaces = await apiSession.write('/interface/print', []);
        let totalInUsage = 0;
        let totalOutUsage = 0;
        for (const iface of interfaces) {
                    const [interfaceStats] = await apiSession.write('/interface/monitor-traffic', [
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

    public async adjustLimit() {
        const maxBandwidth = 100000; // 100 Mbps in kbps, according to MikroTik standards
        const threshold = 50;       // 50% threshold for bandwidth usage
        const incrementStep = 1000; // 1000 kbps increment step
        const minLimitAt = 10000;   // 10,000 kbps minimum limit-at value
        const maxLimitAt = 50000;   // 50,000 kbps maximum limit-at value
    
        for (const [routerID, apiSession] of Object.entries(this.apiSessions)) {
            try {
                const totalUsage = this.calculateTotalUsage(apiSession);
    
                const [globalQueue] = await apiSession.write('/queue/tree/print', [
                    `?name=global`, // Assuming the global queue is named 'global'
                ]);

                const globalMaxLimit = parseInt(globalQueue['max-limit'], 10);
                const globalLimitAt = parseInt(globalQueue['limit-at'], 10);
                const globalAvailableBandwidth = globalMaxLimit - globalLimitAt;
    
                let newLimitAt = globalLimitAt;
    
                // Check if the global queue has enough bandwidth available
                if (totalUsage > (maxBandwidth * threshold / 100) && globalAvailableBandwidth > incrementStep) {
                    newLimitAt = Math.min(globalLimitAt + incrementStep, maxLimitAt);
                    logger.info(`Router ${routerID}: Bandwidth exceeded ${threshold}%, increasing global limit-at to ${newLimitAt} kbps`);
                } 
                else if (totalUsage <= (maxBandwidth * threshold / 100)) {
                    newLimitAt = Math.max(globalLimitAt - incrementStep, minLimitAt);
                    logger.info(`Router ${routerID}: Bandwidth below ${threshold}%, decreasing global limit-at to ${newLimitAt} kbps`);
                } 
                else {
                    logger.warn(`Router ${routerID}: Not enough available bandwidth in global queue to increase limit-at`);
                }
    
                // Set the new limit-at value
                await apiSession.write('/queue/tree/set', [
                    `=name=global`,
                    `=limit-at=${newLimitAt}`,
                ]);
                logger.info(`Router ${routerID}: Set global limit-at to ${newLimitAt} kbps`);
    
            } 
            catch (error) {
                logger.error(`Router ${routerID}: Failed to adjust global limit-at ${error}`);
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
