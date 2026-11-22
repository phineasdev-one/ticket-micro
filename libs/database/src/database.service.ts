import { Pool } from 'pg';
import * as schema from './schema';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private pool: Pool;

  public db: NodePgDatabase<typeof schema>;

  constructor() {
    const connectionString = process.env.DATABASE_URL!;

    this.pool = new Pool({ connectionString });
    this.db = drizzle(this.pool, { schema });

    console.log('Database connected');
  }

  onModuleDestroy() {
    // NOTE: Cleanup logic here
    this.pool.end();
  }

  get schema() {
    return schema;
  }
}
