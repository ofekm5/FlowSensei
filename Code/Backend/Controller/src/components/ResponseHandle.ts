import { ConnectionMarkParams, PacketMarkParams, PacketDropParams, CreateAddressListParams, AddNodeToQueueTreeParams, UpdateNodePriorityParams, commonServicesToPorts } from '../servicesDefinitions';
import logger from "../logger";
import { sendMessageToQueue } from './MQClient';

async function markConnectionsAndPackets() {
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
}