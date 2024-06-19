import logger from "../logger";
import { Client } from 'pg';

class DBClient {
    private client: any;

    constructor() {
        this.client = new Client({
            user: 'myuser',         
            host: 'localhost',      
            database: 'mydatabase', 
            password: 'mypassword', 
            port: 5432,             
        });
    }

    public async connectToDB() {
        try {
            await this.client.connect();
            logger.info('Connected to database');
        }
         catch (error) {
            logger.error(`An error has occurred: ${error}`);
        }
    }

    public async disconnectFromDB() {
        try {
            await this.client.end();
            logger.info('Disconnected from database');
        } 
        catch (error) {
            logger.error(`An error has occurred: ${error}`);
        }
    }

    public async insertNewUser(userName: string | string[]){
        const insertQuery = `INSERT INTO router_to_user(user_name) VALUES (${userName})`;
        try{
            await this.client.query(insertQuery); 
        }
        catch(error){
            logger.error(`An error has occurred: ${error}`);
        }
    }

    public async getRouterId(userName: string | string[]){
        const selectQuery = `SELECT router_id FROM router_to_user WHERE user_name = ${userName}`;
        try{
            const result = await this.client.query(selectQuery);
            return result.rows[0].router_id;
        }
        catch(error){
            logger.error(`An error has occurred: ${error}`);
        }
    }

    public async isUserExists(username: string | string[] | undefined) {
        const selectQuery = `SELECT * FROM router_to_user WHERE user_id = ${username}`;
        try {
            const result = await this.client.query(selectQuery);
            return result.rows.length > 0;
        } 
        catch (error) {
            logger.error(`An error has occurred: ${error}`);
        }
    }

    public async updatePriority(routerId: any, serviceName: any, priority: any) {
        const updateQuery = `UPDATE router_to_priorities SET priority = ${priority} WHERE router_id = ${routerId} AND service_name = ${serviceName}`;

        try{
            this.client.query(updateQuery);

        }
        catch(error){
            logger.error(`An error has occurred: ${error}`);
        }
    }

    public async insertNewPriorities(routerId: any, services: any){
        try{
            for(let service of services){
                const insertQuery = `INSERT INTO router_to_priorities(router_id, service_name, priority) VALUES (${routerId}, ${service.serviceName}, ${service.priority})`;
                await this.client.query(insertQuery);
            }
        }
        catch(error){
            logger.error(`An error has occurred: ${error}`);
        }
    }
}

const dbClient = new DBClient();
export default dbClient;