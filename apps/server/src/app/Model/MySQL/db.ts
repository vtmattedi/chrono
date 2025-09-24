
/**
 * @file db.ts
 * @description This file sets up a connection pool to a MySQL database using the mysql2 library.
 * It ensures that environment variables are loaded correctly before establishing the connection.
 * 
 * @module Model/db
 */

import mysql from 'mysql2';
import { assertDotEnv } from '../Asserter';

/**
 * Ensures that the .env file is loaded correctly. If not, it logs an error message and throws an exception.
 * 
 * @throws {Error} If the .env file fails to load.
 */
if (!assertDotEnv()) {
    console.log('failed to load .env.')
    throw new Error('Failed to load .env')
}



/**
 * Logs the database environment variables to the console.
 * 
 * @function logDBVar
 */
const logDBVar = () => {
    console.log('DB_HOST:', process.env.DB_HOST as string);
    console.log('DB_USER:', process.env.DB_USER as string);
    console.log('DB_PWD:', process.env.DB_PWD as string);
    console.log('DB_PORT:', parseInt(process.env.DB_PORT as string));
}


/**
 * Creates a MySQL connection pool using the configuration specified in the environment variables.
 * 
 * @constant {mysql.Pool} db_pool - The MySQL connection pool.
 */
const db_pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
    database: 'magicaldb',
    //You can add the port here if you want to use a different port default is 3306
    //port: parseInt(process.env.DB_PORT as string),


}).promise();

// class DBManager {
//     #db_pool: mysql.Pool;
//     constructor() {
//     }

//     #connect = async () => {
//         this.#db_pool = mysql.createPool({
//             host: process.env.DB_HOST,
//             user: process.env.DB_USER,
//             password: process.env.DB_PWD,
//             database: 'magicaldb',
//         });
//     }
//     async query(query: string, params: any) {
//         return await this.sql(query, params);
//     }

// }

export { db_pool, logDBVar };