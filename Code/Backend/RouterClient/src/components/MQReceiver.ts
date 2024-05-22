import amqp from 'amqplib';
import apiClient from './APIClient';
import handleLogin from './Login';
import checkFirewall from './FirewallChecker';
import changePriority from './PriorityModifier';
import transporter from './TransportMonitor';

const consumeMessages = async () => {
    try{
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();

        await channel.assertQueue('requests_queue', { durable: false });
        console.log('Waiting for messages in the requests_queue');
        channel.consume('requests_queue', async (message)=>{
            await apiClient.connect();
            if(message !== null){
                const command = JSON.parse(message.content.toString());
                const content = message.toString();
                console.log(`Received message: ${content}`);

                //proccess the message according to the content
                switch(command.type){
                    //login to the router
                    case 'login':
                        console.log('Logging in');
                        handleLogin(command);
                        break;
                    //change priority
                    case 'change_priority':
                        console.log('Changing priority');
                        changePriority(command);
                        break;
                    //fetch bandwidth data
                    case 'change_interval':
                        console.log('changing interval');
                        transporter.changeInterval(command);
                        break;
                    //check firewwall
                    case 'check_firewall':
                        console.log('checking firewall');
                        checkFirewall(command);
                        break;
                }
                channel.ack(message);
            }
            
        })
    }
    catch(error){
        console.log(error)
        console.error('An error has occured', error);
    }
    finally{
        await apiClient.close();
    }
}

export default consumeMessages;
