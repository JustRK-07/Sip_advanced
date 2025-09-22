import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { spawn, ChildProcess } from "child_process";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { env } from "@/env";

// Store running agent processes
const runningAgents = new Map<string, ChildProcess>();

// Function to create agent-specific Python script
function createAgentScript(agent: any): string {
  const scriptContent = `
from dotenv import load_dotenv
import aiohttp
import logging
import json
import os
from typing import Any, Dict
from datetime import datetime

from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions, function_tool, RunContext
from livekit.plugins import openai

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agent-${agent.id}")

# Agent Configuration
AGENT_ID = "${agent.id}"
AGENT_NAME = "${agent.name}"
AGENT_PROMPT = """${agent.prompt}"""
MODEL = "${agent.model}"
VOICE = "${agent.voice}"
TEMPERATURE = ${agent.temperature}
MAX_TOKENS = ${agent.maxTokens}

# Get API URL from environment variable
API_URL = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:3025")

class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=AGENT_PROMPT
        )
        self.conversation_data = {}
        self.agent_id = AGENT_ID
        self.agent_name = AGENT_NAME
        self.ctx = None  # Will be set by entrypoint

    @function_tool()
    async def save_conversation_data(
        self,
        context: RunContext,
        key: str,
        value: str,
    ) -> str:
        """Save important data from the conversation."""
        self.conversation_data[key] = value
        logger.info(f"Agent {self.agent_name} - Saved conversation data - {key}: {value}")
        return f"Saved {key}: {value}"

    @function_tool()
    async def book_slot(
        self,
        context: RunContext,
        name: str,
        place: str,
        date: str,
    ) -> str:
        """Book a slot for the user's vacation visit."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{API_URL}/api/book-slot",
                    json={
                        "name": name,
                        "place": place,
                        "date": date,
                        "agentId": self.agent_id,
                    },
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        logger.info(f"Agent {self.agent_name} - Booking successful: {result}")
                        return f"Booking confirmed! Your slot for {place} on {date} has been booked successfully."
                    else:
                        logger.error(f"Agent {self.agent_name} - Booking failed: {response.status}")
                        return "Sorry, there was an issue with booking your slot. Please try again."
        except Exception as e:
            logger.error(f"Agent {self.agent_name} - Booking error: {e}")
            return "Sorry, there was an issue with booking your slot. Please try again."

    async def on_data_received(self, data: bytes, participant, kind):
        """Handle incoming data messages (chat)."""
        try:
            logger.info(f"Agent {self.agent_name} - Raw data received: {data}")
            message = json.loads(data.decode('utf-8'))
            logger.info(f"Agent {self.agent_name} - Parsed message: {message}")
            
            if message.get('type') == 'chat' and message.get('text'):
                user_message = message['text']
                logger.info(f"Agent {self.agent_name} - Received chat message: {user_message}")
                
                # Process the message and generate response
                response = await self.process_chat_message(user_message)
                logger.info(f"Agent {self.agent_name} - Generated response: {response}")
                
                # Send response back
                response_data = {
                    'type': 'chat',
                    'text': response,
                    'timestamp': datetime.now().isoformat()
                }
                
                # Send response to the participant
                await self.ctx.room.local_participant.publish_data(
                    json.dumps(response_data).encode('utf-8'),
                    kind=kind
                )
                
                logger.info(f"Agent {self.agent_name} - Sent chat response: {response}")
            else:
                logger.info(f"Agent {self.agent_name} - Message not a chat message: {message}")
        except Exception as e:
            logger.error(f"Agent {self.agent_name} - Error processing chat message: {e}", exc_info=True)

    async def process_chat_message(self, message: str) -> str:
        """Process chat message and generate response."""
        # Enhanced response logic for better chat experience
        message_lower = message.lower()
        
        if any(greeting in message_lower for greeting in ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"]):
            return f"Hello! I'm {self.agent_name}, your AI assistant. I'm currently running in chat mode. How can I help you today?"
        elif "help" in message_lower:
            return "I can help you with various tasks including: Answering questions, Providing information, Booking appointments, General assistance. What would you like to know?"
        elif any(word in message_lower for word in ["book", "appointment", "schedule", "reserve"]):
            return "I can help you book appointments! Please provide: Your name, The place you'd like to visit, Your preferred date and time. What would you like to book?"
        elif "status" in message_lower or "how are you" in message_lower:
            return f"I'm {self.agent_name} and I'm running perfectly! I'm connected to LiveKit and ready to assist you. What can I do for you?"
        elif "test" in message_lower:
            return "Test successful! I'm responding to your messages in real-time. The chat system is working properly."
        elif "time" in message_lower:
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            return f"The current time is {current_time}. How else can I assist you?"
        else:
            return f"Thank you for your message: '{message}'. I'm {self.agent_name} and I'm here to help! I can assist with questions, bookings, or general information. What would you like to know?"


async def entrypoint(ctx: agents.JobContext):
    try:
        # Connect to the room
        await ctx.connect()
        logger.info(f"Agent {AGENT_NAME} connected to room: {ctx.room.name if ctx.room else 'Unknown'}")

        # Initialize the agent
        assistant = Assistant()
        assistant.ctx = ctx  # Set context for data handling

        # Set up data event listener for chat messages
        def handle_data_received(data, participant, kind):
            import asyncio
            logger.info(f"Agent {AGENT_NAME} - Data received event triggered")
            asyncio.create_task(assistant.on_data_received(data, participant, kind))
        
        ctx.room.on("dataReceived", handle_data_received)
        logger.info(f"Agent {AGENT_NAME} - Data event listener registered")

        # Initialize agent session (only if OpenAI API key is available)
        try:
            session = AgentSession(
                llm=openai.realtime.RealtimeModel(),
            )
            logger.info(f"Agent {AGENT_NAME} - OpenAI realtime model initialized")
            
            # Start the agent session with OpenAI
            await session.start(ctx.room, assistant)
            logger.info(f"Agent {AGENT_NAME} session started successfully with OpenAI")
        except Exception as e:
            logger.warning(f"Agent {AGENT_NAME} - OpenAI not available: {e}")
            logger.info(f"Agent {AGENT_NAME} running in chat-only mode (no OpenAI)")
            
            # Keep the agent running for chat-only mode
            import asyncio
            while True:
                await asyncio.sleep(1)

    except Exception as e:
        logger.error(f"Error in agent {AGENT_NAME}: {e}", exc_info=True)
        raise

if __name__ == "__main__":
    import random
    # Use a random port to avoid conflicts
    port = random.randint(8083, 8999)
    agents.cli.run_app(agents.WorkerOptions(
        entrypoint_fnc=entrypoint,
        port=port
    ))
`;

  return scriptContent;
}

