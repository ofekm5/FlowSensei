import { ConnectionMarkParams, PacketMarkParams, PacketDropParams, CreateAddressListParams, AddNodeToQueueTreeParams, UpdateNodePriorityParams, commonServicesToPorts } from '../servicesDefinitions';
import logger from "../logger";
import { sendMessageToQueue } from './MQClient';

export async function markConnectionsAndPackets() {
    const connectionMarkNames = new Set<string>();
    for(let service of commonServicesToPorts){
        const serviceName = service.service;
        const protocol = service.protocol;
        const dstPorts = service.dstPorts;
        const dstPortsString = dstPorts.join(',');
        connectionMarkNames.add(serviceName);
        const connectionMarkParams: ConnectionMarkParams = {
            type: 'connection-mark',
            chain: 'prerouting',
            connectionMark: serviceName,
            protocol: protocol,
            dstPort: dstPortsString,
            passthrough: 'yes'
        }

        const connectionMarkMsg = JSON.stringify(connectionMarkParams);
        const response = await sendMessageToQueue(connectionMarkMsg);
        logger.info('sent connection mark: ' + response);
    }

    for(let connectionMark of connectionMarkNames){
        const packetMarkParams: PacketMarkParams = {
            type: 'packet-mark',
            chain: 'prerouting',
            connectionMark: connectionMark,
            packetMark: connectionMark + 'packet',
            passthrough: 'no'
        }

        const packetMarkMsg = JSON.stringify(packetMarkParams);
        const response = await sendMessageToQueue(packetMarkMsg);
        logger.info('sent packet mark: ' + response);
    }

    return "marked connections and packets succesfully";
}

export async function createNewPriorityQueue(priorities: any){
    const upperTreeMsgParams: AddNodeToQueueTreeParams = {
        type: 'queue-tree',
        name: 'root',
        parent: 'global',
        maxLimit: '100M',
    }

    const firstQueueTreeMsg = JSON.stringify(upperTreeMsgParams);
    const response = await sendMessageToQueue(firstQueueTreeMsg);
    logger.info('sent upper tree: ' + response);
    logger.info('priorities: ' + priorities);

    for(let priority of priorities){
        const packetMark = priority + '-packet';
        const addNodeToQueueTreeParams: AddNodeToQueueTreeParams = {
            type: 'queue-tree',
            name: 'root',
            packetMark: packetMark,
            priority: (priorities.indexOf(priority) + 1).toString(),
        }

        const msgToPublish = JSON.stringify(addNodeToQueueTreeParams);
        const response = await sendMessageToQueue(msgToPublish);
        logger.info('response sent : ' + response);
    }

    return "created new priority queue succesfully";
}

export async function updateNodesPriority(serviceName: string, newPriority: string){
    const updateNodePriority: UpdateNodePriorityParams = {
        type: 'update-node-priority',
        name: serviceName,
        newPriority: newPriority
    }
    
    const msgToPublish = JSON.stringify(updateNodePriority);
    const response = await sendMessageToQueue(msgToPublish);
    return response;
}

export async function login(username: string, password: string, publicIp: string, routerID:string){
    const msgToSend = {
        type: 'login',
        username: username,
        password: password,
        publicIp: publicIp,
        routerID: routerID
    }

    const response = await sendMessageToQueue(JSON.stringify(msgToSend));
    return response;
}

export async function logout(){
    const msgToSend = {
        type: 'logout'
    }

    const response = await sendMessageToQueue(JSON.stringify(msgToSend));
    return response;
}