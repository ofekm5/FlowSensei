interface MarkParams{
    type: string;
    chain: string,
    connectionMark?: string,
    passthrough?: string,
    protocol?: string,
    inInterface?: string;
    outInterface?: string;
    srcAddress?: string;
    srcPort?: string;
    dstPort?: string;
    dstAddress?: string;
}

export interface ConnectionMarkParams extends MarkParams{
    srcAdresses?: string;
    inBridgePort?: string;
    outBridgePort?: string;
}

export interface PacketMarkParams extends MarkParams{
    srcAddress?: string;
    packetMark?: string;
    dstAddress?: string;
    dstPort?: string;
    inBridgePort?: string;
    outBridgePort?: string;
}

export interface PacketDropParams extends MarkParams{
    packetMark?: string;
    dstAddress?: string;
    dstPort?: string;
}

export interface CreateAddressListParams extends MarkParams{
    adressList: string;
    content: string;
}

export interface AddNodeToQueueTreeParams{
    type: string;
    name: string;
    parent?: string;
    packetMark?: string;
    priority?: string;
    maxLimit?: string;
    limitAt?: string;
    burstLimit?: string;
    burstThreshold?: string;
    burstTime?: string;
    queueType?: string;
}

export interface UpdateNodePriorityParams{
    type: string;
    name: string;
    newPriority: string;
}

export const commonServicesToPorts = [
    {
        service: 'email',
        protocol: 'tcp',
        dstPorts: ['25', '587', '465', '110', '995', '143', '993']
    },
    {
        service: 'email',
        protocol: 'udp',
        dstPorts: ['53']
    },
    {
      service: 'web-browsing',
      protocol: 'tcp',
      dstPorts: ['80', '443']
    },
    {
      service: 'web-browsing',
      protocol: 'udp',
      dstPorts: ['53']
    },
    {
      service: 'voip',
      protocol: 'udp',
      dstPorts: ['19302-19309', '3478-3481', '8801-8810','50000-50059' ]
    },
    {
        service: 'voip',
        protocol: 'tcp',
        dstPorts: ['80', '443', '8801', '8802', '50000-50059']
    },
    {
        service: 'file-transfer',
        protocol: 'tcp',
        dstPorts: ['20', '21', '22', '80', '443']
    }, 
    {
        service: 'streaming',
        protocol: 'tcp',
        dstPorts: ['80', '443', '1935']
    },
    {
        service: 'streaming',
        protocol: 'udp',
        dstPorts: ['1935']
    },
] 
 