import apiClient from "./APIClient";
import logger from "../logger";

interface LoginMessage {
    type: "login";
    userName: string;
    password: string;
}

const handleLogin = async (command: LoginMessage)=> {
    const userName = command.userName;
    const password = command.password;
    try{
        const data = await apiClient.write(`/user/print?where=name=${userName}`);
        if(data.length > 0 && data[0].password === password){
            logger.info('user logged in');
        }
        else{
            logger.error('user not found'); 
        } 
    }
    catch(error){
        throw new Error('Failed to login');
    }
}

export default handleLogin;