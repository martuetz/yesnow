import { initTRPC, TRPCError } from "@trpc/server";
import { db } from "@yesnow/db";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  // Placeholder session extraction. In production, this integrates with Better Auth.
  const session = {
    userId: "mock-user-id",
    role: "owner", // consumer, staff, owner, etc.
    businessId: "mock-business-id",
  };

  return {
    db,
    session,
    headers: opts.headers,
  };
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});
