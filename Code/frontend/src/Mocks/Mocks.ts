import { PreferenceType } from "../models/PreferenceType.model";
import { CommunicationType } from "../models/CommunicationType.model";

export const typesMock: PreferenceType[] = [
    {id:"111",title:"High Priority"}, 
    // {id:"222",title:"Low Priority"},
]

export const commMock: CommunicationType[] = [
    {id:"1",columnId:"111",content:"YouTube"}, 
    {id:"2",columnId:"111",content:"Streaming"}, 
    {id:"3",columnId:"111",content:"Gaming"}, 
    {id:"4",columnId:"111",content:"Downloads"}, 
    {id:"5",columnId:"111",content:"E-Mail"},
]