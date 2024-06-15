"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../logger"));
const pg_1 = require("pg");
class DBClient {
    constructor() {
        this.client = new pg_1.Client({
            host: 'localhost',
            user: 'postgres',
            port: 5432,
            password: 'assaf5678',
            database: 'postgres'
        });
        this.createTable();
    }
    async createTable() {
        const createTableQuery = `CREATE TABLE IF NOT EXISTS router_to_priorities(
            router_id SERIAL PRIMARY KEY,
            priorities TEXT[]
        )`;
        try {
            await this.connectToDB();
            logger_1.default.info('creating table router_to_priorities');
            await this.client.query(createTableQuery);
            logger_1.default.info('table router_to_priorities created');
        }
        catch (error) {
            logger_1.default.error(`An error has occurred: ${error}`);
            await this.disconnectFromDB(); // Close the connection  
        }
    }
    async connectToDB() {
        try {
            await this.client.connect();
            logger_1.default.info('Connected to database');
        }
        catch (error) {
            logger_1.default.error(`An error has occurred: ${error}`);
        }
    }
    async disconnectFromDB() {
        try {
            await this.client.end();
            logger_1.default.info('Disconnected from database');
        }
        catch (error) {
            logger_1.default.error(`An error has occurred: ${error}`);
        }
    }
    async updatePriorities(routerId, priorities) {
        const formattedPriorities = priorities.map(priority => `'${priority}'`).join(',');
        const updateQuery = 'UPDATE router_to_priorities SET priorities = ARRAY[$2]::text[] WHERE router_id = $1';
        logger_1.default.info('updating priorities');
        logger_1.default.info('routerId: ' + routerId);
        logger_1.default.info('priorities: ' + priorities);
        try {
            await this.client.query(updateQuery, [routerId, priorities]);
        }
        catch (error) {
            logger_1.default.error(`An error has occurred: ${error}`);
        }
    }
    async selectPriorities(routerId) {
        const selectQuery = `SELECT priorities FROM router_to_priorities WHERE router_id = ${routerId}`;
        logger_1.default.info('selecting priorities');
        try {
            const result = await this.client.query(selectQuery);
            logger_1.default.info('result: ' + result.rows[0]);
            if (result === undefined) {
                return [];
            }
            return result.rows[0].priorities;
        }
        catch (error) {
            logger_1.default.error(`An error has occurred: ${error}`);
        }
    }
    async insertNewRouterId(routerId) {
        const insertQuery = `INSERT INTO router_to_priorities(router_id, priorities) VALUES (${routerId},${[]})`;
        try {
            await this.client.query(insertQuery);
        }
        catch (error) {
            logger_1.default.error(`An error has occurred: ${error}`);
        }
    }
}
const dbClient = new DBClient();
exports.default = dbClient;
