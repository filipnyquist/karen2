import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "unverified",
  "user",
  "admin",
  "superadmin",
]);

export type UserRole = "unverified" | "user" | "admin" | "superadmin";

export const educationTypeEnum = pgEnum("education_type", [
  "pub_worker",
  "aas",
  "responsible",
]);

export const eventTypeEnum = pgEnum("event_type", ["event", "private_event"]);

export const eventStatusEnum = pgEnum("event_status", [
  "open",
  "canceled",
  "booked",
]);

// Users table
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    emailVerificationToken: varchar("email_verification_token", {
      length: 255,
    }),
    name: varchar("name", { length: 255 }).notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    role: userRoleEnum("role").default("unverified").notNull(),
    profilePicture: varchar("profile_picture", { length: 255 }),
    deactivated: boolean("deactivated").default(false).notNull(),
    passwordResetToken: varchar("password_reset_token", { length: 255 }),
    passwordResetExpires: timestamp("password_reset_expires", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  })
);

// User educations
export const userEducations = pgTable(
  "user_educations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    educationType: educationTypeEnum("education_type").notNull(),
    assignedBy: uuid("assigned_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userEducationIdx: uniqueIndex("user_education_idx").on(
      table.userId,
      table.educationType
    ),
  })
);

// Locations
export const locations = pgTable("locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  address: varchar("address", { length: 500 }),
  capacity: integer("capacity"),
  picture: varchar("picture", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Events
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: eventTypeEnum("type").default("event").notNull(),
  notice: text("notice"),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  status: eventStatusEnum("status").default("open").notNull(),
  minResponsible: integer("min_responsible").default(1).notNull(),
  maxResponsible: integer("max_responsible").default(2).notNull(),
  minWorkers: integer("min_workers").default(2).notNull(),
  maxWorkers: integer("max_workers").default(10).notNull(),
  maxGuests: integer("max_guests").default(0).notNull(),
  maxGuestsPerPerson: integer("max_guests_per_person"),
  givesPoints: boolean("gives_points").default(true).notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Event workers (signup)
export const eventWorkers = pgTable(
  "event_workers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    isResponsible: boolean("is_responsible").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    eventUserIdx: uniqueIndex("event_user_idx").on(table.eventId, table.userId),
  })
);

// Guest lists
export const guestLists = pgTable("guest_lists", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  signedUpBy: uuid("signed_up_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  guestName: varchar("guest_name", { length: 255 }).notNull(),
  guestEmail: varchar("guest_email", { length: 255 }),
  guestSsn: varchar("guest_ssn", { length: 20 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Event comments
export const eventComments = pgTable("event_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Event reports (notes for admins/responsible)
export const eventReports = pgTable("event_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  whoWorked: text("who_worked"),
  summary: text("summary"),
  finances: text("finances"),
  other: text("other"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Skip queue tickets
export const skipQueueTickets = pgTable("skip_queue_tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  qrCodeData: varchar("qr_code_data", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
  redeemedAtEventId: uuid("redeemed_at_event_id").references(
    () => events.id,
    { onDelete: "set null" }
  ),
  givenBy: uuid("given_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

// Front page notice
export const frontPageNotices = pgTable("front_page_notices", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  educations: many(userEducations),
  eventWorkers: many(eventWorkers),
  guestSignups: many(guestLists),
  comments: many(eventComments),
  reports: many(eventReports),
  ticketsReceived: many(skipQueueTickets),
  ticketsGiven: many(skipQueueTickets),
}));

export const userEducationsRelations = relations(userEducations, ({ one }) => ({
  user: one(users, {
    fields: [userEducations.userId],
    references: [users.id],
  }),
  assignedByUser: one(users, {
    fields: [userEducations.assignedBy],
    references: [users.id],
  }),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  location: one(locations, {
    fields: [events.locationId],
    references: [locations.id],
  }),
  createdByUser: one(users, {
    fields: [events.createdBy],
    references: [users.id],
  }),
  workers: many(eventWorkers),
  guests: many(guestLists),
  comments: many(eventComments),
  report: many(eventReports),
  ticketsCreated: many(skipQueueTickets),
}));

export const eventWorkersRelations = relations(eventWorkers, ({ one }) => ({
  event: one(events, {
    fields: [eventWorkers.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventWorkers.userId],
    references: [users.id],
  }),
}));

export const guestListsRelations = relations(guestLists, ({ one }) => ({
  event: one(events, {
    fields: [guestLists.eventId],
    references: [events.id],
  }),
  signedUpByUser: one(users, {
    fields: [guestLists.signedUpBy],
    references: [users.id],
  }),
}));

export const eventCommentsRelations = relations(eventComments, ({ one }) => ({
  event: one(events, {
    fields: [eventComments.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventComments.userId],
    references: [users.id],
  }),
}));

export const eventReportsRelations = relations(eventReports, ({ one }) => ({
  event: one(events, {
    fields: [eventReports.eventId],
    references: [events.id],
  }),
  createdByUser: one(users, {
    fields: [eventReports.createdBy],
    references: [users.id],
  }),
}));

export const skipQueueTicketsRelations = relations(
  skipQueueTickets,
  ({ one }) => ({
    user: one(users, {
      fields: [skipQueueTickets.userId],
      references: [users.id],
    }),
    event: one(events, {
      fields: [skipQueueTickets.eventId],
      references: [events.id],
    }),
    redeemedAtEvent: one(events, {
      fields: [skipQueueTickets.redeemedAtEventId],
      references: [events.id],
    }),
    givenByUser: one(users, {
      fields: [skipQueueTickets.givenBy],
      references: [users.id],
    }),
  })
);
