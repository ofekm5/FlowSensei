import logger from "../logger";
import { Client } from 'pg';

class DBClient {
    private client: any;

    constructor() {
        this.client = new Client({
            host: 'localhost',
            user: 'postgres',
            port: 5432,
            password: 'assaf5678',
            database: 'postgres'
        });
        this.createTableRouterToPriorities();
        this.createTableRouterToUser();
    }
    private async createTableRouterToUser() {
        const createTableQuery = `CREATE TABLE IF NOT EXISTS router_to_user
                                  (router_id SERIAL PRIMARY KEY,
                                   user_id SERIAL,
                                   user_name TEXT,)`;
        try {
            logger.info('creating table router_to_user');
            await this.client.query(createTableQuery);
            logger.info('table router_to_user created');
        }
        catch (error) {
            logger.error(`An error has occurred: ${error}`);
            await this.disconnectFromDB(); // Close the connection  
        }
    }

    private async createTableRouterToPriorities(){
            const createTableQuery = `CREATE TABLE IF NOT EXISTS router_to_priorities
                                      (router_id SERIAL PRIMARY KEY,
                                       service_name TEXT,
                                       priority numeric)`;
       
        try {
            await this.connectToDB();
            logger.info('creating table router_to_priorities');
            await this.client.query(createTableQuery);
            logger.info('table router_to_priorities created');
        } 
        catch (error) {
            logger.error(`An error has occurred: ${error}`);
            await this.disconnectFromDB(); // Close the connection  
        } 
        
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