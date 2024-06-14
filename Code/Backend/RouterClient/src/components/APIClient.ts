import logger from "../logger";
import { RouterOSAPI } from 'node-routeros';


interface MarkConnectionParams {
    chain: string;
    connectionMark: string;
    passthrough?: string;
    ports?: string | null;
    protocol?: string | null;
    addressList?: string;
    srcAddress?: string;
    dstAddress?: string;
    srcPort?: string;
    inInterface?: string;
    outInterface?: string;
    connectionType?: string;
    srcAddressList?: string;
    inBridgePort?: string;
    outBridgePort?: string;
    time?: string;
    day?: string;
    srcAddressType?: string;
    dstAddressType?: string;
}

interface MarkPacketParams {
    chain: string;
    connectionMark: string;
    packetMark: string;
    passthrough?: string;
    srcAddress?: string;
    dstAddress?: string;
    srcPort?: string;
    dstPort?: string;
    protocol?: string;
    inInterface?: string;
    outInterface?: string;
    srcAddressList?: string;
    dstAddressList?: string;
    inBridgePort?: string;
    outBridgePort?: string;
    time?: string;
    day?: string;
    srcAddressType?: string;
    dstAddressType?: string;
}

interface DropPacketParams {
    chain: string;
    passthrough?: string;
    srcAddress?: string;
    dstAddress?: string;
    srcPort?: string;
    dstPort?: string;
    protocol?: string;
    inInterface?: string;
    outInterface?: string;
    srcAddressList?: string;
    dstAddressList?: string;
    inBridgePort?: string;
    outBridgePort?: string;
    time?: string;
    day?: string;
    srcAddressType?: string;
    dstAddressType?: string;
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
    private apiSession!: RouterOSAPI;

