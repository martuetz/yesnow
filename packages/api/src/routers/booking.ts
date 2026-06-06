import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { bookingCreateInputSchema } from "@yesnow/shared";
import { appointments } from "@yesnow/db";

export const bookingRouter = router({
  create: protectedProcedure
    .input(bookingCreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      // For scaffold, we assume a 30-minute mock duration. In the full implementation,
      // this duration is calculated based on service attributes and buffers.
      const start = new Date(input.startTime);
      const end = new Date(start.getTime() + 30 * 60000);

      const [newAppointment] = await ctx.db
        .insert(appointments)
        .values({
          businessId: input.businessId,
          serviceId: input.serviceId,
          staffId: input.staffId,
          startTime: start,
          endTime: end,
          clientNotes: input.clientNotes,
          source: input.source,
          status: "confirmed",
          paymentStatus: "unpaid",
        })
        .returning();

      return newAppointment;
    }),

  getById: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input }) => {
      const appointment = await ctx.db.query.appointments.findFirst({
        where: (table, { eq }) => eq(table.id, input),
        with: {
          service: true,
          staff: true,
          client: true,
        },
      });
      return appointment || null;
    }),
});
