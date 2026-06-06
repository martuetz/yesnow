import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { businessCreateSchema } from "@yesnow/shared";
import { businesses } from "@yesnow/db";

export const businessRouter = router({
  create: protectedProcedure
    .input(businessCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const [newBusiness] = await ctx.db
        .insert(businesses)
        .values({
          name: input.name,
          slug: input.slug,
          category: input.category,
          email: input.email,
          phone: input.phone,
          addressLine1: input.addressLine1,
          city: input.city,
          canton: input.canton,
          postalCode: input.postalCode,
          defaultLocale: input.defaultLocale,
        })
        .returning();
      return newBusiness;
    }),

  getById: publicProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input }) => {
      const business = await ctx.db.query.businesses.findFirst({
        where: (table, { eq }) => eq(table.id, input),
      });
      return business || null;
    }),
});
