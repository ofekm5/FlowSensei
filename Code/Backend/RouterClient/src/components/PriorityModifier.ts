import logger from "../logger";
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
                case 'social-media':
                mangleSocialMedia();
                break;
            case 'unclassified':
                mangleUnclassifiedTraffic();
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
        
        
    }).then(()=>{
        logger.info('Web surfing mangled');
    })
    .catch((error) => {
        logger.error('Failed to mangle web surfing');
        throw new Error('Failed to mangle web surfing');
    });
}

async function mangleEmails() {
    return apiClient.write('/ip/firewall/mangle/add', [
        '=action=mark-connection',
        '=chain=prerouting',
        '=dst-port=25,587,465,110,995,143,993',
        '=new-connection-mark=email',
        '=passthrough=yes',
        '=protocol=tcp',
    ]).then(() => {
        return apiClient.write('/ip/firewall/mangle/add', [
            '=action=mark-packet',
            '=chain=prerouting',
            '=dst-port=53',
            '=new-connection-mark=email',
            '=passthrough=no',
            '=protocol=udp',
        ]);
    }).then(() => {
        return apiClient.write('/ip/firewall/mangle/add', [
            '=action=mark-packet',
            '=chain=prerouting',
            '=connection-mark=email',
            '=new-packet-mark=email-packet',
            '=passthrough=no',
        ]);
        
    }).then(()=>{
        logger.info('Emails mangled');
    })
    .catch((error) => {
        logger.error('Failed to mangle emails');
        throw new Error('Failed to mangle emails'); 
    });
}


async function mangleAllVideoCalls() {
    return apiClient.write('/ip/firewall/mangle/add', [
        '=action=mark-connection',
        '=chain=prerouting',
        '=dst-port=80,443,8801,8802,50000-50059',
        '=new-connection-mark=video-calls',
        '=passthrough=yes',
        '=protocol=tcp',
    ]).then(() => {
        return apiClient.write('/ip/firewall/mangle/add', [
            '=action=mark-connection',
            '=chain=prerouting',
            '=dst-port=19302-19309,3478-3481,8801-8810,50000-50059',
            '=new-connection-mark=video-calls',
            '=passthrough=yes',
            '=protocol=udp',
        ]);
    }).then(() => {
        return apiClient.write('/ip/firewall/mangle/add', [
            '=action=mark-packet',
            '=chain=prerouting',
            '=connection-mark=video-calls',
            '=new-packet-mark=video-calls-packet',
            '=passthrough=no',
        ]);
        
    }).then(()=>{
        logger.info('Video calls mangled');
    })
    .catch((error) => {
        logger.error('Failed to mangle video calls');
        throw new Error('Failed to mangle video calls');
    });
}

async function mangleGaming() {
    let promises = [];
    for(let i = 0; i < gamingPorts.length; i++){
        const gamingPort = gamingPorts[i];
        promises.push(
            apiClient.write('/ip/firewall/mangle/add', [
                '=action=mark-connection',
                '=chain=prerouting',
                `=dst-port=${gamingPort.ports}`,
                '=new-connection-mark=gaming',
                '=passthrough=yes',
                `=protocol=${gamingPort.protocol}`,
            ])
        );
    }
    Promise.all(promises)
    .then(() => {
        logger.info('Gaming ports mangled');
        return apiClient.write('/ip/firewall/mangle/add', [
            '=action=mark-packet',
            '=chain=prerouting',
            '=connection-mark=gaming',
            '=new-packet-mark=gaming-packet',
            '=passthrough=no',
        ]).then(() => {
                logger.info('Gaming packets mangled');
            });
    })
    .catch((error) => {
        logger.error('Failed to mangle gaming ports ' + error);
        throw new Error('Failed to mangle gaming ports');
    });
}

async function mangleSocialMedia() {
    const socialMediaContents = [
                                 {name: 'facebook', content: ['facebook.com', 'fbcdn.net']},
                                 {name: 'instagram', content: ['instagram.com']},
                                 {name: 'twitter', content: ['twitter.com']},
                                 {name: 'linkedin', content: ['linkedin.com']},
                                 {name: 'whatsapp', content: ['whatsapp.com', 'whatsapp.net', 'wa.me']},
                                 {name: 'tiktok', content: ['tiktok.com']},
                                ];
    let promises = [];
    createAddressLists(socialMediaContents);
    for(let i = 0; i < socialMediaContents.length; i++){
        const socialMediaContent = socialMediaContents[i];
        promises.push(
            apiClient.write('/ip/firewall/mangle/add', [
                '=action=mark-connection',
                '=chain=prerouting',
                `=dst-address-list=social-media`,
                '=new-connection-mark=social-media',
                '=passthrough=yes',
            ])
        );
    }
    Promise.all(promises)
    .then(() => {
        logger.info('Social media mangled');
        return apiClient.write('/ip/firewall/mangle/add', [
            '=action=mark-packet',
            '=chain=prerouting',
            '=connection-mark=social-media',
            '=new-packet-mark=social-media-packet',
            '=passthrough=no',
        ]).then(() => {
                logger.info('Social media packets mangled');
            });
    })
    .catch((error) => {
        logger.error('Failed to mangle social media ' + error);
        throw new Error('Failed to mangle social media');
    });

}

async function createAddressLists(socialMediaContents: any[]) {
    let promises = [];
    for(let i = 0; i < socialMediaContents.length; i++){
        const socialMediaContent = socialMediaContents[i];
        promises.push(
            apiClient.write('/ip/firewall/address-list/add', [
                '=action=add-dst-to-address-list',
                '=address-list=social-media',
                '=chain=foward',
                '=content=' + socialMediaContent.content.join(','),
            ])
        );
    }
    Promise.all(promises)
    .then(() => {
        logger.info('Address lists created');
    })
    .catch((error) => {
        logger.error('Failed to create address lists ' + error);
        throw new Error('Failed to create address lists');
    });
}

async function mangleUnclassifiedTraffic() {
    return apiClient.write('/ip/firewall/mangle/add', [
        '=action=mark-connection',
        '=chain=prerouting',
        '=new-connection-mark=unclassified',
        '=passthrough=yes',
    ]).then(() => {
        return apiClient.write('/ip/firewall/mangle/add', [
            '=action=mark-packet',
            '=chain=prerouting',
            '=connection-mark=unclassified',
            '=new-packet-mark=unclassified-packet',
            '=passthrough=no',
        ]);
    }).then(()=>{
        logger.info('Unclassified traffic mangled');
    })
    .catch((error) => {
        logger.error('Failed to mangle unclassified traffic');
        throw new Error('Failed to mangle unclassified traffic');
    }); 
}

async function createQueueTree(priorities: string[]) {
    let promises = [];

    return apiClient.write('/queue/tree/add', [
        '=name=root',
        '=parent=global',
        '=max-limit=100M',

    ]).then(() => {
        for(let i = 0; i < priorities.length; i++){
            let priority = priorities[i];
            priority += '-packet';
            promises.push( apiClient.write('/queue/tree/add', [
                '=name=root',
                `=packet-marks=${priority}`,
                `=priority=${i + 1}`,
            ])); 
        }

        return Promise.all(promises)
        .then(() => {
            logger.info('Queue tree created');
        });

    }).catch((error) => {
        logger.error('Failed to create queue tree ' + error);
        throw new Error('Failed to create queue tree');
    });
 }

 export default changePriority;