// Function to start agent process
function startAgentProcess(agent: any): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    try {
      // Create agents directory if it doesn't exist
      const agentsDir = join(process.cwd(), "agents");
      if (!existsSync(agentsDir)) {
        mkdirSync(agentsDir, { recursive: true });
      }

      // Create agent-specific script
      const scriptPath = join(agentsDir, `agent-${agent.id}.py`);
      const scriptContent = createAgentScript(agent);
      writeFileSync(scriptPath, scriptContent);

      // Set environment variables for this agent
      const envVars = {
        ...process.env,
        LIVEKIT_URL: env.LIVEKIT_API_ENDPOINT,
        LIVEKIT_API_KEY: env.LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET: env.LIVEKIT_API_SECRET,
        LIVEKIT_ROOM: `agent-${agent.id}`,
        NEXT_PUBLIC_API_URL: env.NEXT_PUBLIC_API_URL || "http://localhost:3025",
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      };

      // Spawn Python process with dev command
      const pythonProcess = spawn("python", [scriptPath, "dev"], {
        env: envVars,
        cwd: process.cwd(), // Run from web-ui directory where the script is
        stdio: ["pipe", "pipe", "pipe"],
      });

      // Handle process events
      pythonProcess.on("spawn", () => {
        console.log(`✅ Agent ${agent.name} (${agent.id}) started successfully`);
        resolve(pythonProcess);
      });

      pythonProcess.on("error", (error) => {
        console.error(`❌ Failed to start agent ${agent.name}:`, error);
        reject(error);
      });

      pythonProcess.on("exit", (code, signal) => {
        console.log(`🔄 Agent ${agent.name} (${agent.id}) exited with code ${code}, signal ${signal}`);
        runningAgents.delete(agent.id);
        
        // Update agent status to INACTIVE if it exited with error
        if (code !== 0) {
          console.log(`❌ Agent ${agent.name} crashed, updating status to INACTIVE`);
          // Note: We can't access ctx.prisma here, so we'll handle this in the UI
        }
      });

      // Log stdout and stderr for debugging
      pythonProcess.stdout?.on('data', (data) => {
        console.log(`[${agent.name}] stdout:`, data.toString());
      });

      pythonProcess.stderr?.on('data', (data) => {
        console.error(`[${agent.name}] stderr:`, data.toString());
      });

      // Store the process
      runningAgents.set(agent.id, pythonProcess);

    } catch (error) {
      reject(error);
    }
  });
}

// Function to stop agent process
function stopAgentProcess(agentId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = runningAgents.get(agentId);
    if (process) {
      process.kill("SIGTERM");
      runningAgents.delete(agentId);
      console.log(`Agent ${agentId} stopped successfully`);
      resolve();
    } else {
      console.log(`Agent ${agentId} was not running`);
      resolve();
    }
  });
}

