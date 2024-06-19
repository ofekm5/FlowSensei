import logger from './logger';
import apiClient from './APIClient';


async function test() {
    try {
        await apiClient.login('147.235.196.0', 'admin', '9DCMK8E5PU');
        logger.info('Login successful');
    } catch (error) {
        logger.error(`Failed to establish SSH and API connection or login: ${error}`);
        return;
    }

    try {
        await apiClient.markConnection({
            chain: 'forward',
            connectionMark: 'testConnection',
            ports: '80',
            protocol: 'tcp',
            srcAddress: '192.168.1.1',
            dstAddress: '192.168.1.2',
            srcPort: '1000',
            inInterface: 'ether1',
            outInterface: 'ether2',
            inBridgePort: 'bridge',
            outBridgePort: 'bridge',
        });
        logger.info('markConnection successful');
    } catch (error) {
        logger.error(`Failed to mark connection: ${error}`);
    }

    try {
        await apiClient.markPacket({
            chain: 'forward',
            connectionMark: 'testConnection',
            packetMark: 'testPacket',
            srcAddress: '192.168.1.1',
            dstAddress: '192.168.1.2',
            srcPort: '1000',
            dstPort: '80',
            protocol: 'tcp',
            inInterface: 'ether1',
            outInterface: 'ether2',
            inBridgePort: 'bridge',
            outBridgePort: 'bridge',
        });
        logger.info('markPacket successful');
    } catch (error) {
        logger.error(`Failed to mark packet: ${error}`);
    }
    
    try {
        await apiClient.dropPacket({
            chain: 'forward',
            packetMark: 'testPacket',
            srcAddress: '192.168.1.1',
            dstAddress: '192.168.1.2',
            srcPort: '1000',
            dstPort: '80',
            protocol: 'tcp',
            inInterface: 'ether1',
            outInterface: 'bridge',
            connectionMark: 'testConnection'
        });
        logger.info(`dropPacket successful`);
    } catch (error) {
        logger.error(`Failed to drop packet: ${error}`);
    }

    try {
        await apiClient.addNodeToQueueTree({
            name: 'testQueue3',
            parent: 'global',
            packetMark: 'testPacket',
            priority: '1',
            maxLimit: '10M',
            limitAt: '5M',
            burstLimit: '12M',
            burstThreshold: '8M',
            burstTime: '10s',
            queueType: 'default',
        });
        logger.info('addNodeToQueueTree successful');
    } catch (error) {
        logger.error(`Failed to add node to queue tree: ${error}`);
    }
    
    try {
        await apiClient.updateNodePriority('testQueue', '2');
        logger.info('updateQueueTreeNodePriority successful');
    } catch (error) {
        logger.error(`Failed to update queue tree node priority: ${error}`);
    }
    finally {
        await apiClient.disconnect();
        logger.info('Disconnected');
    }
}