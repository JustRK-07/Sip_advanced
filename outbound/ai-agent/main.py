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
logger = logging.getLogger("booking-agent")

# Get API URL from environment variable or default to localhost:3010
API_URL = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:3010")

class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=(
                "You are a helpful voice AI assistant interested in helping users plan vacation visits. "
                "After gathering details like name, place to visit, and date, book a slot and confirm the booking."
            )
        )
        self.conversation_data = {}

    @function_tool()
    async def save_conversation_data(
        self,
        context: RunContext,
        key: str,
        value: str,
    ) -> str:
        """Save important data from the conversation.

        Args:
            key: The type of information being saved (e.g., "name", "place", "date")
            value: The value to save

        Returns:
            Confirmation message
        """
        self.conversation_data[key] = value
        logger.info(f"Saved conversation data - {key}: {value}")
        return f"Saved {key}: {value}"

    @function_tool()
    async def book_slot(
        self,
        context: RunContext,
        name: str,
        place: str,
        date: str,
    ) -> str:
        """Book a slot for the user.

        Args:
            name: The name of the user booking the slot.
            place: The vacation place the user wants to visit.
            date: The date for the booking in format YYYY-MM-DD.

        Returns:
            Confirmation or error message.
        """
        # Save the booking details
        await self.save_conversation_data("name", name)
        await self.save_conversation_data("place", place)
        await self.save_conversation_data("date", date)
        
        async with aiohttp.ClientSession() as session:
            # First, try to book the slot
            try:
                async with session.post(
                    f"{API_URL}/api/book-slot",
                    json={"name": name, "place": place, "date": date}
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        logger.info(f"Booking confirmed: {data}")
                        
                        # Save the successful booking
                        await self.save_conversation_data("booking_status", "confirmed")
                        await self.save_conversation_data("booking_id", str(data.get("id", "")))
                        
                        return (
                            f"Great! I've booked your visit to {place} for {name} on {date}. "
                            "Your booking has been confirmed."
                        )
                    else:
                        error_text = await response.text()
                        logger.error(f"Booking failed with status {response.status}: {error_text}")
                        await self.save_conversation_data("booking_status", "failed")
                        await self.save_conversation_data("error", error_text)
                        return "I'm sorry, there was an error booking your appointment. Please try again later."
            except Exception as e:
                logger.error(f"Error during booking: {str(e)}")
                await self.save_conversation_data("booking_status", "error")
                await self.save_conversation_data("error", str(e))
                return "I'm sorry, there was an error processing your booking. Please try again later."

    @function_tool()
    async def end_conversation(
        self,
        context: RunContext,
        outcome: str,
        summary: str,
    ) -> str:
        """End the conversation and save results.

        Args:
            outcome: The final outcome (e.g., "booked", "not_booked", "needs_followup")
            summary: A brief summary of the conversation

        Returns:
            Confirmation message
        """
        results = {
            "outcome": outcome,
            "summary": summary,
            "data": self.conversation_data
        }

        logger.info(f"Ending conversation with results: {results}")

        try:
            # Get room metadata
            if not context.room or not context.room.metadata:
                logger.error("Room or metadata not available")
                return "Error: Could not access room metadata"

            metadata = json.loads(context.room.metadata)
            campaign_id = metadata.get("campaignId")
            lead_id = metadata.get("leadId")

            if not campaign_id or not lead_id:
                logger.error(f"Missing required metadata. Campaign ID: {campaign_id}, Lead ID: {lead_id}")
                return "Error: Missing required metadata"

            async with aiohttp.ClientSession() as session:
                url = f"{API_URL}/api/trpc/campaign.saveConversation"
                logger.info(f"Sending results to {url}")
                
                async with session.post(
                    url,
                    json={
                        "campaignId": campaign_id,
                        "leadId": lead_id,
                        "status": "COMPLETED",
                        "results": results,
                    }
                ) as response:
                    if response.status == 200:
                        logger.info(f"Conversation saved successfully: {results}")
                        return "Conversation ended and data saved successfully."
                    else:
                        error_text = await response.text()
                        logger.error(f"Failed to save conversation with status {response.status}: {error_text}")
                        return f"Error saving conversation data: {error_text}"
        except Exception as e:
            logger.error(f"Exception while saving conversation: {str(e)}", exc_info=True)
            return f"Error saving conversation data: {str(e)}"


async def entrypoint(ctx: agents.JobContext):
    try:
        # Connect to the room
        await ctx.connect()
        logger.info(f"Connected to room: {ctx.room.name if ctx.room else 'Unknown'}")

        # Initialize agent session
        session = AgentSession(
            llm=openai.realtime.RealtimeModel(),
        )

        # Start the agent session
        await session.start(
            room=ctx.room,
            agent=Assistant(),
        )

        # Generate initial greeting
        await session.generate_reply(
            instructions=(
                "Greet the user warmly, showing enthusiasm about helping them plan a vacation visit. "
                "Express interest in the place they want to visit and ask for details like the destination and preferred date. "
                "Let them know you can help book an appointment slot for their visit."
            )
        )

    except Exception as e:
        if isinstance(e, ValueError):
            logger.error(f"\033[91mValueError: {str(e)}\033[0m", exc_info=True)
        else:
            logger.error(f"Error in entrypoint: {str(e)}", exc_info=True)
        raise


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(
        entrypoint_fnc=entrypoint,
        port=8082  # Use a different port
    ))
