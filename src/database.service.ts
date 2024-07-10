import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService {
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: '192.168.2.165',
      port: 30105,
      user: 'postgres',
      database: 'keycloak9x',
      password: 'Torus@123',
    });
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    const client = await this.pool.connect();
    try {
      return await client.query(sql, params);
    } finally {
      client.release();
    }
  }
}
