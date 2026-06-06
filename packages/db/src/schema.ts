import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  jsonb,
  date,
  time,
  index,
  unique,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ============ MULTI-TENANCY ============

export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'hair_salon', 'barbershop', 'spa', etc.
  logoUrl: text("logo_url"),
  coverImageUrl: text("cover_image_url"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city").notNull(),
  canton: text("canton").notNull(), // 'ZH', 'BE', 'GE', etc.
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull().default("CH"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  timezone: text("timezone").notNull().default("Europe/Zurich"),
  currency: text("currency").notNull().default("CHF"),
  defaultLocale: text("default_locale").notNull().default("de"), // 'de', 'fr', 'it', 'en'
  subscriptionPlan: text("subscription_plan").default("free"), // 'free', 'professional', 'premium'
  stripeAccountId: text("stripe_account_id"),
  twintMerchantId: text("twint_merchant_id"),
  isVerified: boolean("is_verified").default(false),
  isPublished: boolean("is_published").default(false),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const businessHours = pgTable("business_hours", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .references(() => businesses.id, { onDelete: "cascade" })
    .notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Monday, 6=Sunday
  openTime: time("open_time"),
  closeTime: time("close_time"),
  isClosed: boolean("is_closed").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============ USERS & AUTH ============

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  phone: text("phone"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  avatarUrl: text("avatar_url"),
  locale: text("locale").default("de"),
  role: text("role").default("consumer"), // 'consumer', 'provider', 'admin'
  isEmailVerified: boolean("is_email_verified").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const staffMembers = pgTable("staff_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .references(() => businesses.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id").references(() => users.id),
  displayName: text("display_name").notNull(),
  title: text("title"), // 'Senior Stylist', etc.
  avatarUrl: text("avatar_url"),
  color: text("color"), // Hex code for calendar color
  role: text("role").default("staff"), // 'owner', 'manager', 'staff'
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }),
  isBookable: boolean("is_bookable").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const staffAvailability = pgTable("staff_availability", {
  id: uuid("id").primaryKey().defaultRandom(),
  staffId: uuid("staff_id")
    .references(() => staffMembers.id, { onDelete: "cascade" })
    .notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  isAvailable: boolean("is_available").default(true),
});

export const staffBreaks = pgTable("staff_breaks", {
  id: uuid("id").primaryKey().defaultRandom(),
  staffId: uuid("staff_id")
    .references(() => staffMembers.id, { onDelete: "cascade" })
    .notNull(),
  dayOfWeek: integer("day_of_week"), // null means all days
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
});

// ============ SERVICES ============

export const serviceCategories = pgTable("service_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .references(() => businesses.id, { onDelete: "cascade" })
    .notNull(),
  name: jsonb("name").notNull(), // {"de": "Haarschnitt", "en": "Haircut"}
  sortOrder: integer("sort_order").default(0),
});

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .references(() => businesses.id, { onDelete: "cascade" })
    .notNull(),
  categoryId: uuid("category_id").references(() => serviceCategories.id),
  name: jsonb("name").notNull(), // {"de": "Herrenschnitt", "en": "Men's Cut"}
  description: jsonb("description"),
  durationMinutes: integer("duration_minutes").notNull(),
  bufferBefore: integer("buffer_before").default(0),
  bufferAfter: integer("buffer_after").default(0),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("CHF"),
  isOnlineBookable: boolean("is_online_bookable").default(true),
  requiresScreening: boolean("requires_screening").default(false),
  maxParticipants: integer("max_participants").default(1),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const serviceStaff = pgTable(
  "service_staff",
  {
    serviceId: uuid("service_id")
      .references(() => services.id, { onDelete: "cascade" })
      .notNull(),
    staffId: uuid("staff_id")
      .references(() => staffMembers.id, { onDelete: "cascade" })
      .notNull(),
    customPrice: decimal("custom_price", { precision: 10, scale: 2 }),
    customDuration: integer("custom_duration"),
  },
  (table) => [
    primaryKey({ columns: [table.serviceId, table.staffId] }),
  ]
);

// ============ RESOURCES ============

export const resources = pgTable("resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .references(() => businesses.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  type: text("type").default("room"), // 'room', 'equipment'
  isBookable: boolean("is_bookable").default(true),
  sortOrder: integer("sort_order").default(0),
});

