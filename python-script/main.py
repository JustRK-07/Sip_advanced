from dotenv import load_dotenv
import aiohttp
import logging
from typing import Any

from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions, function_tool, RunContext
from livekit.plugins import (
    openai,
    noise_cancellation,
)

load_dotenv()

logger = logging.getLogger("booking-agent")


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions="You are a helpful voice AI assistant. After booking a slot, be sure to confirm the booking details to the user.")
        
    @function_tool()
    async def book_slot(
        self,
        context: RunContext,
        name: str,
        date: str,
    ) -> dict[str, Any]:
        """Book a slot for the user.
        
        Args:
            name: The name of the user booking the slot.
            date: The date for the booking in format YYYY-MM-DD.
        
        """
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "http://127.0.0.1:3000/api/book-slot",
                json={"name": name, "date": date}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"{data}")
                    return f"Great! I've booked an appointment for {name} on {date}. Your booking has been confirmed."
                else:
                    return f"I'm sorry, there was an error booking your appointment. Please try again later."


async def entrypoint(ctx: agents.JobContext):
    await ctx.connect()

    session = AgentSession(
       llm=openai.realtime.RealtimeModel(),
    )

    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    await session.generate_reply(instructions="Greet the user and tell you are here to offer your assistance for YTel. Let them know you can help book appointment slots.")


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))