export interface CommunicationType {
    id: string;
    columnId: string;
    content: string;
    protocol: string;
    dstPort: number;
    srcAddr?: string;
    dstAddr?: string; 
    srcPort?: number;
}