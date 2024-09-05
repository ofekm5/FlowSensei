import logger from "../logger";
import { Client } from 'pg';

class DBClient {
    private client: Client | null = null;

    public async connectToDB(dbURL: string) {
        this.client = new Client({
            connectionString: dbURL
        });

        return new Promise<void>((resolve, reject) => {
            this.client?.connect((error) => {
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
        if (!this.client) {
            return;
        }
        return new Promise<void>((resolve, reject) => {
            this.client!.end((error) => {
                if (error) {
                    logger.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                logger.info('Disconnected from database');
                resolve();
            });
        });
    }

    // Create tables
    public async createTables() {
        if (!this.client) {
            return;
        }
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
            this.client!.query(uuidExtensionQuery, (error) => {
                if (error) {
                    logger.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                this.client!.query(routerTableQuery, (error) => {
                    if (error) {
                        logger.error(`An error has occurred: ${error}`);
                        reject(error);
                    }
                    this.client!.query(servicesTableQuery, (error) => {
                        if (error) {
                            logger.error(`An error has occurred: ${error}`);
                            reject(error);
                        }
                        this.client!.query(serviceToPriorityTableQuery, (error) => {
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

    // Router Operations
    public async insertRouter(publicIp: string) {
        if (!this.client) {
            return;
        }

        return new Promise((resolve, reject) => {
            const insertQuery = `INSERT INTO routers(public_ip) VALUES ($1)`;
            this.client!.query(insertQuery, [publicIp], (error, result) => {
                if (error) {
                    logger.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                resolve(result);
            });
        });
    }

    public async deleteRouter(publicIp: string) {
        if (!this.client) {
            return;
        }
        
        return new Promise((resolve, reject) => {
            const deleteQuery = `DELETE FROM routers WHERE public_ip = $1`;
            this.client!.query(deleteQuery, [publicIp], (error, result) => {
                if (error) {
                    logger.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                resolve(result);
            });
        });
    }

    public async getRouter(publicIp: string) {
        if (!this.client) {
            return;
        }

        return new Promise((resolve, reject) => {
            const selectQuery = `SELECT * FROM routers WHERE public_ip = $1`;
            this.client!.query(selectQuery, [publicIp], (error, result) => {
                if (error) {
                    logger.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                resolve(result.rows);
            });
        });
    }

    // Service Operations
    public async insertService(serviceName: string) {
        if (!this.client) {
            return;
        }

        return new Promise((resolve, reject) => {
            const insertQuery = `INSERT INTO services(service_name) VALUES ($1)`;
            this.client!.query(insertQuery, [serviceName], (error, result) => {
                if (error) {
                    logger.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                resolve(result);
            });
        });
    }

    public async deleteService(serviceName: string) {
        if (!this.client) {
            return;
        }

        return new Promise((resolve, reject) => {
            const deleteQuery = `DELETE FROM services WHERE service_name = $1`;
            this.client!.query(deleteQuery, [serviceName], (error, result) => {
                if (error) {
                    logger.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                resolve(result);
            });
        });
    }

    public async getService(serviceName: string) {
        if (!this.client) {
            return;
        }

        return new Promise((resolve, reject) => {
            const selectQuery = `SELECT * FROM services WHERE service_name = $1`;
            this.client!.query(selectQuery, [serviceName], (error, result) => {
                if (error) {
                    logger.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                resolve(result.rows);
            });
        });
    }

    // Service to Priority Operations
    public async insertServicePriority(routerId: string, serviceId: string, priority: number) {
        if (!this.client) {
            return;
        }

        return new Promise((resolve, reject) => {
            const insertQuery = `INSERT INTO service_to_priority(router_id, service_id, priority) VALUES ($1, $2, $3)`;
            this.client!.query(insertQuery, [routerId, serviceId, priority], (error, result) => {
                if (error) {
                    logger.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                resolve(result);
            });
        });
    }

    public async deleteServicePriority(routerId: string, serviceId: string) {
        if (!this.client) {
            return;
        }

        return new Promise((resolve, reject) => {
            const deleteQuery = `DELETE FROM service_to_priority WHERE router_id = $1 AND service_id = $2`;
            this.client!.query(deleteQuery, [routerId, serviceId], (error, result) => {
                if (error) {
                    logger.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                resolve(result);
            });
        });
    }

    public async getRouterServices(routerId: string) {
        if (!this.client) {
            return;
        }
    
        return new Promise((resolve, reject) => {
            const selectQuery = `
                SELECT s.service_name, stp.priority
                FROM service_to_priority stp
                JOIN services s ON stp.service_id = s.service_id
                WHERE stp.router_id = $1
            `;
            this.client!.query(selectQuery, [routerId], (error, result) => {
                if (error) {
                    logger.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                resolve(result.rows);
            });
        });
    }
}

const dbClient = new DBClient();
export default dbClient;
