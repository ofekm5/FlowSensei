import { PreferenceType } from "../models/PreferenceType.model";
import { Service } from "../models/Serivce.model";

export const typesMock: PreferenceType[] = [
    {id:"111",title:"High Priority"}, 
]

export const commMock: Service[] = [
    {id:"2",columnId:"111",content:"Streaming", dstPort: 8080, protocol: 'UDP'}, 
    {id:"3",columnId:"111",content:"Gaming", dstPort: 2045, protocol: 'UDP'}, 
    {id:"4",columnId:"111",content:"Downloads", dstPort: 40, protocol: 'TCP'}, 
    {id:"6",columnId:"111",content:"Zoom", dstPort: 8080, protocol: 'UDP'},
    {id:"1",columnId:"111",content:"YouTube", dstPort: 80, protocol: 'TCP'}, 
    {id:"5",columnId:"111",content:"E-Mail", dstPort: 24, protocol: 'SMTP'},
]