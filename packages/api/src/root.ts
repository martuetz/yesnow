import { router } from "./trpc";
import { businessRouter } from "./routers/business";
import { bookingRouter } from "./routers/booking";
import { availabilityRouter } from "./routers/availability";

export const appRouter = router({
  business: businessRouter,
  booking: bookingRouter,
  availability: availabilityRouter,
});

export type AppRouter = typeof appRouter;
