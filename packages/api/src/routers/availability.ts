import { router, publicProcedure } from "../trpc";
import { availabilityQuerySchema } from "@yesnow/shared";

export const availabilityRouter = router({
  getSlots: publicProcedure
    .input(availabilityQuerySchema)
    .query(async ({ ctx, input }) => {
      // Slot calculation algorithm placeholders.
      // In production, this pulls business hours, staff shifts, breaks,
      // and existing appointments to find free windows.
      const date = input.date;
      return [
        {
          startTime: `${date}T09:00:00.000Z`,
          endTime: `${date}T09:30:00.000Z`,
          staffId: input.staffId || "mock-staff-1",
          available: true,
        },
        {
          startTime: `${date}T09:30:00.000Z`,
          endTime: `${date}T10:00:00.000Z`,
          staffId: input.staffId || "mock-staff-1",
          available: true,
        },
        {
          startTime: `${date}T10:00:00.000Z`,
          endTime: `${date}T10:30:00.000Z`,
          staffId: input.staffId || "mock-staff-1",
          available: false,
        },
        {
          startTime: `${date}T10:30:00.000Z`,
          endTime: `${date}T11:00:00.000Z`,
          staffId: input.staffId || "mock-staff-1",
          available: true,
        },
      ];
    }),
});
