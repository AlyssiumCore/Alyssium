// db-client.ts
// Database client setup for Alyssium Core

import { Pool, PoolConfig, QueryResult } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

const poolConfig: PoolConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  max: 10,           // maximum number of connections in the pool
  idleTimeoutMillis: 30000, // close idle clients after 30 seconds
  connectionTimeoutMillis: 2000 // return an error after 2 seconds if connection could not be established
}

export class DBClient {
  private pool: Pool

  constructor(config?: PoolConfig) {
    this.pool = new Pool(config ?? poolConfig)
  }

  /**
   * Execute a SQL query with parameters
   * @param text SQL query text
   * @param params Query parameters
   */
  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const client = await this.pool.connect()
    try {
      return await client.query<T>(text, params)
    } catch (error) {
      console.error('Database query error', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Gracefully shut down the pool
   */
  async close(): Promise<void> {
    await this.pool.end()
  }
}

// Example usage:
// const db = new DBClient()
// const res = await db.query('SELECT * FROM tokens WHERE id = $1', [tokenId])
// console.log(res.rows)
