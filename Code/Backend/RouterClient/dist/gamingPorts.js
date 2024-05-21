"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gamingPorts = [
    { name: 'steam', ports: '27014-27050,3478,4379,4380', protocol: 'udp' },
    { name: 'steam', ports: '27014-27050,80,443', protocol: 'tcp' },
];
exports.default = gamingPorts;