export const serviceResources = pgTable(
  "service_resources",
  {
    serviceId: uuid("service_id")
      .references(() => services.id, { onDelete: "cascade" })
      .notNull(),
    resourceId: uuid("resource_id")
      .references(() => resources.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.serviceId, table.resourceId] }),
  ]
);

// ============ CLIENTS (CRM) ============

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .references(() => businesses.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").references(() => users.id),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    avatarUrl: text("avatar_url"),
    dateOfBirth: date("date_of_birth"),
    gender: text("gender"),
    notes: text("notes"),
    tags: text("tags").array(), // String array for tags e.g. ['VIP']
    customFields: jsonb("custom_fields").default({}),
    totalVisits: integer("total_visits").default(0),
    totalSpent: decimal("total_spent", { precision: 12, scale: 2 }).default("0"),
    lastVisitAt: timestamp("last_visit_at", { withTimezone: true }),
    nextAppointmentAt: timestamp("next_appointment_at", { withTimezone: true }),
    noShowCount: integer("no_show_count").default(0),
    isBlocked: boolean("is_blocked").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique("uq_business_client_email").on(table.businessId, table.email),
  ]
);

// ============ PAYMENTS ============

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .references(() => businesses.id, { onDelete: "cascade" })
    .notNull(),
  clientId: uuid("client_id").references(() => clients.id),
  appointmentId: uuid("appointment_id"), // Nullable for product-only checkouts
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("CHF"),
  tipAmount: decimal("tip_amount", { precision: 10, scale: 2 }).default("0"),
  paymentMethod: text("payment_method").notNull(), // 'card', 'twint', 'cash', etc.
  status: text("status").default("pending"), // 'pending', 'completed', etc.
  stripePaymentId: text("stripe_payment_id"),
  twintTransactionId: text("twint_transaction_id"),
  isPartial: boolean("is_partial").default(false),
  parentPaymentId: uuid("parent_payment_id"), // Self-reference for split payments
  invoiceNumber: text("invoice_number"),
  invoiceUrl: text("invoice_url"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============ APPOINTMENTS ============

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .references(() => businesses.id, { onDelete: "cascade" })
      .notNull(),
    clientId: uuid("client_id").references(() => clients.id),
    staffId: uuid("staff_id").references(() => staffMembers.id),
    serviceId: uuid("service_id").references(() => services.id),
    resourceId: uuid("resource_id").references(() => resources.id),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("confirmed"), // 'pending', 'confirmed', 'cancelled'
    source: text("source").default("online"), // 'online', 'walk_in', 'phone', 'marketplace'
    price: decimal("price", { precision: 10, scale: 2 }),
    currency: text("currency").default("CHF"),
    notes: text("notes"),
    clientNotes: text("client_notes"),
    isRecurring: boolean("is_recurring").default(false),
    recurrenceRule: text("recurrence_rule"), // iCal RRULE format
    parentId: uuid("parent_id"), // Self-reference for recurring series
    requiresApproval: boolean("requires_approval").default(false),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedBy: uuid("approved_by").references(() => staffMembers.id),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancellationReason: text("cancellation_reason"),
    cancelledBy: text("cancelled_by"), // 'client', 'provider', 'system'
    paymentStatus: text("payment_status").default("unpaid"), // 'unpaid', 'paid', etc.
    paymentId: uuid("payment_id").references(() => payments.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_appointments_business_time").on(table.businessId, table.startTime, table.endTime),
    index("idx_appointments_staff_time").on(table.staffId, table.startTime, table.endTime),
    index("idx_appointments_client").on(table.clientId),
    index("idx_appointments_status").on(table.status),
  ]
);

