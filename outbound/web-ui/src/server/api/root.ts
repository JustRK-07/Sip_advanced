import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { livekitRouter } from "./routers/livekit";
import { slotsRouter } from "./routers/slots";
import { csvRouter } from "@/server/api/routers/csv";
import { campaignRouter } from "@/server/api/routers/campaign";
import { settingsRouter } from "@/server/api/routers/settings";
import { twilioRouter } from "@/server/api/routers/twilio";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  livekit: livekitRouter,
  slots: slotsRouter,
  csv: csvRouter,
  campaign: campaignRouter,
  settings: settingsRouter,
  twilio: twilioRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