export const agentsRouter = createTRPCRouter({
  // Get all agents
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.agent.findMany({
      include: {
        phoneNumber: {
          select: {
            id: true,
            number: true,
            friendlyName: true,
            status: true,
          },
        },
        campaigns: {
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            conversations: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Get agent by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.agent.findUnique({
        where: { id: input.id },
        include: {
          phoneNumber: true,
          campaigns: {
            include: {
              campaign: true,
            },
          },
          conversations: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });
    }),

  // Create a new agent
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Agent name is required"),
        description: z.string().optional(),
        prompt: z.string().min(1, "Agent prompt is required"),
        model: z.string().default("gpt-4"),
        voice: z.string().default("nova"),
        temperature: z.number().min(0).max(2).default(0.7),
        maxTokens: z.number().min(1).max(4000).default(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if agent name already exists
        const existingAgent = await ctx.prisma.agent.findUnique({
          where: { name: input.name },
        });

        if (existingAgent) {
          throw new Error("Agent with this name already exists");
        }

        const agent = await ctx.prisma.agent.create({
          data: {
            name: input.name,
            description: input.description,
            prompt: input.prompt,
            model: input.model,
            voice: input.voice,
            temperature: input.temperature,
            maxTokens: input.maxTokens,
            status: "INACTIVE",
          },
        });

        return {
          success: true,
          agent,
          message: `Agent "${input.name}" created successfully`,
        };
      } catch (error) {
        console.error("Error creating agent:", error);
        throw new Error(`Failed to create agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Update agent configuration
  update: publicProcedure
    .input(
      z.object({
        id: z.string().min(1, "Agent ID is required"),
        name: z.string().min(1, "Agent name is required").optional(),
        description: z.string().optional(),
        prompt: z.string().min(1, "Agent prompt is required").optional(),
        model: z.string().optional(),
        voice: z.string().optional(),
        temperature: z.number().min(0).max(2).optional(),
        maxTokens: z.number().min(1).max(4000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...updateData } = input;

        // Check if agent exists
        const existingAgent = await ctx.prisma.agent.findUnique({
          where: { id },
        });

        if (!existingAgent) {
          throw new Error("Agent not found");
        }

        // If name is being updated, check for duplicates
        if (updateData.name && updateData.name !== existingAgent.name) {
          const duplicateAgent = await ctx.prisma.agent.findUnique({
            where: { name: updateData.name },
          });

          if (duplicateAgent) {
            throw new Error("Agent with this name already exists");
          }
        }

        const updatedAgent = await ctx.prisma.agent.update({
          where: { id },
          data: updateData,
        });

        return {
          success: true,
          agent: updatedAgent,
          message: "Agent updated successfully",
        };
      } catch (error) {
        console.error("Error updating agent:", error);
        throw new Error(`Failed to update agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Deploy agent (activate and configure)
  deploy: publicProcedure
    .input(
      z.object({
        id: z.string().min(1, "Agent ID is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const agent = await ctx.prisma.agent.findUnique({
          where: { id: input.id },
          include: { phoneNumber: true },
        });

        if (!agent) {
          throw new Error("Agent not found");
        }

        if (agent.status === "ACTIVE") {
          throw new Error("Agent is already active");
        }

        // Note: Phone number assignment is optional for testing
        // In production, you might want to require a phone number
        // if (!agent.phoneNumberId) {
        //   throw new Error("Agent must have a phone number assigned before deployment");
        // }

        // Update agent status to deploying
        await ctx.prisma.agent.update({
          where: { id: input.id },
          data: { status: "DEPLOYING" },
        });

        // Check if agent is already running
        if (runningAgents.has(input.id)) {
          throw new Error("Agent is already running");
        }

        // Start the actual Python process
        await startAgentProcess(agent);

        // Update agent status to active
        const deployedAgent = await ctx.prisma.agent.update({
          where: { id: input.id },
          data: { 
            status: "ACTIVE",
            livekitConfig: {
              roomTemplate: `agent-${agent.id}`,
              webhookUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/livekit/webhook`,
            },
            twilioConfig: {
              webhookUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/twilio/voice`,
              statusCallback: `${process.env.NEXT_PUBLIC_API_URL}/api/twilio/status`,
            },
          },
        });

        return {
          success: true,
          agent: deployedAgent,
          message: `Agent "${agent.name}" deployed successfully`,
        };
      } catch (error) {
        console.error("Error deploying agent:", error);
        
        // Update agent status to error
        await ctx.prisma.agent.update({
          where: { id: input.id },
          data: { status: "ERROR" },
        });

        throw new Error(`Failed to deploy agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Stop agent (deactivate)
  stop: publicProcedure
    .input(
      z.object({
        id: z.string().min(1, "Agent ID is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const agent = await ctx.prisma.agent.findUnique({
          where: { id: input.id },
        });

        if (!agent) {
          throw new Error("Agent not found");
        }

        if (agent.status !== "ACTIVE") {
          throw new Error("Agent is not currently active");
        }

        // Stop the actual Python process
        await stopAgentProcess(input.id);

        const stoppedAgent = await ctx.prisma.agent.update({
          where: { id: input.id },
          data: { status: "INACTIVE" },
        });

        return {
          success: true,
          agent: stoppedAgent,
          message: `Agent "${agent.name}" stopped successfully`,
        };
      } catch (error) {
        console.error("Error stopping agent:", error);
        throw new Error(`Failed to stop agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Delete agent
  delete: publicProcedure
    .input(
      z.object({
        id: z.string().min(1, "Agent ID is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const agent = await ctx.prisma.agent.findUnique({
          where: { id: input.id },
          include: { phoneNumber: true, campaigns: true },
        });

        if (!agent) {
          throw new Error("Agent not found");
        }

        if (agent.status === "ACTIVE") {
          throw new Error("Cannot delete active agent. Please stop the agent first.");
        }

        if (agent.campaigns.length > 0) {
          throw new Error("Cannot delete agent that is assigned to campaigns. Please remove from campaigns first.");
        }

        // Release phone number if assigned
        if (agent.phoneNumberId) {
          await ctx.prisma.phoneNumber.update({
            where: { id: agent.phoneNumberId },
            data: {
              status: "AVAILABLE",
              assignedAgentId: null,
            },
          });
        }

        // Delete agent
        await ctx.prisma.agent.delete({
          where: { id: input.id },
        });

        return {
          success: true,
          message: `Agent "${agent.name}" deleted successfully`,
        };
      } catch (error) {
        console.error("Error deleting agent:", error);
        throw new Error(`Failed to delete agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Get agent performance metrics
  getPerformance: publicProcedure
    .input(
      z.object({
        id: z.string().min(1, "Agent ID is required"),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const conversations = await ctx.prisma.conversation.findMany({
        where: {
          agentId: input.id,
          createdAt: {
            gte: startDate,
          },
        },
        select: {
          id: true,
          status: true,
          outcome: true,
          duration: true,
          leadScore: true,
          sentiment: true,
          createdAt: true,
        },
      });

      const totalCalls = conversations.length;
      const answeredCalls = conversations.filter(c => c.status === "COMPLETED").length;
      const interestedCalls = conversations.filter(c => c.outcome === "INTERESTED").length;
      const averageDuration = conversations.reduce((sum, c) => sum + (c.duration || 0), 0) / totalCalls || 0;
      const averageLeadScore = conversations.reduce((sum, c) => sum + (c.leadScore || 0), 0) / totalCalls || 0;

      return {
        totalCalls,
        answeredCalls,
        answerRate: totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0,
        interestedCalls,
        conversionRate: answeredCalls > 0 ? (interestedCalls / answeredCalls) * 100 : 0,
        averageDuration,
        averageLeadScore,
        conversations: conversations.slice(0, 10), // Recent conversations
      };
    }),

  // Get agent statistics
  getStats: publicProcedure.query(async ({ ctx }) => {
    const totalAgents = await ctx.prisma.agent.count();
    const activeAgents = await ctx.prisma.agent.count({
      where: { status: "ACTIVE" },
    });
    const inactiveAgents = await ctx.prisma.agent.count({
      where: { status: "INACTIVE" },
    });
    const deployingAgents = await ctx.prisma.agent.count({
      where: { status: "DEPLOYING" },
    });
    const errorAgents = await ctx.prisma.agent.count({
      where: { status: "ERROR" },
    });

    const totalCalls = await ctx.prisma.conversation.count({
      where: {
        agent: { isNot: null },
      },
    });

    return {
      totalAgents,
      activeAgents,
      inactiveAgents,
      deployingAgents,
      errorAgents,
      totalCalls,
    };
  }),

  // Get real-time agent status
  getRealTimeStatus: publicProcedure.query(async ({ ctx }) => {
    const agents = await ctx.prisma.agent.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        phoneNumber: {
          select: {
            number: true,
          },
        },
      },
    });

    return agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      status: agent.status,
      isRunning: runningAgents.has(agent.id),
      phoneNumber: agent.phoneNumber?.number,
      realTimeStatus: runningAgents.has(agent.id) ? "RUNNING" : agent.status,
    }));
  }),

  // Get agent logs (if process is running)
  getLogs: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const process = runningAgents.get(input.id);
      if (process) {
        return {
          isRunning: true,
          pid: process.pid,
          message: "Agent is running. Logs would be available here.",
        };
      } else {
        return {
          isRunning: false,
          message: "Agent is not currently running.",
        };
      }
    }),
});
