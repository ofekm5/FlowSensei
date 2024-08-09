import logger from "../logger";
import { Client } from 'pg';

// -- Enable the uuid-ossp extension to use the uuid_generate_v4() function
// CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

// -- Create the router_to_priorities table with UUID primary key
// CREATE TABLE IF NOT EXISTS "router_to_priorities" (
//     "router_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
//     "service_name" VARCHAR(50) NOT NULL,
//     "priority" INTEGER NOT NULL
// );

// -- Create the router_to_user table with router_id as a foreign key
// CREATE TABLE IF NOT EXISTS "router_to_user" (
//     "router_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
//     "user_name" VARCHAR(50) NOT NULL,
//     CONSTRAINT fk_router
//       FOREIGN KEY ("router_id")
//       REFERENCES "router_to_priorities" ("router_id")
// );


class DBClient {
    private client: Client;

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
        const insertQuery = `INSERT INTO router_to_user(user_name) VALUES ($1)`;
        try {
            await this.client.query(insertQuery, [userName]);
        }
        catch (error) {
            logger.error(`An error has occurred: ${error}`);
        }
    }

    public async getRouterId(userName: string | string[]){
        const selectQuery = `SELECT router_id FROM router_to_user WHERE user_name = $1`;
        try {
            const result = await this.client.query(selectQuery, [userName]);
            return result.rows[0]?.router_id;
        }
        catch (error) {
            logger.error(`An error has occurred: ${error}`);
        }
    }

    public async isUserExists(userName: string | string[]) {
        const selectQuery = `SELECT 1 FROM router_to_user WHERE user_name = $1`;
        try {
            const result = await this.client.query(selectQuery, [userName]);
            return result.rows.length > 0;
        } 
        catch (error) {
            logger.error(`An error has occurred: ${error}`);
        }
    }

    public async deleteUser(userName: string | string[]) {
        const deleteQuery = `DELETE FROM router_to_user WHERE user_name = $1`;
        try {
            await this.client.query(deleteQuery, [userName]);
            logger.info(`User ${userName} deleted successfully`);
        }
        catch (error) {
            logger.error(`An error has occurred: ${error}`);
        }
    }

    public async updatePriority(routerId: string, serviceName: string, priority: number) {
        const updateQuery = `UPDATE router_to_priorities SET priority = $1 WHERE router_id = $2 AND service_name = $3`;
        try {
            await this.client.query(updateQuery, [priority, routerId, serviceName]);
        }
        catch (error) {
            logger.error(`An error has occurred: ${error}`);
        }
    }

    public async insertNewPriorities(routerId: string, services: {serviceName: string, priority: number}[]) {
        try {
            for (let service of services) {
                const insertQuery = `INSERT INTO router_to_priorities(router_id, service_name, priority) VALUES ($1, $2, $3)`;
                await this.client.query(insertQuery, [routerId, service.serviceName, service.priority]);
            }
        }
        catch (error) {
            logger.error(`An error has occurred: ${error}`);
        }
    }
}

const dbClient = new DBClient();
export default dbClient;
