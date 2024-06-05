import { Client, ConnectConfig  } from 'ssh2';
import { RouterOSAPI } from 'node-routeros';
import logger from "../logger";
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

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


class APIClient {
    private sshConfig: ConnectConfig;
    private conn: Client;
    private apiSession: RouterOSAPI;

    constructor() {
        this.conn = new Client();
        this.sshConfig = {
            host: process.env.DNS_NAME!,
            port: process.env.SSH_PORT ? +process.env.SSH_PORT : 22, 
            username: process.env.USERNAME!,
            password: process.env.PASSWORD!,
            privateKey: fs.readFileSync('./flowSensei'),
            passphrase: process.env.PRIVATE_KEY_PASSPHRASE,
            readyTimeout: 20000
        };
        this.apiSession = new RouterOSAPI({
            host: '127.0.0.1',
            user: process.env.USERNAME!,
            password: process.env.PASSWORD!,
            port: process.env.API_PORT ? +process.env.API_PORT : 8728
        });
    }

    public connectSSH(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.conn.on('ready', () => {
                logger.info('SSH connection established');
                this.initializeSession();
                resolve();
            }).connect(this.sshConfig);
    
            this.conn.on('error', (err) => {
                logger.error(`SSH connection error: ${err}`);
                reject(err);
            });
    
            this.conn.on('end', () => {
                logger.info('SSH connection ended');
            });
    
            this.conn.on('close', () => {
                logger.info('SSH connection closed');
            });
        });
    }    

    private initializeSession() {
        this.apiSession.connect().then(() => {
            logger.info('API client connected');
        }).catch((err: any) => {
            logger.error(`API client connection error: ${err}`);
        });
    }

    public async login(){
        try{
            const result = this.apiSession.write(`/user/print?where=name=${this.sshConfig.username}`).then(
                (data) => {
                    if(data.length > 0 && data[0].password === this.sshConfig.password){
                        logger.info('user logged in');
                    }
                    else{
                        logger.error('user not found');
                    }
                }
            );
        }
        catch(error){
            logger.error('Failed to login');
            throw new Error('Failed to login');
        }
    }

    public async markConnection(params: MarkConnectionParams) {
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

    async createAddressLists(urls: string[], listName: string) { // 
        let promises = [];
        for (const item of urls) {
            promises.push(
                this.apiSession.write('/ip/firewall/address-list/add', [
                    '=action=add-dst-to-address-list',
                    `=address-list=${listName}`,
                    '=chain=forward',
                    `=content=${item}`,
                ])
            );
        }
        await Promise.all(promises).then(() => {
            logger.info('Address lists created');
        }).catch((error) => {
            logger.error('Failed to create address lists ' + error);
            throw new Error('Failed to create address lists');
        });
    }
}

const apiClient = new APIClient();

export default apiClient;
