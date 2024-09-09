export type Router = {
    router_id: string;
    public_ip: string;
};

export type Service = {
    name: string;
    protocol: string;
    dstPort: string;
    srcPort?: string;
    srcAddress?: string;
    dstAddress?: string;
};

export type Node = {
    serviceName: string;
    parent: string;
    priority: string;
};
