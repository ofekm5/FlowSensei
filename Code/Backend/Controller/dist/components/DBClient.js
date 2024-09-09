"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../logger"));
const pg_1 = require("pg");
class DBClient {
    constructor() {
        this.client = null;
    }
    async connectToDB(dbURL) {
        this.client = new pg_1.Client({ connectionString: dbURL });
        try {
            await this.client.connect();
            logger_1.default.info('Connected to database');
        }
        catch (error) {
            logger_1.default.error(`An error has occurred: ${error}`);
            throw error;
        }
    }
    async disconnectFromDB() {
        if (!this.client) {
            return;
        }
        try {
            await this.client.end();
            logger_1.default.info('Disconnected from database');
        }
        catch (error) {
            logger_1.default.error(`An error has occurred: ${error}`);
            throw error;
        }
    }
    // Create tables
    async createTables() {
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
                service_name VARCHAR(50) NOT NULL,
                protocol VARCHAR(10) NOT NULL,
                dst_port VARCHAR(10) NOT NULL,
                src_port VARCHAR(10),
                src_address VARCHAR(50),
                dst_address VARCHAR(50)
            );
            `;
        const serviceToPriorityTableQuery = `CREATE TABLE IF NOT EXISTS service_to_priority (
            router_id UUID,
            service_id UUID,
            priority INTEGER NOT NULL,
            PRIMARY KEY(router_id, service_id),
            FOREIGN KEY (router_id) REFERENCES routers(router_id),
            FOREIGN KEY (service_id) REFERENCES services(service_id)
            )`;
        return new Promise((resolve, reject) => {
            this.client.query(uuidExtensionQuery, (error) => {
                if (error) {
                    logger_1.default.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                this.client.query(routerTableQuery, (error) => {
                    if (error) {
                        logger_1.default.error(`An error has occurred: ${error}`);
                        reject(error);
                    }
                    this.client.query(servicesTableQuery, (error) => {
                        if (error) {
                            logger_1.default.error(`An error has occurred: ${error}`);
                            reject(error);
                        }
                        this.client.query(serviceToPriorityTableQuery, (error) => {
                            if (error) {
                                logger_1.default.error(`An error has occurred: ${error}`);
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
    async insertRouter(publicIp) {
        if (!this.client) {
            return;
        }
        return new Promise((resolve, reject) => {
            const insertQuery = `INSERT INTO routers(public_ip) VALUES ($1)`;
            this.client.query(insertQuery, [publicIp], (error) => {
                if (error) {
                    logger_1.default.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                resolve();
            });
        });
    }
    async deleteRouter(publicIp) {
        if (!this.client) {
            return;
        }
        return new Promise((resolve, reject) => {
            const deleteQuery = `DELETE FROM routers WHERE public_ip = $1`;
            this.client.query(deleteQuery, [publicIp], (error) => {
                if (error) {
                    logger_1.default.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                resolve();
            });
        });
    }
    async getRouter(publicIp) {
        if (!this.client) {
            return null;
        }
        return new Promise((resolve, reject) => {
            const selectQuery = `SELECT * FROM routers WHERE public_ip = $1`;
            this.client.query(selectQuery, [publicIp], (error, result) => {
                if (error) {
                    logger_1.default.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                if (result.rows.length === 0) {
                    resolve(null);
                }
                else {
                    resolve(result.rows[0]);
                }
            });
        });
    }
    // Service Operations
    async insertService(serviceID, serviceName, protocol, dstPort, srcPort, srcAddress, dstAddress) {
        if (!this.client) {
            throw new Error("Database client is not connected");
        }
        const insertQuery = `INSERT INTO services(service_id, service_name, protocol, dst_port, src_port, src_address, dst_address) 
                             VALUES ($1, $2, $3, $4, $5, $6, $7)`;
        const params = [
            serviceID,
            serviceName,
            protocol,
            dstPort,
            srcPort !== null && srcPort !== void 0 ? srcPort : null, // Default to NULL if undefined
            srcAddress !== null && srcAddress !== void 0 ? srcAddress : null, // Default to NULL if undefined
            dstAddress !== null && dstAddress !== void 0 ? dstAddress : null // Default to NULL if undefined
        ];
        await this.client.query(insertQuery, params);
    }
    async deleteService(serviceID) {
        if (!this.client) {
            return;
        }
        return new Promise((resolve, reject) => {
            const deleteQuery = `DELETE FROM services WHERE service_id = $1`;
            this.client.query(deleteQuery, [serviceID], (error) => {
                if (error) {
                    logger_1.default.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                resolve();
            });
        });
    }
    async getService(serviceName) {
        if (!this.client) {
            return null;
        }
        return new Promise((resolve, reject) => {
            const selectQuery = `SELECT * FROM services WHERE service_name = $1`;
            this.client.query(selectQuery, [serviceName], (error, result) => {
                if (error) {
                    logger_1.default.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                if (result.rows.length === 0) {
                    resolve(null);
                }
                else {
                    resolve(result.rows[0]);
                }
            });
        });
    }
    // Service to Priority Operations
    async insertServicePriority(routerId, serviceId, priority) {
        if (!this.client) {
            return;
        }
        return new Promise((resolve, reject) => {
            const insertQuery = `INSERT INTO service_to_priority(router_id, service_id, priority) VALUES ($1, $2, $3)`;
            this.client.query(insertQuery, [routerId, serviceId, priority], (error) => {
                if (error) {
                    logger_1.default.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                resolve();
            });
        });
    }
    async updatePriority(routerId, serviceId, priority) {
        if (!this.client) {
            return;
        }
        return new Promise((resolve, reject) => {
            const updateQuery = `UPDATE service_to_priority SET priority = $1 WHERE router_id = $2 AND service_id = $3`;
            this.client.query(updateQuery, [priority, routerId, serviceId], (error) => {
                if (error) {
                    logger_1.default.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                resolve();
            });
        });
    }
    async getMinPriority(routerId) {
        if (!this.client) {
            return null;
        }
        return new Promise((resolve, reject) => {
            const query = `SELECT MIN(priority) as priority FROM service_to_priority WHERE router_id = $1`;
            this.client.query(query, [routerId], (error, result) => {
                if (error) {
                    logger_1.default.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                if (result.rows.length === 0 || !result.rows[0].priority) {
                    resolve(null);
                }
                else {
                    resolve(result.rows[0]);
                }
            });
        });
    }
    async deleteServicePriority(routerId, serviceId) {
        if (!this.client) {
            return;
        }
        return new Promise((resolve, reject) => {
            const deleteQuery = `DELETE FROM service_to_priority WHERE router_id = $1 AND service_id = $2`;
            this.client.query(deleteQuery, [routerId, serviceId], (error) => {
                if (error) {
                    logger_1.default.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                resolve();
            });
        });
    }
    async getServices(routerId) {
        if (!this.client) {
            return [];
        }
        return new Promise((resolve, reject) => {
            const selectQuery = `
                SELECT s.service_name, stp.priority
                FROM service_to_priority stp
                JOIN services s ON stp.service_id = s.service_id
                WHERE stp.router_id = $1
            `;
            this.client.query(selectQuery, [routerId], (error, result) => {
                if (error) {
                    logger_1.default.error(`An error has occurred: ${error}`);
                    reject(error);
                }
                resolve(result.rows);
            });
        });
    }
}
const dbClient = new DBClient();
exports.default = dbClient;
