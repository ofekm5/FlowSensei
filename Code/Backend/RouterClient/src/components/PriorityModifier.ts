import apiClient from "./APIClient";

interface ChangePriorityMessage {
    type: "change_priority";
    priorities: string[];
}

const gamingPorts = [
    {name: 'steam', ports: '27014-27050,3478,4379,4380', protocol: 'udp'},
    {name: 'steam', ports: '27014-27050,80,443', protocol: 'tcp'},

]

const changePriority = async (command: ChangePriorityMessage)=>{
    //delete previous queue
    const priorities = command.priorities;
    for(let i = 0; i < priorities.length; i++){
        const priority = priorities[i];
        addMangle(priority);    
    }
    createQueueTree(priorities);
}

async function addMangle(priority: string) {
    try {
        switch(priority){
            case 'web-surfing':
                mangleWebSurfing();
                break;
            case 'gaming':
                mangleGaming();
                break;
            case 'video-calls':
                mangleAllVideoCalls();
                break;
            case 'email':
                mangleEmails();
                break;
        }
    } 
    catch (error) {
        throw new Error((error as Error).message)
    }
}

async function mangleWebSurfing() {
    return apiClient.write('/ip/firewall/mangle/add', [
        '=action=mark-connection',
        '=chain=prerouting',
        '=dst-port=80,443',
        '=new-connection-mark=web-surfing',
        '=passthrough=yes',
        '=protocol=tcp',
    ]).then(() => {
        return apiClient.write('/ip/firewall/mangle/add', [
            '=action=mark-connection',
            '=chain=prerouting',
            '=dst-port=53',
            '=new-connection-mark=web-surfing',
            '=passthrough=yes',
            '=protocol=udp',
        ]);
    }).then(() => {
        return apiClient.write('/ip/firewall/mangle/add', [
            '=action=mark-packet',
            '=chain=prerouting',
            '=connection-mark=web-surfing',
            '=new-packet-mark=web-surfing-packet',
            '=passthrough=no',
        ]);
    }).catch((error) => {
        throw new Error('Failed to mangle web surfing');
    });
}

async function mangleEmails() {
    try {
        await conn.write('/ip/firewall/mangle/add', [
            '=action=mark-connection',
            '=chain=prerouting',
            '=dst-port=25,587,465,110,995,143,993',
            '=new-connection-mark=email',
            '=passthrough=yes',
            '=protocol=tcp',
        ]);
        await conn.write('/ip/firewall/mangle/add', [
            '=action=mark-packet',
            '=chain=prerouting',
            '=dst-port=53',
            '=new-connection-mark=email',
            '=passthrough=no',
            '=protocol=udp',
        ]);
        await conn.write('/ip/firewall/mangle/add', [
            '=action=mark-packet',
            '=chain=prerouting',
            '=connection-mark=email',
            '=new-packet-mark=email-packet',
            '=passthrough=no',
        ]);
    } 
    catch (error) {
        throw new Error('Failed to mangle emails');
    }
}


async function mangleAllVideoCalls() {
    try {
        console.log("connecting to router")
        const client = await conn.connect();
        console.log("connected to router");
        console.log("mangling video calls");
        await conn.write('/ip/firewall/mangle/add', [
            '=action=mark-connection',
            '=chain=prerouting',
            '=dst-port=80,443,8801,8802,50000-50059',
            '=new-connection-mark=video-calls',
            '=passthrough=yes',
            '=protocol=tcp',
        ]);
        await conn.write('/ip/firewall/mangle/add', [
            '=action=mark-connection',
            '=chain=prerouting',
            '=dst-port=19302-19309,3478-3481,8801-8810,50000-50059',
            '=new-connection-mark=video-calls',
            '=passthrough=yes',
            '=protocol=udp',
        ]);
        await conn.write('/ip/firewall/mangle/add', [
            '=action=mark-packet',
            '=chain=prerouting',
            '=connection-mark=video-calls',
            '=new-packet-mark=video-calls-packet',
            '=passthrough=no',
        ]);
    }
    catch (error) {
        throw new Error('Failed to mangle video calls');
    }
    finally{
        await conn.close();
    }
}

async function mangleGaming() {
    try {
        console.log("connecting to router")
        const client = await conn.connect();
        console.log("connected to router");
        console.log("mangling gaming ports");
        for(let i = 0; i < knownGamingPorts.length; i++){
            const gamingPort = knownGamingPorts[i];
            console.log(gamingPort);
            await conn.write('/ip/firewall/mangle/add', [
                '=action=mark-connection',
                '=chain=prerouting',
                `=dst-port=${gamingPort.ports}`,
                '=new-connection-mark=gaming',
                '=passthrough=yes',
                `=protocol=${gamingPort.protocol}`,
            ]);
        }
        await conn.write('/ip/firewall/mangle/add', [
            '=action=mark-packet',
            '=chain=prerouting',
            '=connection-mark=gaming',
            '=new-packet-mark=gaming-packet',
            '=passthrough=no',
        ]);
    } 
    catch (error) {
      throw new Error('Failed to mangle gaming');  
    }
    finally{
        await conn.close();
    }
}

async function createQueueTree(priorities: string[]) {
    try {
         await conn.write('/queue/tree/add', [
             '=name=root',
             '=parent=global',
         ]
         );
 
         for(let i = 0; i < priorities.length; i++){
             let priority = priorities[i];
             priority += '-packet';
             await conn.write('/queue/tree/add',
             [
                 '=name=root',
                 '=packet-marks=' + priority,
                 '=priority=' + (i + 1),
             ]);
         }
    } 
    catch (error) {
     throw new Error('Failed to create queue tree');
    }
 }


 export default changePriority;