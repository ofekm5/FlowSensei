"use strict";
// import logger from "../logger";
// import apiClient from "./APIClient";
// interface ChangePriorityMessage {
//     type: "change_priority";
//     priorities: string[];
// }
// const gamingPorts = [
//     { name: 'steam', ports: '27014-27050,3478,4379,4380', protocol: 'udp' },
//     { name: 'steam', ports: '27014-27050,80,443', protocol: 'tcp' },
// ];
// class PriorityModifier {
//     async addMangleRule(priority: string) {
//         try {
//             switch (priority) {
//                 case 'web-surfing':
//                     await this.mangleWebSurfing();
//                     break;
//                 case 'gaming':
//                     await this.mangleGaming();
//                     break;
//                 case 'video-calls':
//                     await this.mangleAllVideoCalls();
//                     break;
//                 case 'email':
//                     await this.mangleEmails();
//                     break;
//                 case 'social-media':
//                     await this.mangleSocialMedia();
//                     break;
//                 case 'unclassified':
//                     await this.mangleUnclassifiedTraffic();
//                     break;
//             }
//         } 
//         catch (error) {
//             throw new Error((error as Error).message);
//         }
//     }
//     async updateQueueTree(priority: string, newPriorityLevel: number) {
//         const packetMark = `${priority}-packet`;
//         const existingQueueTree = await apiClient.write('/queue/tree/print', [
//             `?name=${packetMark}`
//         ]);
//         if (existingQueueTree.length > 0) {
//             // Update the existing queue tree
//             await apiClient.write('/queue/tree/set', [
//                 `=name=${packetMark}`,
//                 `=priority=${newPriorityLevel}`,
//             ]).then(() => {
//                 logger.info(`Queue tree priority updated for ${packetMark}`);
//             }).catch((error) => {
//                 logger.error(`Failed to update queue tree priority for ${packetMark} ` + error);
//                 throw new Error(`Failed to update queue tree priority for ${packetMark}`);
//             });
//         } 
//         else {
//             // Create a new queue tree entry if it doesn't exist
//             await apiClient.write('/queue/tree/add', [
//                 `=name=${packetMark}`,
//                 `=packet-marks=${packetMark}`,
//                 `=priority=${newPriorityLevel}`,
//             ]).then(() => {
//                 logger.info(`Queue tree created for ${packetMark}`);
//             }).catch((error) => {
//                 logger.error(`Failed to create queue tree for ${packetMark} ` + error);
//                 throw new Error(`Failed to create queue tree for ${packetMark}`);
//             });
//         }
//     }
//     async mangleWebSurfing() {
//         await this.addMangleConnectionRule('prerouting', '80,443', 'web-surfing', 'tcp');
//         await this.addMangleConnectionRule('prerouting', '53', 'web-surfing', 'udp');
//         await this.addManglePacketRule('prerouting', 'web-surfing', 'web-surfing-packet');
//         logger.info('Web surfing mangled');
//     }
//     async mangleEmails() {
//         await this.addMangleConnectionRule('prerouting', '25,587,465,110,995,143,993', 'email', 'tcp');
//         await this.addMangleConnectionRule('prerouting', '53', 'email', 'udp');
//         await this.addManglePacketRule('prerouting', 'email', 'email-packet');
//         logger.info('Emails mangled');
//     }
//     async mangleAllVideoCalls() {
//         await this.addMangleConnectionRule('prerouting', '80,443,8801,8802,50000-50059', 'video-calls', 'tcp');
//         await this.addMangleConnectionRule('prerouting', '19302-19309,3478-3481,8801-8810,50000-50059', 'video-calls', 'udp');
//         await this.addManglePacketRule('prerouting', 'video-calls', 'video-calls-packet');
//         logger.info('Video calls mangled');
//     }
//     async mangleGaming() {
//         let promises = [];
//         for (let i = 0; i < gamingPorts.length; i++) {
//             const gamingPort = gamingPorts[i];
//             promises.push(this.addMangleConnectionRule('prerouting', gamingPort.ports, 'gaming', gamingPort.protocol));
//         }
//         await Promise.all(promises);
//         await this.addManglePacketRule('prerouting', 'gaming', 'gaming-packet');
//         logger.info('Gaming ports mangled');
//     }
//     async mangleSocialMedia() {
//         const socialMediaContents = [
//             { name: 'facebook', content: ['facebook.com', 'fbcdn.net'] },
//             { name: 'instagram', content: ['instagram.com'] },
//             { name: 'twitter', content: ['twitter.com'] },
//             { name: 'linkedin', content: ['linkedin.com'] },
//             { name: 'whatsapp', content: ['whatsapp.com', 'whatsapp.net', 'wa.me'] },
//             { name: 'tiktok', content: ['tiktok.com'] },
//         ];
//         await this.createAddressLists(socialMediaContents);
//         await this.addMangleConnectionRule('prerouting', null, 'social-media', null, 'social-media');
//         await this.addManglePacketRule('prerouting', 'social-media', 'social-media-packet');
//         logger.info('Social media mangled');
//     }
//     async mangleUnclassifiedTraffic() {
//         await this.addMangleConnectionRule('prerouting', null, 'unclassified', null);
//         await this.addManglePacketRule('prerouting', 'unclassified', 'unclassified-packet');
//         logger.info('Unclassified traffic mangled');
//     }
// }
// export default RouterClient;
