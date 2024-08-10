import logger from "../logger";
import { Client } from 'pg';

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
        return new Promise<void>((resolve, reject) => {
            this.client.connect((error) => {
                if (error) {
                    logger.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                logger.info('Connected to database');
                resolve();
            });
        });
    }

    public async disconnectFromDB() {
        return new Promise<void>((resolve, reject) => {
            this.client.end((error) => {
                if (error) {
                    logger.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                logger.info('Disconnected from database');
                resolve();
            });
        });
    }

    public async createTables() {
        const uuidExtensionQuery = `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
        
        const routerTableQuery = `CREATE TABLE IF NOT EXISTS routers (
            router_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            public_ip VARCHAR(50) NOT NULL
            )`;

        const servicesTableQuery = `CREATE TABLE IF NOT EXISTS services (
        service_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        service_name VARCHAR(50) NOT NULL
        )`;

        const serviceToPriorityTableQuery = `CREATE TABLE IF NOT EXISTS service_to_priority (
            router_id UUID,
            service_id UUID,
            priority INTEGER NOT NULL,
            PRIMARY KEY(router_id, service_id),
            FOREIGN KEY (router_id) REFERENCES routers(router_id),
            FOREIGN KEY (service_id) REFERENCES services(service_id)
            )`;

        return new Promise<void>((resolve, reject) => {
            this.client.query(uuidExtensionQuery, (error) => {
                if (error) {
                    logger.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                this.client.query(routerTableQuery, (error) => {
                    if (error) {
                        logger.error(`An error has occurred: ${error}`);
                        reject(error);
                    }
                    this.client.query(servicesTableQuery, (error) => {
                        if (error) {
                            logger.error(`An error has occurred: ${error}`);
                            reject(error);
                        }
                        this.client.query(serviceToPriorityTableQuery, (error) => {
                            if (error) {
                                logger.error(`An error has occurred: ${error}`);
                                reject(error);
                            }
                            resolve();
                        });
                    });
                });
            });
        }); 
    }


    public async insertNewUser(publicIp: string){
        return new Promise((resolve, reject) => {
            const insertQuery = `INSERT INTO routers(public_ip) VALUES ($1)`;
            this.client.query(insertQuery, [publicIp], (error, result) => {
                if (error) {
                    logger.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                resolve(result);
            });
        });

    }

    public async isUserExists(publicIp: string) {
        const selectQuery = `SELECT 1 FROM routers WHERE public_ip = $1`;
        return new Promise((resolve, reject) => {
            this.client.query(selectQuery, [publicIp], (err, result) => {
                if (err) {
                    logger.error(`An error has occurred: ${err}`);
                    reject(err);
                } else {
                    resolve(result.rows.length > 0);
                }
            });
        });
    }

    public async deleteUser(userName: string | string[]) {
        return new Promise((resolve, reject) => {
            const deleteQuery = `DELETE FROM routers WHERE public_ip = $1`;
            this.client.query(deleteQuery, [userName], (error, result) => {
                if (error) {
                    logger.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                resolve(result);
            });
        });
        
    }

    public async updatePriority(routerId: string, serviceName: string, priority: number) {
        return new Promise((resolve, reject) => {
            const updateQuery = `UPDATE service_to_priority SET priority = $1 WHERE router_id = $2 AND service_id = $3`;
            this.client.query(updateQuery, [priority, routerId, serviceName], (error, result) => {
                if (error) {
                    logger.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                resolve(result);
            });
        });
    }

    public async insertNewPriorities(routerId: string, services: {serviceName: string, priority: number}[]) {
        return new Promise((resolve, reject) => {
            for (let service of services) {
                const insertQuery = `INSERT INTO service_to_priority(router_id, service_id, priority) VALUES ($1, $2, $3)`;
                this.client.query(insertQuery, [routerId, service.serviceName, service.priority], (error, result) => {
                    if (error) {
                        logger.error(`An error has occurred: ${error}`);
                        reject(error);
                    }
                    resolve(result);
                });
            }
        });
    }

    public async getServiceIdByName(serviceId: string) {
        return new Promise((resolve, reject) => {
            const selectQuery = `SELECT service_id FROM services WHERE service_name = $1`;
            this.client.query(selectQuery, [serviceId], (error, result) => {
                if (error) {
                    logger.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                resolve(result.rows[0]?.service_id);
            });
        });
    }

    public async getRouterByPublicIp(public_ip: string) {
        return new Promise((resolve, reject) => {
            const selectQuery = `SELECT router_id FROM routers WHERE public_ip = $1`;
            this.client.query(selectQuery, [public_ip], (error, result) => {
                if (error) {
                    logger.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                resolve(result.rows[0].router_id);
            });
        });
    }
}

const dbClient = new DBClient();
export default dbClient;
