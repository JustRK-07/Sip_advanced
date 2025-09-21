// server/api/routers/booking.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const bookingRouter = createTRPCRouter({
  getAllBookings: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.slot.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),
});
