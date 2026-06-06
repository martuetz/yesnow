import { z } from "zod";

export const bookingCreateInputSchema = z.object({
  businessId: z.string().uuid(),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid(),
  startTime: z.string().datetime(),
  clientId: z.string().uuid().optional(),
  clientNotes: z.string().optional(),
  source: z.enum(["online", "walk_in", "phone", "marketplace"]),
});

export const availabilityQuerySchema = z.object({
  businessId: z.string().uuid(),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be in YYYY-MM-DD format"),
});

export const businessCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must be alphanumeric lowercase and hyphens only"),
  category: z.string().min(1, "Category is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  addressLine1: z.string().optional(),
  city: z.string().min(1, "City is required"),
  canton: z.string().min(2, "Canton must be a 2-letter code").max(2).toUpperCase(),
  postalCode: z.string().min(4, "Postal code must be at least 4 digits"),
  defaultLocale: z.enum(["de", "fr", "it", "en"]).default("de"),
});

export type BookingCreateInput = z.infer<typeof bookingCreateInputSchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
export type BusinessCreate = z.infer<typeof businessCreateSchema>;
