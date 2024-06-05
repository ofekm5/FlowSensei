"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ssh2_1 = require("ssh2");
const node_routeros_1 = require("node-routeros");
const logger_1 = __importDefault(require("../logger"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class APIClient {
    constructor() {
        this.conn = new ssh2_1.Client();
        this.sshConfig = {
            host: process.env.DNS_NAME,
            port: process.env.SSH_PORT ? +process.env.SSH_PORT : 22,
            username: process.env.USERNAME,
            password: process.env.PASSWORD,
            privateKey: fs_1.default.readFileSync('./flowSensei'),
            passphrase: process.env.PRIVATE_KEY_PASSPHRASE,
            readyTimeout: 20000
        };
        this.apiSession = new node_routeros_1.RouterOSAPI({
            host: '127.0.0.1',
            user: process.env.USERNAME,
            password: process.env.PASSWORD,
            port: process.env.API_PORT ? +process.env.API_PORT : 8728
        });
    }
    connectSSH() {
        return new Promise((resolve, reject) => {
            this.conn.on('ready', () => {
                logger_1.default.info('SSH connection established');
                this.initializeSession();
                resolve();
            }).connect(this.sshConfig);
            this.conn.on('error', (err) => {
                logger_1.default.error(`SSH connection error: ${err}`);
                reject(err);
            });
            this.conn.on('end', () => {
                logger_1.default.info('SSH connection ended');
            });
            this.conn.on('close', () => {
                logger_1.default.info('SSH connection closed');
            });
        });
    }
    initializeSession() {
        this.apiSession.connect().then(() => {
            logger_1.default.info('API client connected');
        }).catch((err) => {
            logger_1.default.error(`API client connection error: ${err}`);
        });
    }
    async login() {
        try {
            const result = this.apiSession.write(`/user/print?where=name=${this.sshConfig.username}`).then((data) => {
                if (data.length > 0 && data[0].password === this.sshConfig.password) {
                    logger_1.default.info('user logged in');
                }
                else {
                    logger_1.default.error('user not found');
                }
            });
        }
        catch (error) {
            logger_1.default.error('Failed to login');
            throw new Error('Failed to login');
        }
    }
    async markConnection(params) {
        const { chain, connectionMark, passthrough = 'yes', ports, protocol, addressList, srcAddress, dstAddress, srcPort, inInterface, outInterface, connectionType, srcAddressList, inBridgePort, outBridgePort, time, day, srcAddressType, dstAddressType, } = params;
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
        if (addressList)
            command.push(`=dst-address-list=${addressList}`);
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
        if (connectionType)
            command.push(`=connection-type=${connectionType}`);
        if (srcAddressList)
            command.push(`=src-address-list=${srcAddressList}`);
        if (inBridgePort)
            command.push(`=in-bridge-port=${inBridgePort}`);
        if (outBridgePort)
            command.push(`=out-bridge-port=${outBridgePort}`);
        if (time)
            command.push(`=time=${time}`);
        if (day)
            command.push(`=day=${day}`);
        if (srcAddressType)
            command.push(`=src-address-type=${srcAddressType}`);
        if (dstAddressType)
            command.push(`=dst-address-type=${dstAddressType}`);
        return this.apiSession.write('/ip/firewall/mangle/add', command).catch((error) => {
            logger_1.default.error(`Failed to add mangle connection rule for ${connectionMark}`);
            throw new Error(`Failed to add mangle connection rule for ${connectionMark}`);
        });
    }
    async markPacket(params) {
        const { chain, connectionMark, packetMark, passthrough = 'no', srcAddress, dstAddress, srcPort, dstPort, protocol, inInterface, outInterface, srcAddressList, dstAddressList, inBridgePort, outBridgePort, time, day, srcAddressType, dstAddressType, } = params;
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
        if (srcAddressList)
            command.push(`=src-address-list=${srcAddressList}`);
        if (dstAddressList)
            command.push(`=dst-address-list=${dstAddressList}`);
        if (inBridgePort)
            command.push(`=in-bridge-port=${inBridgePort}`);
        if (outBridgePort)
            command.push(`=out-bridge-port=${outBridgePort}`);
        if (time)
            command.push(`=time=${time}`);
        if (day)
            command.push(`=day=${day}`);
        if (srcAddressType)
            command.push(`=src-address-type=${srcAddressType}`);
        if (dstAddressType)
            command.push(`=dst-address-type=${dstAddressType}`);
        return this.apiSession.write('/ip/firewall/mangle/add', command).catch((error) => {
            logger_1.default.error(`Failed to add mangle packet rule for ${connectionMark}`);
            throw new Error(`Failed to add mangle packet rule for ${connectionMark}`);
        });
    }
    async dropPacket(params) {
        const { chain, passthrough = 'no', srcAddress, dstAddress, srcPort, dstPort, protocol, inInterface, outInterface, srcAddressList, dstAddressList, inBridgePort, outBridgePort, time, day, srcAddressType, dstAddressType, } = params;
        const command = [
            '=action=drop',
            `=chain=${chain}`,
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
        if (srcAddressList)
            command.push(`=src-address-list=${srcAddressList}`);
        if (dstAddressList)
            command.push(`=dst-address-list=${dstAddressList}`);
        if (inBridgePort)
            command.push(`=in-bridge-port=${inBridgePort}`);
        if (outBridgePort)
            command.push(`=out-bridge-port=${outBridgePort}`);
        if (time)
            command.push(`=time=${time}`);
        if (day)
            command.push(`=day=${day}`);
        if (srcAddressType)
            command.push(`=src-address-type=${srcAddressType}`);
        if (dstAddressType)
            command.push(`=dst-address-type=${dstAddressType}`);
        return this.apiSession.write('/ip/firewall/mangle/add', command).catch((error) => {
            logger_1.default.error(`Failed to add drop packet rule`);
            throw new Error(`Failed to add drop packet rule`);
        });
    }
    async createAddressLists(urls, listName) {
        let promises = [];
        for (const item of urls) {
            promises.push(this.apiSession.write('/ip/firewall/address-list/add', [
                '=action=add-dst-to-address-list',
                `=address-list=${listName}`,
                '=chain=forward',
                `=content=${item}`,
            ]));
        }
        await Promise.all(promises).then(() => {
            logger_1.default.info('Address lists created');
        }).catch((error) => {
            logger_1.default.error('Failed to create address lists ' + error);
            throw new Error('Failed to create address lists');
        });
    }
}
const apiClient = new APIClient();
exports.default = apiClient;
