import {
  uuid,
  pgEnum,
  varchar,
  integer,
  pgTable,
  timestamp,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { timestamps } from './common-columns';

export const eventStatusEnum = pgEnum('event_status', [
  'DRAFT',
  'PUBLISHED',
  'CANCELLED',
]);

export const events = pgTable('events', {
  date: timestamp('date').notNull(),
  description: varchar('description'),
  capacity: integer('capacity').notNull(),
  id: uuid('id').defaultRandom().primaryKey(),
  price: integer('price').default(0).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  status: eventStatusEnum('status').default('DRAFT').notNull(),
  organizerId: uuid('organizer_id')
    .references(() => users.id)
    .notNull(),
  ...timestamps(),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
