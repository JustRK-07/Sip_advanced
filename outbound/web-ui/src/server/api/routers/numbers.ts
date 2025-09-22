import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { env } from "@/env";
import twilio from 'twilio';

// Initialize Twilio client
const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export const numbersRouter = createTRPCRouter({
  // Get all phone numbers (purchased and available)
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.phoneNumber.findMany({
      include: {
        assignedAgent: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Sync existing Twilio numbers to database
  syncFromTwilio: publicProcedure.mutation(async ({ ctx }) => {
    try {
      console.log("Syncing numbers from Twilio...");
      
      // Get all existing numbers from Twilio
      const twilioNumbers = await twilioClient.incomingPhoneNumbers.list();
      console.log("Found Twilio numbers:", twilioNumbers.length);

      let syncedCount = 0;
      for (const twilioNumber of twilioNumbers) {
        // Check if number already exists in database
        const existingNumber = await ctx.prisma.phoneNumber.findUnique({
          where: { twilioSid: twilioNumber.sid }
        });

        if (!existingNumber) {
          // Add to database
          await ctx.prisma.phoneNumber.create({
            data: {
              number: twilioNumber.phoneNumber,
              friendlyName: twilioNumber.friendlyName || `Number ${twilioNumber.phoneNumber}`,
              status: "AVAILABLE", // Default status
              capabilities: JSON.stringify(twilioNumber.capabilities || { voice: true, sms: true }),
              twilioSid: twilioNumber.sid,
              twilioAccount: env.TWILIO_ACCOUNT_SID || "",
              country: "US", // Default to US
              region: "Unknown",
              monthlyCost: 1.0, // Default cost
              assignedAgentId: null,
            },
          });
          syncedCount++;
          console.log("Added number to database:", twilioNumber.phoneNumber);
        }
      }

      return {
        success: true,
        message: `Synced ${syncedCount} numbers from Twilio`,
        syncedCount,
      };
    } catch (error) {
      console.error("Error syncing numbers from Twilio:", error);
      throw new Error(`Failed to sync numbers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }),

  // Search available numbers from Twilio
  searchAvailable: publicProcedure
    .input(
      z.object({
        country: z.string().default("US"),
        areaCode: z.string().optional(),
        contains: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      try {
        const searchParams: any = {
          countryCode: input.country,
          limit: input.limit,
        };

        if (input.areaCode) {
          searchParams.areaCode = input.areaCode;
        }

        if (input.contains) {
          searchParams.contains = input.contains;
        }

        const availableNumbers = await twilioClient.availablePhoneNumbers(input.country)
          .local
          .list(searchParams);

        return {
          success: true,
          numbers: availableNumbers.map((number) => ({
            phoneNumber: number.phoneNumber,
            friendlyName: number.friendlyName,
            capabilities: number.capabilities,
            locality: number.locality,
            region: number.region,
            countryCode: number.countryCode,
            monthlyCost: 1.0, // Default cost
          })),
        };
      } catch (error) {
        console.error("Error searching available numbers:", error);
        throw new Error(`Failed to search available numbers: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Purchase a phone number from Twilio
  purchase: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string().min(1, "Phone number is required"),
        friendlyName: z.string().optional(),
        capabilities: z.array(z.string()).default(["voice"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Purchase the number from Twilio
        const incomingPhoneNumber = await twilioClient.incomingPhoneNumbers.create({
          phoneNumber: input.phoneNumber,
          friendlyName: input.friendlyName || `Number ${input.phoneNumber}`,
          // Remove webhook URLs for now - they can be configured later
          // voiceUrl: `${env.NEXT_PUBLIC_API_URL || 'http://localhost:3025'}/api/twilio/voice`,
          // voiceMethod: 'POST',
          // statusCallback: `${env.NEXT_PUBLIC_API_URL || 'http://localhost:3025'}/api/twilio/status`,
          // statusCallbackMethod: 'POST',
        });

        // Save to database
        const phoneNumber = await ctx.prisma.phoneNumber.create({
          data: {
            number: input.phoneNumber,
            friendlyName: input.friendlyName || `Number ${input.phoneNumber}`,
            status: "AVAILABLE",
            capabilities: JSON.stringify(input.capabilities),
            twilioSid: incomingPhoneNumber.sid,
            twilioAccount: env.TWILIO_ACCOUNT_SID || "",
            country: "US", // Default to US for now
            monthlyCost: 1.0, // Default cost
          },
        });

        return {
          success: true,
          phoneNumber,
          message: `Successfully purchased ${input.phoneNumber}`,
        };
      } catch (error) {
        console.error("Error purchasing number:", error);
        throw new Error(`Failed to purchase number: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Assign a phone number to an agent
  assignToAgent: publicProcedure
    .input(
      z.object({
        phoneNumberId: z.string().min(1, "Phone number ID is required"),
        agentId: z.string().min(1, "Agent ID is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if phone number is available
        const phoneNumber = await ctx.prisma.phoneNumber.findUnique({
          where: { id: input.phoneNumberId },
          include: { assignedAgent: true },
        });

        if (!phoneNumber) {
          throw new Error("Phone number not found");
        }

        if (phoneNumber.status !== "AVAILABLE") {
          throw new Error("Phone number is not available for assignment");
        }

        // Check if agent exists and is not already assigned a number
        const agent = await ctx.prisma.agent.findUnique({
          where: { id: input.agentId },
          include: { phoneNumber: true },
        });

        if (!agent) {
          throw new Error("Agent not found");
        }

        if (agent.phoneNumberId) {
          throw new Error("Agent already has a phone number assigned");
        }

        // Update phone number status and assignment
        const updatedPhoneNumber = await ctx.prisma.phoneNumber.update({
          where: { id: input.phoneNumberId },
          data: {
            status: "ASSIGNED",
            assignedAgentId: input.agentId,
          },
        });

        // Update agent with phone number
        const updatedAgent = await ctx.prisma.agent.update({
          where: { id: input.agentId },
          data: {
            phoneNumberId: input.phoneNumberId,
          },
        });

        return {
          success: true,
          phoneNumber: updatedPhoneNumber,
          agent: updatedAgent,
          message: `Successfully assigned ${phoneNumber.number} to ${agent.name}`,
        };
      } catch (error) {
        console.error("Error assigning number to agent:", error);
        throw new Error(`Failed to assign number: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Release a phone number from an agent
  releaseFromAgent: publicProcedure
    .input(
      z.object({
        phoneNumberId: z.string().min(1, "Phone number ID is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const phoneNumber = await ctx.prisma.phoneNumber.findUnique({
          where: { id: input.phoneNumberId },
          include: { assignedAgent: true },
        });

        if (!phoneNumber) {
          throw new Error("Phone number not found");
        }

        if (phoneNumber.status !== "ASSIGNED") {
          throw new Error("Phone number is not currently assigned");
        }

        // Update phone number status
        const updatedPhoneNumber = await ctx.prisma.phoneNumber.update({
          where: { id: input.phoneNumberId },
          data: {
            status: "AVAILABLE",
            assignedAgentId: null,
          },
        });

        // Update agent to remove phone number
        if (phoneNumber.assignedAgentId) {
          await ctx.prisma.agent.update({
            where: { id: phoneNumber.assignedAgentId },
            data: {
              phoneNumberId: null,
            },
          });
        }

        return {
          success: true,
          phoneNumber: updatedPhoneNumber,
          message: `Successfully released ${phoneNumber.number}`,
        };
      } catch (error) {
        console.error("Error releasing number:", error);
        throw new Error(`Failed to release number: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Get number statistics
  getStats: publicProcedure.query(async ({ ctx }) => {
    const totalNumbers = await ctx.prisma.phoneNumber.count();
    const availableNumbers = await ctx.prisma.phoneNumber.count({
      where: { status: "AVAILABLE" },
    });
    const assignedNumbers = await ctx.prisma.phoneNumber.count({
      where: { status: "ASSIGNED" },
    });
    const suspendedNumbers = await ctx.prisma.phoneNumber.count({
      where: { status: "SUSPENDED" },
    });

    const totalMonthlyCost = await ctx.prisma.phoneNumber.aggregate({
      _sum: { monthlyCost: true },
    });

    return {
      totalNumbers,
      availableNumbers,
      assignedNumbers,
      suspendedNumbers,
      totalMonthlyCost: totalMonthlyCost._sum.monthlyCost || 0,
    };
  }),

  // Update number configuration
  updateConfig: publicProcedure
    .input(
      z.object({
        phoneNumberId: z.string().min(1, "Phone number ID is required"),
        friendlyName: z.string().optional(),
        capabilities: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const updateData: any = {};
        
        if (input.friendlyName !== undefined) {
          updateData.friendlyName = input.friendlyName;
        }
        
        if (input.capabilities !== undefined) {
          updateData.capabilities = JSON.stringify(input.capabilities);
        }

        const updatedPhoneNumber = await ctx.prisma.phoneNumber.update({
          where: { id: input.phoneNumberId },
          data: updateData,
        });

        return {
          success: true,
          phoneNumber: updatedPhoneNumber,
          message: "Phone number configuration updated successfully",
        };
      } catch (error) {
        console.error("Error updating number config:", error);
        throw new Error(`Failed to update number configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),
});
