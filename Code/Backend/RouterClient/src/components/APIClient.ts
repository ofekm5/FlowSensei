import { RouterOSAPI } from 'node-routeros';
//import { connect } from 'http2';

const apiClient = new RouterOSAPI({
    host: '192.168.88.1',
    user: process.env.ROUTER_USER,
    password: process.env.ROUTER_PASSWORD,
});

// const cert = fs.readFileSync('./RouterClient/SSL/FlowSensei.crt');
// const key = fs.readFileSync('./RouterClient/SSL/FlowSensei.key');
// const passphrase = 'my-secure-passphrase';
// const agent = new https.Agent({
//     cert: cert,
//     key: key,
//     passphrase: passphrase, // Add this line if your key is passphrase-protected
//     rejectUnauthorized: false // Set this to true if you trust the RouterOS certificate
// });


export default apiClient;