    public async login(i_Host:string, i_Username:string, i_Password:string){
        try{
            this.apiSession = new RouterOSAPI({
                host: i_Host,
                user: i_Username,
                password: i_Password,
                port: 8728
            });
    
            this.apiSession.connect().then(() => {
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

    public async markConnection(params: MarkConnectionParams) {
        if (!this.apiSession) {
            throw new Error('API session not initialized');
        }
        const {
            chain,
            connectionMark,
            passthrough = 'yes',
            ports,
            protocol,
            addressList,
            srcAddress,
            dstAddress,
            srcPort,
            inInterface,
            outInterface,
            connectionType,
            srcAddressList,
            inBridgePort,
            outBridgePort,
            time,
            day,
            srcAddressType,
            dstAddressType,
        } = params;
    
        const command = [
            '=action=mark-connection',
            `=chain=${chain}`,
            `=new-connection-mark=${connectionMark}`,
            `=passthrough=${passthrough}`,
        ];
    
        if (ports) command.push(`=dst-port=${ports}`);
        if (protocol) command.push(`=protocol=${protocol}`);
        if (addressList) command.push(`=dst-address-list=${addressList}`);
        if (srcAddress) command.push(`=src-address=${srcAddress}`);
        if (dstAddress) command.push(`=dst-address=${dstAddress}`);
        if (srcPort) command.push(`=src-port=${srcPort}`);
        if (inInterface) command.push(`=in-interface=${inInterface}`);
        if (outInterface) command.push(`=out-interface=${outInterface}`);
        if (connectionType) command.push(`=connection-type=${connectionType}`);
        if (srcAddressList) command.push(`=src-address-list=${srcAddressList}`);
        if (inBridgePort) command.push(`=in-bridge-port=${inBridgePort}`);
        if (outBridgePort) command.push(`=out-bridge-port=${outBridgePort}`);
        if (time) command.push(`=time=${time}`);
        if (day) command.push(`=day=${day}`);
        if (srcAddressType) command.push(`=src-address-type=${srcAddressType}`);
        if (dstAddressType) command.push(`=dst-address-type=${dstAddressType}`);
    
        return this.apiSession.write('/ip/firewall/mangle/add', command).catch((error) => {
            logger.error(`Failed to add mangle connection rule for ${connectionMark}`);
            throw new Error(`Failed to add mangle connection rule for ${connectionMark}`);
        });
    }
    
    public async markPacket(params: MarkPacketParams) {
        if (!this.apiSession) {
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
            srcAddressList,
            dstAddressList,
            inBridgePort,
            outBridgePort,
            time,
            day,
            srcAddressType,
            dstAddressType,
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
        if (srcAddressList) command.push(`=src-address-list=${srcAddressList}`);
        if (dstAddressList) command.push(`=dst-address-list=${dstAddressList}`);
        if (inBridgePort) command.push(`=in-bridge-port=${inBridgePort}`);
        if (outBridgePort) command.push(`=out-bridge-port=${outBridgePort}`);
        if (time) command.push(`=time=${time}`);
        if (day) command.push(`=day=${day}`);
        if (srcAddressType) command.push(`=src-address-type=${srcAddressType}`);
        if (dstAddressType) command.push(`=dst-address-type=${dstAddressType}`);
    
        return this.apiSession.write('/ip/firewall/mangle/add', command).catch((error) => {
            logger.error(`Failed to add mangle packet rule for ${connectionMark}`);
            throw new Error(`Failed to add mangle packet rule for ${connectionMark}`);
        });
    }
    
    public async dropPacket(params: DropPacketParams) {
        if (!this.apiSession) {
            throw new Error('API session not initialized');
        }
        const {
            chain,
            passthrough = 'no',
            srcAddress,
            dstAddress,
            srcPort,
            dstPort,
            protocol,
            inInterface,
            outInterface,
            srcAddressList,
            dstAddressList,
            inBridgePort,
            outBridgePort,
            time,
            day,
            srcAddressType,
            dstAddressType,
        } = params;
    
        const command = [
            '=action=drop',
            `=chain=${chain}`,
            `=passthrough=${passthrough}`,
        ];
    
        if (srcAddress) command.push(`=src-address=${srcAddress}`);
        if (dstAddress) command.push(`=dst-address=${dstAddress}`);
        if (srcPort) command.push(`=src-port=${srcPort}`);
        if (dstPort) command.push(`=dst-port=${dstPort}`);
        if (protocol) command.push(`=protocol=${protocol}`);
        if (inInterface) command.push(`=in-interface=${inInterface}`);
        if (outInterface) command.push(`=out-interface=${outInterface}`);
        if (srcAddressList) command.push(`=src-address-list=${srcAddressList}`);
        if (dstAddressList) command.push(`=dst-address-list=${dstAddressList}`);
        if (inBridgePort) command.push(`=in-bridge-port=${inBridgePort}`);
        if (outBridgePort) command.push(`=out-bridge-port=${outBridgePort}`);
        if (time) command.push(`=time=${time}`);
        if (day) command.push(`=day=${day}`);
        if (srcAddressType) command.push(`=src-address-type=${srcAddressType}`);
        if (dstAddressType) command.push(`=dst-address-type=${dstAddressType}`);
    
        return this.apiSession.write('/ip/firewall/mangle/add', command).catch((error) => {
            logger.error(`Failed to add drop packet rule`);
            throw new Error(`Failed to add drop packet rule`);
        });
    }

    public async addNodeToQueueTree(params: AddNodeToQueueTreeParams) {
        if (!this.apiSession) {
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
    
        return this.apiSession.write('/queue/tree/add', command).catch((error) => {
            logger.error(`Failed to add node to queue tree for ${name}`);
            throw new Error(`Failed to add node to queue tree for ${name}`);
        });
    }
    
    public async updateNodePriority(name: string, newPriority: string) {
        if (!this.apiSession) {
            throw new Error('API session not initialized');
        }
    
        const command = [
            `=numbers=${name}`,
            `=priority=${newPriority}`,
        ];
    
        return this.apiSession.write('/queue/tree/set', command).catch((error) => {
            logger.error(`Failed to update priority for node ${name}`);
            throw new Error(`Failed to update priority for node ${name}`);
        });
    }

    // async createAddressLists(urls: string[], listName: string) { 
    //     if (!this.apiSession) {
    //         throw new Error('API session not initialized');
    //     }
    //     let promises = [];
    //     for (const item of urls) {
    //         promises.push(
    //             this.apiSession.write('/ip/firewall/address-list/add', [
    //                 '=action=add-dst-to-address-list',
    //                 `=address-list=${listName}`,
    //                 '=chain=forward',
    //                 `=content=${item}`,
    //             ])
    //         );
    //     }
    //     await Promise.all(promises).then(() => {
    //         logger.info('Address lists created');
    //     }).catch((error) => {
    //         logger.error('Failed to create address lists ' + error);
    //         throw new Error('Failed to create address lists');
    //     });
    // }
}

const apiClient = new APIClient();

export default apiClient;
