import { pgTable, uuid, varchar, pgEnum } from 'drizzle-orm/pg-core';
import { timestamps } from './common-columns';

// NOTE: enum for users table
export const roleEnum = pgEnum('role', ['USER', 'ORGANTZER', 'ADMIN']);

// NOTE: users tables
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: roleEnum('role').default('USER').notNull(),
  ...timestamps(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