// ============ PRODUCTS & INVENTORY ============

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .references(() => businesses.id, { onDelete: "cascade" })
    .notNull(),
  name: jsonb("name").notNull(),
  description: jsonb("description"),
  sku: text("sku"),
  barcode: text("barcode"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("8.1"), // Swiss VAT 8.1%
  stockQuantity: integer("stock_quantity").default(0),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  imageUrl: text("image_url"),
  category: text("category"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============ VOUCHERS & GIFT CARDS ============

export const vouchers = pgTable("vouchers", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .references(() => businesses.id, { onDelete: "cascade" })
    .notNull(),
  code: text("code").unique().notNull(),
  type: text("type").notNull(), // 'gift_card', 'series', 'discount'
  originalValue: decimal("original_value", { precision: 10, scale: 2 }),
  remainingValue: decimal("remaining_value", { precision: 10, scale: 2 }),
  totalSessions: integer("total_sessions"),
  usedSessions: integer("used_sessions").default(0),
  serviceId: uuid("service_id").references(() => services.id),
  discountType: text("discount_type"), // 'percentage', 'fixed'
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }),
  purchasedBy: uuid("purchased_by").references(() => clients.id),
  assignedTo: uuid("assigned_to").references(() => clients.id),
  validFrom: date("valid_from").notNull().defaultRandom(), // Default to current date in implementation
  validUntil: date("valid_until"),
  isRedeemed: boolean("is_redeemed").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============ CAMPAIGNS & MARKETING ============

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .references(() => businesses.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'sms', 'email', 'push'
  status: text("status").default("draft"), // 'draft', 'scheduled', 'sent'
  subject: text("subject"),
  body: text("body").notNull(),
  audienceType: text("audience_type").default("all"), // 'all', 'segment'
  audienceFilter: jsonb("audience_filter"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  recipientsCount: integer("recipients_count").default(0),
  openedCount: integer("opened_count").default(0),
  clickedCount: integer("clicked_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============ REVIEWS ============

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .references(() => businesses.id, { onDelete: "cascade" })
    .notNull(),
  clientId: uuid("client_id").references(() => clients.id),
  appointmentId: uuid("appointment_id").references(() => appointments.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  reply: text("reply"),
  repliedAt: timestamp("replied_at", { withTimezone: true }),
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============ NOTIFICATIONS ============

export const notificationTemplates = pgTable("notification_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .references(() => businesses.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").notNull(), // 'booking_confirmation', 'reminder_24h', etc.
  channel: text("channel").notNull(), // 'email', 'sms', 'push'
  subject: jsonb("subject"), // Localized subjects
  body: jsonb("body").notNull(), // Localized body templates
  isActive: boolean("is_active").default(true),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").references(() => businesses.id),
  recipientId: uuid("recipient_id"),
  channel: text("channel").notNull(),
  type: text("type").notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  status: text("status").default("pending"), // 'pending', 'sent', 'failed'
  sentAt: timestamp("sent_at", { withTimezone: true }),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============ WAITLIST ============

export const waitlistEntries = pgTable("waitlist_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .references(() => businesses.id, { onDelete: "cascade" })
    .notNull(),
  clientId: uuid("client_id").references(() => clients.id),
  serviceId: uuid("service_id").references(() => services.id),
  staffId: uuid("staff_id").references(() => staffMembers.id),
  preferredDate: date("preferred_date"),
  preferredTime: text("preferred_time"), // 'morning', 'afternoon', 'any'
  status: text("status").default("waiting"), // 'waiting', 'offered', 'booked'
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============ RELATION DEFINITIONS ============

export const businessesRelations = relations(businesses, ({ many }) => ({
  hours: many(businessHours),
  staff: many(staffMembers),
  services: many(services),
  appointments: many(appointments),
  clients: many(clients),
  payments: many(payments),
  products: many(products),
  vouchers: many(vouchers),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  business: one(businesses, {
    fields: [appointments.businessId],
    references: [businesses.id],
  }),
  client: one(clients, {
    fields: [appointments.clientId],
    references: [clients.id],
  }),
  staff: one(staffMembers, {
    fields: [appointments.staffId],
    references: [staffMembers.id],
  }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
  payment: one(payments, {
    fields: [appointments.paymentId],
    references: [payments.id],
  }),
}));
