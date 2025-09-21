from dotenv import load_dotenv
import aiohttp
import json
import logging
import os
from datetime import datetime
from typing import Any, Dict
from openai import AsyncOpenAI
from livekit.api import AccessToken, VideoGrants
from livekit import agents
from livekit.agents import Agent, RoomInputOptions, function_tool, RunContext, AgentSession
from livekit.plugins import openai
import asyncio
from health_server import HealthCheckServer
load_dotenv()

# Custom formatter for colored logs
class ColoredFormatter(logging.Formatter):
    """Custom formatter to add colors to log levels"""
    green = '\033[92m'
    red = '\033[91m'
    yellow = '\033[93m'
    reset = '\033[0m'
    
    def format(self, record):
        if record.levelno == logging.INFO:
            record.msg = f"{self.green}{record.msg}{self.reset}"
        elif record.levelno == logging.WARNING:
            record.msg = f"{self.yellow}{record.msg}{self.reset}"
        elif record.levelno >= logging.ERROR:
            record.msg = f"{self.red}{record.msg}{self.reset}"
        return super().format(record)

# Set up logging with custom formatter
logger = logging.getLogger("campaign-agent")
handler = logging.StreamHandler()
handler.setFormatter(ColoredFormatter('%(message)s'))
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# Get API URL from environment variable or default to localhost:3010
API_URL = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:3025")

# Initialize AsyncOpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def create_token(room_name: str, identity: str) -> str:
    """Create a token with the necessary permissions."""
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")
    
    if not api_key or not api_secret:
        raise ValueError("LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set in .env file")
    
    # Create token with all required permissions
    at = AccessToken(api_key=api_key, api_secret=api_secret)
    at.name = "AI Agent"
    at.identity = identity
    at.video = VideoGrants(
        room=room_name,
        room_join=True,
        room_admin=True,  # Add admin permission to access metadata
        room_create=True
    )
    
    return at.to_jwt()

async def check_openai_credits():
    """Check OpenAI API key and credits."""
    logger.info("Checking OpenAI API key and credits...")
    try:
        # Try a simple API call to check if the key is valid and has credits
        await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "test"}],
            max_tokens=1
        )
        logger.info("OpenAI API check successful - key is valid and has credits")
        return True, None
    except Exception as e:
        error_msg = str(e)
        if "authentication" in error_msg.lower():
            logger.error(f"OpenAI Authentication Error: {error_msg}")
            return False, "OpenAI API key is invalid or not set"
        elif "rate limit" in error_msg.lower():
            logger.error(f"OpenAI Rate Limit Error (possible insufficient funds): {error_msg}")
            return False, "OpenAI rate limit exceeded - possible insufficient funds"
        else:
            logger.error(f"Unexpected OpenAI API Error: {error_msg}", exc_info=True)
            return False, f"OpenAI API error: {error_msg}"

class CampaignAgent(agents.Agent):
    def __init__(self, campaign_id: str, lead_id: str, script: str, lead_data: dict = None) -> None:
        super().__init__(
            instructions=(
                f"{script}\n\n"
                "You are a loan qualification agent for a campaign. Your objectives are:\n"
                "1. Determine call outcome: ANSWERED, VOICEMAIL, BUSY, NO_ANSWER\n"
                "2. If answered, qualify loan interest: INTERESTED, NOT_INTERESTED, CALLBACK_REQUESTED\n"
                "3. Gather lead information and update campaign status\n"
                "4. Handle different scenarios professionally\n\n"
                "Call Handling Guidelines:\n"
                "- If call is answered: Proceed with loan qualification\n"
                "- If voicemail: Leave professional message and mark as VOICEMAIL\n"
                "- If busy/no answer: Mark appropriately for retry\n"
                "- Track all interactions for campaign dashboard\n"
                "- Be professional and courteous\n"
                "- Ask about their current financial needs\n"
                "- Listen for loan interest indicators\n"
                "- Use update_call_status to track progress\n"
                "- Use mark_lead_interest to flag interest level\n"
                "- If interested, use transfer_to_agent to connect with human\n"
                "- Always acknowledge what the user says before proceeding"
            )
        )
        self.campaign_id = campaign_id
        self.lead_id = lead_id
        self.lead_data = lead_data or {}
        self.conversation_data = {}
        self.call_status = "INITIATED"  # INITIATED, ANSWERED, VOICEMAIL, BUSY, NO_ANSWER, COMPLETED
        self.interest_status = "UNKNOWN"  # INTERESTED, NOT_INTERESTED, CALLBACK_REQUESTED, UNKNOWN
        self.conversation_state = "greeting"
        self.call_duration = 0
        self.call_start_time = datetime.now()
        self.qualification_complete = False
        self.last_response_time = datetime.now()
        
        logger.info(f"[AGENT INIT] Project/Campaign: {campaign_id}, Lead: {lead_id}, Lead Data: {self.lead_data}")

    async def on_transcript(self, transcript: str) -> None:
        """Handle incoming transcripts from the user."""
        try:
            logger.info(f"\033[92mReceived transcript: {transcript}\033[0m")
            self.last_response_time = datetime.now()
            
            # Mark call as answered if we receive a transcript
            if self.call_status == "INITIATED":
                await self.update_call_status("ANSWERED", "Call was answered by lead")
            
            # Save the user's transcript to conversation data
            await self.save_conversation_transcript("Customer", transcript)
            
            # Analyze transcript for loan interest
            await self.analyze_loan_interest(transcript)
            
            # Update conversation state based on user input
            if self.conversation_state == "greeting":
                self.conversation_state = "loan_inquiry"
                logger.info("Moving to loan inquiry phase")
            elif self.conversation_state == "loan_inquiry" and self.interest_status != "UNKNOWN":
                self.conversation_state = "qualification"
                logger.info(f"Moving to qualification phase - Interest: {self.interest_status}")
            
            # Log the current state
            logger.info(f"Current conversation state: {self.conversation_state}")
            logger.info(f"Interest status: {self.interest_status}")
            logger.info(f"Call status: {self.call_status}")

            # Ensure we respond to the user
            await self.respond_to_user(transcript)
            
        except Exception as e:
            logger.error(f"\033[91mError processing transcript: {str(e)}\033[0m", exc_info=True)

    async def save_conversation_transcript(self, speaker: str, text: str) -> None:
        """Save transcript entry to the conversation data."""
        try:
            # Initialize transcript list if it doesn't exist
            if 'transcript' not in self.conversation_data:
                self.conversation_data['transcript'] = []
            
            # Create transcript entry
            transcript_entry = {
                "timestamp": datetime.now().isoformat(),
                "speaker": speaker,
                "text": text,
                "type": "customer_message" if speaker == "Customer" else "agent_message"
            }
            
            # Add to transcript list
            self.conversation_data['transcript'].append(transcript_entry)
            
            # Also save the latest transcript to database in real-time
            await self.save_transcript_to_database()
            
            logger.info(f"\033[92mSaved transcript entry - {speaker}: {text[:50]}...\033[0m")
            
        except Exception as e:
            logger.error(f"\033[91mError saving transcript: {str(e)}\033[0m", exc_info=True)

    async def save_agent_response(self, response_text: str) -> None:
        """Save agent response to transcript."""
        try:
            await self.save_conversation_transcript("Agent", response_text)
        except Exception as e:
            logger.error(f"\033[91mError saving agent response: {str(e)}\033[0m", exc_info=True)

    async def save_transcript_to_database(self) -> None:
        """Save the current transcript to the database in real-time."""
        try:
            # Update conversation with latest transcript data
            transcript_data = {
                "transcript": self.conversation_data.get('transcript', []),
                "last_updated": datetime.now().isoformat(),
                "conversation_state": self.conversation_state,
                "interest_status": self.interest_status,
                "call_status": self.call_status
            }
            
            async with aiohttp.ClientSession() as session:
                url = f"{API_URL}/api/trpc/campaign.saveConversation"
                payload = {
                    "campaignId": self.campaign_id,
                    "leadId": self.lead_id,
                    "status": "IN_PROGRESS",  # Keep as in progress until call ends
                    "results": transcript_data,
                }
                
                async with session.post(url, json=payload) as response:
                    if response.status != 200:
                        logger.warning(f"\033[93mFailed to save transcript to DB: {response.status}\033[0m")
                        
        except Exception as e:
            logger.error(f"\033[91mError saving transcript to database: {str(e)}\033[0m", exc_info=True)

    async def analyze_loan_interest(self, transcript: str) -> None:
        """Analyze the transcript to determine loan interest level."""
        try:
            transcript_lower = transcript.lower()
            
            # Interested indicators
            interested_keywords = [
                "yes", "interested", "need money", "need loan", "want loan", 
                "looking for", "definitely", "absolutely", "tell me more",
                "how much", "what rates", "when can", "sign me up"
            ]
            
            # Not interested indicators
            not_interested_keywords = [
                "no", "not interested", "don't need", "no thanks", 
                "not looking", "already have", "not right now", "remove me",
                "don't call", "not a good time", "hang up"
            ]
            
            # Callback requested indicators
            callback_keywords = [
                "call back", "call later", "not a good time", "busy right now",
                "try again", "different time", "later today", "tomorrow"
            ]
            
            if any(keyword in transcript_lower for keyword in interested_keywords):
                await self.mark_lead_interest("INTERESTED", f"Expressed interest: {transcript}")
            elif any(keyword in transcript_lower for keyword in not_interested_keywords):
                await self.mark_lead_interest("NOT_INTERESTED", f"Expressed no interest: {transcript}")
            elif any(keyword in transcript_lower for keyword in callback_keywords):
                await self.mark_lead_interest("CALLBACK_REQUESTED", f"Requested callback: {transcript}")
            
            logger.info(f"\033[92mAnalyzed interest status: {self.interest_status}\033[0m")
            
        except Exception as e:
            logger.error(f"\033[91mError analyzing loan interest: {str(e)}\033[0m", exc_info=True)

    async def respond_to_user(self, user_input: str) -> None:
        """Generate and send a response to the user."""
        try:
            if self.conversation_state == "loan_inquiry":
                if self.interest_status == "UNKNOWN":
                    response_instruction = (
                        f"The user just said: {user_input}\n"
                        "Acknowledge what they said and ask specifically about their interest in loans or financial assistance. "
                        "Try to determine if they need a loan or financial help."
                    )
                else:
                    response_instruction = (
                        f"The user just said: {user_input}\n"
                        f"They seem to be {self.interest_status.lower().replace('_', ' ')} in loans. "
                        "Ask follow-up questions to understand their specific needs and situation."
                    )
            elif self.conversation_state == "qualification":
                if self.interest_status == "INTERESTED":
                    response_instruction = (
                        f"The user just said: {user_input}\n"
                        "They are interested in a loan. Gather basic qualification info like "
                        "loan amount needed, purpose, and timeframe. Then prepare to transfer to human agent."
                    )
                elif self.interest_status == "CALLBACK_REQUESTED":
                    response_instruction = (
                        f"The user just said: {user_input}\n"
                        "They want a callback. Ask for their preferred time and confirm their contact information."
                    )
                else:
                    response_instruction = (
                        f"The user just said: {user_input}\n"
                        "They are not interested. Thank them politely and wrap up the conversation professionally."
                    )
            else:
                response_instruction = (
                    f"The user just said: {user_input}\n"
                    "Respond naturally and guide the conversation toward understanding their loan needs."
                )

            # Generate and send the response
            logger.info(f"\033[92mGenerating response for interest level: {self.interest_status}\033[0m")
            
            # Save the instruction/response to transcript (this will be the agent's response)
            # We'll capture the actual generated response in the reply method
            await self.reply(response_instruction)
            logger.info("\033[92mResponse sent successfully\033[0m")

            # Handle next steps based on interest status
            await self.handle_next_steps()

        except Exception as e:
            logger.error(f"\033[91mError generating response: {str(e)}\033[0m", exc_info=True)

    async def handle_next_steps(self) -> None:
        """Handle next steps based on current interest status."""
        try:
            if self.interest_status == "INTERESTED" and not self.qualification_complete:
                # Wait a moment then transfer to human agent
                await asyncio.sleep(2)
                await self.transfer_to_agent("Lead expressed interest in loan")
                
            elif self.interest_status == "NOT_INTERESTED":
                # End call professionally
                await asyncio.sleep(1)
                await self.end_call("NOT_INTERESTED", "Lead not interested in loan services")
                
            elif self.interest_status == "CALLBACK_REQUESTED":
                # Schedule callback
                await asyncio.sleep(1)
                await self.schedule_callback("Lead requested callback")
                
        except Exception as e:
            logger.error(f"\033[91mError handling next steps: {str(e)}\033[0m", exc_info=True)

    async def reply(self, instruction: str) -> None:
        """Send a reply using the agent's context and save it to transcript."""
        try:
            # Generate the response using the session
            await self.run_conversation(instruction)
            
            # Note: In a real implementation, you'd capture the actual generated text
            # For now, we'll save a placeholder that gets replaced by the actual response
            response_placeholder = f"[Agent responding to: {instruction[:100]}...]"
            await self.save_agent_response(response_placeholder)
            
            logger.info("\033[92mReply processed and saved to transcript\033[0m")
        except Exception as e:
            logger.error(f"\033[91mError in reply: {str(e)}\033[0m", exc_info=True)

    async def generate_response(self, user_input: str) -> None:
        """Generate an appropriate response based on the conversation state."""
        try:
            if self.conversation_state == "discovery":
                response = await self.handle_discovery_phase(user_input)
            elif self.conversation_state == "qualification":
                response = await self.handle_qualification_phase(user_input)
            else:
                response = await self.handle_general_conversation(user_input)

            logger.info(f"\033[92mGenerated response for state {self.conversation_state}\033[0m")
            
        except Exception as e:
            logger.error(f"\033[91mError generating response: {str(e)}\033[0m", exc_info=True)

    async def handle_discovery_phase(self, user_input: str) -> str:
        """Handle the discovery phase of the conversation."""
        try:
            # Save important information from user input
            await self.save_conversation_data(f"discovery_response_{datetime.now().timestamp()}", user_input)
            
            # Move to qualification phase if we have enough information
            if len(self.conversation_data) >= 3:
                self.conversation_state = "qualification"
                logger.info("Moving to qualification phase")
                
            return "Continue gathering information and asking relevant questions"
        except Exception as e:
            logger.error(f"\033[91mError in discovery phase: {str(e)}\033[0m", exc_info=True)
            return "Continue with general conversation"

    async def handle_qualification_phase(self, user_input: str) -> str:
        """Handle the qualification phase of the conversation."""
        try:
            # Save qualification information
            await self.save_conversation_data(f"qualification_response_{datetime.now().timestamp()}", user_input)
            return "Assess interest level and determine next steps"
        except Exception as e:
            logger.error(f"\033[91mError in qualification phase: {str(e)}\033[0m", exc_info=True)
            return "Continue with general conversation"

    async def handle_general_conversation(self, user_input: str) -> str:
        """Handle general conversation flow."""
        try:
            await self.save_conversation_data(f"general_response_{datetime.now().timestamp()}", user_input)
            return "Maintain conversation and gather information"
        except Exception as e:
            logger.error(f"\033[91mError in general conversation: {str(e)}\033[0m", exc_info=True)
            return "Continue conversation naturally"

    @function_tool()
    async def check_conversation_flow(
        self,
        context: RunContext
    ) -> str:
        """Check the conversation flow and provide guidance."""
        try:
            time_since_last_response = (datetime.now() - self.last_response_time).seconds
            if time_since_last_response > 5:
                logger.info(f"\033[93mNo response for {time_since_last_response} seconds\033[0m")
                return "Ask an open-ended question to encourage response"
            return "Continue with current conversation flow"
        except Exception as e:
            logger.error(f"\033[91mError checking conversation flow: {str(e)}\033[0m", exc_info=True)
            return "Continue conversation naturally"

    @function_tool()
    async def save_conversation_data(
        self,
        context: RunContext,
        key: str,
        value: str,
    ) -> str:
        """Save important data from the conversation.

        Args:
            key: The type of information being saved (e.g., "interest_level", "callback_time")
            value: The value to save

        Returns:
            Confirmation message
        """
        self.conversation_data[key] = value
        logger.info(f"\033[92mSaved conversation data - {key}: {value}\033[0m")
        return f"Saved {key}: {value}"

    @function_tool()
    async def check_silence(
        self,
        context: RunContext,
        duration: int,
    ) -> str:
        """Check if there's been silence for too long and handle it appropriately.

        Args:
            duration: The duration of silence in seconds

        Returns:
            Instructions on how to proceed
        """
        if duration > 10:  # If silence for more than 10 seconds
            logger.info(f"\033[93mSilence detected for {duration} seconds\033[0m")
            return "Ask if the person is still there and if they have any questions."
        return "Continue with the current conversation flow."

    @function_tool()
    async def end_conversation(
        self,
        context: RunContext,
        outcome: str,
        summary: str,
    ) -> str:
        """End the conversation and save results.

        Args:
            outcome: The final outcome (e.g., "interested", "not_interested", "callback")
            summary: A brief summary of the conversation

        Returns:
            Confirmation message
        """
        results = {
            "outcome": outcome,
            "summary": summary,
            "data": self.conversation_data,
            "final_state": self.conversation_state
        }

        logger.info(f"\033[92mEnding conversation with results: {results}\033[0m")

        try:
            async with aiohttp.ClientSession() as session:
                url = f"{API_URL}/api/trpc/campaign.saveConversation"
                logger.info(f"Sending results to {url}")
                
                async with session.post(
                    url,
                    json={
                        "campaignId": self.campaign_id,
                        "leadId": self.lead_id,
                        "status": "COMPLETED",
                        "results": results,
                    }
                ) as response:
                    if response.status == 200:
                        logger.info(f"\033[92mConversation saved successfully: {results}\033[0m")
                        return "Conversation ended and data saved successfully."
                    else:
                        error_text = await response.text()
                        logger.error(f"\033[91mFailed to save conversation with status {response.status}: {error_text}\033[0m")
                        return f"Error saving conversation data: {error_text}"
        except Exception as e:
            logger.error(f"\033[91mException while saving conversation: {str(e)}\033[0m", exc_info=True)
            return f"Error saving conversation data: {str(e)}"

    @function_tool()
    async def save_loan_interest(
        self,
        context: RunContext,
        interest_level: str,
        notes: str,
    ) -> str:
        """Save the lead's loan interest level and notes.

        Args:
            interest_level: The interest level (high, medium, low)
            notes: Additional notes about their interest

        Returns:
            Confirmation message
        """
        self.conversation_data["loan_interest_level"] = interest_level
        self.conversation_data["loan_interest_notes"] = notes
        self.conversation_data["interest_timestamp"] = datetime.now().isoformat()
        
        logger.info(f"\033[92mSaved loan interest - Level: {interest_level}, Notes: {notes}\033[0m")
        return f"Saved loan interest: {interest_level} - {notes}"

    @function_tool()
    async def transfer_to_agent(
        self,
        context: RunContext,
        reason: str,
    ) -> str:
        """Transfer the call to a human agent.

        Args:
            reason: The reason for transfer

        Returns:
            Confirmation message
        """
        try:
            self.qualification_complete = True
            self.conversation_data["transfer_reason"] = reason
            self.conversation_data["transfer_timestamp"] = datetime.now().isoformat()
            
            logger.info(f"\033[92mTransferring call to human agent. Reason: {reason}\033[0m")
            
            # For now, just call a Python method to simulate transfer
            await self.simulate_agent_transfer(reason)
            
            # Inform the caller about the transfer
            await self.reply(
                "Great! I can see you're interested in a loan. "
                "I'm now connecting you with one of our loan specialists who can help you with the details. "
                "Please hold for just a moment."
            )
            
            return f"Call transferred to human agent: {reason}"
            
        except Exception as e:
            logger.error(f"\033[91mError transferring to agent: {str(e)}\033[0m", exc_info=True)
            return f"Error during transfer: {str(e)}"

    async def simulate_agent_transfer(self, reason: str) -> None:
        """Simulate transferring the call to a human agent (Python method for now)."""
        try:
            logger.info(f"\033[96m=== SIMULATING AGENT TRANSFER ===\033[0m")
            logger.info(f"\033[96mReason: {reason}\033[0m")
            logger.info(f"\033[96mLead ID: {self.lead_id}\033[0m")
            logger.info(f"\033[96mCampaign ID: {self.campaign_id}\033[0m")
            logger.info(f"\033[96mInterest Level: {self.interest_status}\033[0m")
            logger.info(f"\033[96mConversation Data: {self.conversation_data}\033[0m")
            logger.info(f"\033[96m================================\033[0m")
            
            # Here you would implement actual transfer logic:
            # - Save lead status as "TRANSFERRED"
            # - Notify human agents
            # - Route call to available agent
            # - etc.
            
            # For now, just update the lead status
            await self.update_lead_status_for_transfer()
            
        except Exception as e:
            logger.error(f"\033[91mError in simulated transfer: {str(e)}\033[0m", exc_info=True)

    async def update_lead_status_for_transfer(self) -> None:
        """Update the lead status to indicate transfer to human agent."""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{API_URL}/api/trpc/campaign.updateLeadStatus"
                payload = {
                    "id": self.lead_id,
                    "status": "TRANSFERRED_TO_AGENT",
                    "notes": f"Interest level: {self.interest_status}",
                    "conversationData": self.conversation_data
                }
                
                async with session.post(url, json=payload) as response:
                    if response.status == 200:
                        logger.info(f"\033[92mLead {self.lead_id} status updated to TRANSFERRED_TO_AGENT\033[0m")
                    else:
                        error_text = await response.text()
                        logger.error(f"\033[91mFailed to update lead status: {error_text}\033[0m")
                        
        except Exception as e:
            logger.error(f"\033[91mError updating lead status: {str(e)}\033[0m", exc_info=True)

    @function_tool()
    async def update_call_status(
        self,
        context: RunContext,
        status: str,
        notes: str = "",
    ) -> str:
        """Update the call status for campaign tracking.

        Args:
            status: Call status (ANSWERED, VOICEMAIL, BUSY, NO_ANSWER, COMPLETED)
            notes: Additional notes about the call status

        Returns:
            Confirmation message
        """
        try:
            self.call_status = status
            self.call_duration = (datetime.now() - self.call_start_time).seconds
            
            # Save to conversation data
            self.conversation_data["call_status"] = status
            self.conversation_data["call_duration"] = self.call_duration
            self.conversation_data["status_notes"] = notes
            self.conversation_data["status_timestamp"] = datetime.now().isoformat()
            
            logger.info(f"\033[92mUpdated call status: {status} - {notes}\033[0m")
            
            # Send real-time update to dashboard
            await self.send_realtime_update("call_status", {
                "status": status,
                "duration": self.call_duration,
                "notes": notes
            })
            
            return f"Call status updated: {status}"
            
        except Exception as e:
            logger.error(f"\033[91mError updating call status: {str(e)}\033[0m", exc_info=True)
            return f"Error updating call status: {str(e)}"

    @function_tool()
    async def mark_lead_interest(
        self,
        context: RunContext,
        interest_level: str,
        notes: str,
    ) -> str:
        """Mark the lead's interest level for campaign tracking.

        Args:
            interest_level: Interest level (INTERESTED, NOT_INTERESTED, CALLBACK_REQUESTED)
            notes: Notes about their interest

        Returns:
            Confirmation message
        """
        try:
            self.interest_status = interest_level
            self.conversation_data["interest_level"] = interest_level
            self.conversation_data["interest_notes"] = notes
            self.conversation_data["interest_timestamp"] = datetime.now().isoformat()
            
            logger.info(f"\033[92mMarked lead interest: {interest_level} - {notes}\033[0m")
            
            # Send real-time update to dashboard
            await self.send_realtime_update("lead_interest", {
                "interest_level": interest_level,
                "notes": notes
            })
            
            return f"Lead interest marked: {interest_level}"
            
        except Exception as e:
            logger.error(f"\033[91mError marking lead interest: {str(e)}\033[0m", exc_info=True)
            return f"Error marking interest: {str(e)}"

    @function_tool()
    async def handle_voicemail(
        self,
        context: RunContext,
        action: str = "leave_message",
    ) -> str:
        """Handle voicemail scenarios.

        Args:
            action: Action to take (leave_message, hang_up)

        Returns:
            Confirmation message
        """
        try:
            await self.update_call_status("VOICEMAIL", "Reached voicemail")
            
            if action == "leave_message":
                # Leave a professional voicemail message
                voicemail_message = (
                    "Please leave a professional voicemail message about loan services. "
                    "Include callback information and keep it brief and professional."
                )
                await self.reply(voicemail_message)
                
            await self.end_call("VOICEMAIL", "Voicemail message left")
            return "Voicemail handled successfully"
            
        except Exception as e:
            logger.error(f"\033[91mError handling voicemail: {str(e)}\033[0m", exc_info=True)
            return f"Error handling voicemail: {str(e)}"

    @function_tool()
    async def schedule_callback(
        self,
        context: RunContext,
        reason: str,
        preferred_time: str = "",
    ) -> str:
        """Schedule a callback for the lead.

        Args:
            reason: Reason for callback
            preferred_time: Lead's preferred callback time

        Returns:
            Confirmation message
        """
        try:
            callback_data = {
                "reason": reason,
                "preferred_time": preferred_time,
                "scheduled_timestamp": datetime.now().isoformat(),
                "lead_data": self.lead_data
            }
            
            self.conversation_data["callback_scheduled"] = callback_data
            
            logger.info(f"\033[94mCallback scheduled: {reason}\033[0m")
            
            # Send to campaign system
            await self.send_realtime_update("callback_scheduled", callback_data)
            
            # Update lead status
            await self.update_lead_in_campaign("CALLBACK_SCHEDULED", callback_data)
            
            return f"Callback scheduled: {reason}"
            
        except Exception as e:
            logger.error(f"\033[91mError scheduling callback: {str(e)}\033[0m", exc_info=True)
            return f"Error scheduling callback: {str(e)}"

    @function_tool()
    async def end_call(
        self,
        context: RunContext,
        outcome: str,
        summary: str,
    ) -> str:
        """End the call and update campaign status.

        Args:
            outcome: Final outcome (INTERESTED, NOT_INTERESTED, VOICEMAIL, CALLBACK_SCHEDULED)
            summary: Brief summary of the call

        Returns:
            Confirmation message
        """
        try:
            await self.update_call_status("COMPLETED", f"Call ended: {outcome}")
            
            final_results = {
                "outcome": outcome,
                "summary": summary,
                "call_status": self.call_status,
                "interest_status": self.interest_status,
                "call_duration": self.call_duration,
                "conversation_data": self.conversation_data,
                "lead_data": self.lead_data
            }

            logger.info(f"\033[92mEnding call with outcome: {outcome}\033[0m")

            # Update campaign dashboard
            await self.send_realtime_update("call_completed", final_results)
            
            # Update lead in campaign
            await self.update_lead_in_campaign(outcome, final_results)

            return f"Call ended successfully: {outcome}"
            
        except Exception as e:
            logger.error(f"\033[91mError ending call: {str(e)}\033[0m", exc_info=True)
            return f"Error ending call: {str(e)}"

    async def send_realtime_update(self, event_type: str, data: dict) -> None:
        """Send real-time updates to campaign dashboard."""
        try:
            update_payload = {
                "event_type": event_type,
                "campaign_id": self.campaign_id,
                "lead_id": self.lead_id,
                "timestamp": datetime.now().isoformat(),
                "data": data
            }
            
            async with aiohttp.ClientSession() as session:
                url = f"{API_URL}/api/trpc/campaign.realtimeUpdate"
                async with session.post(url, json=update_payload) as response:
                    if response.status == 200:
                        logger.info(f"\033[96mReal-time update sent: {event_type}\033[0m")
                    else:
                        logger.warning(f"\033[93mFailed to send real-time update: {response.status}\033[0m")
                        
        except Exception as e:
            logger.error(f"\033[91mError sending real-time update: {str(e)}\033[0m", exc_info=True)

    async def update_lead_in_campaign(self, status: str, data: dict) -> None:
        """Update lead status in the campaign system."""
        try:
            logger.info(f"\033[92mUpdating lead in campaign: {status}\033[0m")
            
            update_data = {
                "leadId": self.lead_id,
                "campaignId": self.campaign_id,
                "status": status,
                "data": data
            }
            
            async with aiohttp.ClientSession() as session:
                url = f"{API_URL}/api/campaign/updateLeadStatus"
                async with session.post(url, json=update_data) as response:
                    if response.status == 200:
                        logger.info("Lead status updated successfully")
                    else:
                        logger.error(f"Failed to update lead status: {response.status}")
                        
        except Exception as e:
            logger.error(f"\033[91mError updating lead status: {str(e)}\033[0m", exc_info=True)

    async def handle_participant_disconnect(self, participant_identity: str, reason: str = "unknown") -> None:
        """Handle when a participant disconnects (hang-up detection)."""
        try:
            logger.info(f"\033[93mParticipant disconnected: {participant_identity} (reason: {reason})\033[0m")
            
            # Check if it's the customer who hung up (not the agent)
            if not participant_identity.startswith('agent-') and not participant_identity.startswith('listener-'):
                logger.info(f"\033[91mCustomer hang-up detected: {participant_identity}\033[0m")
                
                # Calculate call duration
                call_duration = (datetime.now() - self.call_start_time).seconds
                
                # Mark call as hung up
                await self.update_call_status("HUNG_UP", f"Customer {participant_identity} hung up after {call_duration} seconds")
                
                # Send hang-up notification to API
                await self.notify_call_hangup(participant_identity, reason, call_duration)
                
                # End the conversation with hang-up status
                await self.end_conversation(
                    "hung_up",
                    f"Customer hung up after {call_duration} seconds. Conversation state: {self.conversation_state}, Interest: {self.interest_status}"
                )
            
        except Exception as e:
            logger.error(f"\033[91mError handling participant disconnect: {str(e)}\033[0m", exc_info=True)

    async def notify_call_hangup(self, participant_identity: str, reason: str, duration: int) -> None:
        """Notify the API about a call hang-up."""
        try:
            # Find the conversation ID from the room context
            conversation_id = f"{self.campaign_id}-{self.lead_id}"  # This should match your room naming convention
            
            hangup_data = {
                "callId": conversation_id,
                "hangupReason": reason,
                "participantIdentity": participant_identity,
                "callDuration": duration,
            }
            
            async with aiohttp.ClientSession() as session:
                url = f"{API_URL}/api/trpc/campaign.handleCallHangup"
                logger.info(f"Sending hang-up notification to {url}")
                
                async with session.post(url, json=hangup_data) as response:
                    if response.status == 200:
                        logger.info(f"\033[92mHang-up notification sent successfully\033[0m")
                    else:
                        error_text = await response.text()
                        logger.error(f"\033[91mFailed to send hang-up notification: {response.status} - {error_text}\033[0m")
                        
        except Exception as e:
            logger.error(f"\033[91mError sending hang-up notification: {str(e)}\033[0m", exc_info=True)

async def entrypoint(ctx: agents.JobContext):
    lead_id = None
    try:
        logger.info("Entrypoint Called")
        livekit_url = os.getenv("LIVEKIT_URL", "NOT SET")
        logger.info(f"[LIVEKIT] Server URL: {livekit_url}")
        logger.info(f"[ENTRYPOINT] Room: {getattr(ctx.room, 'name', None)} | Room Metadata: {getattr(ctx.room, 'metadata', None)}")
        
        # Initialize the OpenAI client inside the entrypoint
        client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        logger.info("OpenAI client initialized")

        # Check OpenAI credits first
        is_api_valid, api_error = await check_openai_credits()
        if not is_api_valid:
            raise ValueError(f"OpenAI API issue: {api_error}")
        
        # Generate a new token with proper permissions
        token = create_token(ctx.room.name, f"agent-{datetime.now().timestamp()}")
        logger.info("Generated new token with admin permissions")
        
        ctx.token = token
        
        try:
            logger.info("Attempting to connect to LiveKit...")
            await ctx.connect()
            logger.info("Successfully connected to LiveKit")
            logger.info(f"[ROOM JOINED] LiveKit Server: {livekit_url}")
            logger.info(f"[ROOM JOINED] Room name: {ctx.room.name}")
            logger.info(f"[ROOM JOINED] Room connection state: {getattr(ctx.room, 'connection_state', 'Unknown')}")
            logger.info(f"[ROOM JOINED] Local participant: {getattr(ctx.room.local_participant, 'identity', 'No local participant')}")
            logger.info(f"[ROOM JOINED] All participants: {[p.identity for p in getattr(ctx.room, 'participants', {}).values()] if hasattr(ctx.room, 'participants') else 'N/A'}")
            
        except Exception as e:
            logger.error(f"\033[91mLiveKit connection error: {str(e)}\033[0m", exc_info=True)
            raise

        # Debug room metadata
        logger.info(f"Room object: {ctx.room}")
        logger.info(f"Room metadata raw: {repr(ctx.room.metadata) if ctx.room else 'No room'}")
        logger.info(f"Room metadata type: {type(ctx.room.metadata) if ctx.room else 'No room'}")
        logger.info(f"Room metadata length: {len(ctx.room.metadata) if ctx.room and ctx.room.metadata else 'N/A'}")

        if not ctx.room:
            logger.error("Room object is None")
            raise ValueError("Room not available")

        # Handle missing or empty metadata (for test calls)
        if not ctx.room.metadata or ctx.room.metadata.strip() == "":
            logger.warning("Room metadata is empty - using test call defaults")
            
            # Use default test values
            campaign_id = "test-campaign"
            lead_id = f"test-lead-{datetime.now().timestamp()}"
            script = (
                "Hi, this is a test call from our loan department. "
                "I'm calling to see if you might be interested in learning about loan options we have available. "
                "Are you currently looking for any type of loan or financial assistance?"
            )
            
            # Test lead data
            lead_data = {
                "name": "Test Lead",
                "email": "test@example.com", 
                "phone": "+1234567890",
                "call_count": 0,
                "source": "test_campaign"
            }
            
            logger.info(f"Using test defaults - Campaign: {campaign_id}, Lead: {lead_id}")
            
        else:
            try:
                metadata = json.loads(ctx.room.metadata)
                logger.info(f"Parsed metadata: {metadata}")
                
                campaign_id = metadata.get("campaignId")
                lead_id = metadata.get("leadId")
                script = metadata.get("script")
                lead_data = metadata.get("leadData", {})
                
                logger.info(f"Extracted campaignId: {campaign_id}")
                logger.info(f"Extracted leadId: {lead_id}")
                logger.info(f"Lead data: {lead_data}")
                logger.info("Script loaded successfully")

                if not campaign_id:
                    raise ValueError("Missing campaignId in metadata")
                if not lead_id:
                    raise ValueError("Missing leadId in metadata")
                if not script:
                    raise ValueError("Missing script in metadata")

            except json.JSONDecodeError as e:
                logger.error(f"\033[91mFailed to parse metadata JSON: {str(e)}\033[0m", exc_info=True)
                raise ValueError(f"Invalid metadata format: {str(e)}")
            except Exception as e:
                logger.error(f"\033[91mError parsing metadata: {str(e)}\033[0m", exc_info=True)
                raise ValueError(f"Error parsing metadata: {str(e)}")

        try:
            # Initialize agent session with configuration
            logger.info("Initializing agent session...")
            session = AgentSession(
                llm=openai.realtime.RealtimeModel(),
                tts=openai.TTS(
                    client=client,
                    model="tts-1-hd",
                    voice="nova"
                )
            )

            logger.info("Starting agent session...")
            campaign_agent = CampaignAgent(campaign_id, lead_id, script, lead_data)
            
            # Add room event listeners for hang-up detection
            def on_participant_disconnected(participant):
                logger.info(f"\033[93mRoom event: Participant disconnected - {participant.identity}\033[0m")
                asyncio.create_task(campaign_agent.handle_participant_disconnect(
                    participant.identity, 
                    "participant_left"
                ))
            
            def on_room_disconnected(reason=None):
                logger.info(f"\033[93mRoom event: Room disconnected - {reason}\033[0m")
                # Handle room-level disconnection
                if reason and reason != "user_initiated":
                    asyncio.create_task(campaign_agent.handle_participant_disconnect(
                        "unknown_participant", 
                        f"room_disconnected: {reason}"
                    ))
            
            # Register event listeners
            ctx.room.on("participant_disconnected", on_participant_disconnected)
            ctx.room.on("disconnected", on_room_disconnected)
            logger.info("Room event listeners registered for hang-up detection")
            logger.info(f"[EVENTS] Listening for participant join/disconnect in room: {ctx.room.name}")
            
            await session.start(
                room=ctx.room,
                agent=campaign_agent,
            )
            logger.info("Agent session started successfully")

            # Initial greeting based on script and lead data
            logger.info("Generating initial greeting...")
            try:
                lead_name = lead_data.get("name", "there")
                initial_instruction = (
                    f"You are starting a new conversation with {lead_name} for a loan qualification campaign. "
                    "1. Introduce yourself as a loan specialist from your company\n"
                    "2. Address them by name if available\n"
                    "3. Explain that you're calling to see if they're interested in loan options\n"
                    "4. Ask directly if they're currently looking for any type of loan or financial assistance\n"
                    "5. Keep it brief and professional\n\n"
                    "Your goal is to quickly determine their call outcome and interest level. "
                    "Be direct but friendly about the loan purpose of your call. "
                    "Use update_call_status to track that the call was answered."
                )
                await session.generate_reply(instructions=initial_instruction)
                logger.info("Initial greeting generated and sent successfully")
                
                # Set up continuous conversation monitoring
                while True:
                    await asyncio.sleep(2)  # Check every 2 seconds
                    time_since_last = (datetime.now() - campaign_agent.last_response_time).seconds
                    if time_since_last > 10:
                        logger.info("\033[93mNo response detected, checking conversation flow...\033[0m")
                        await campaign_agent.check_conversation_flow(None)
                    
            except Exception as e:
                logger.error(f"\033[91mError in initial greeting: {str(e)}\033[0m", exc_info=True)
                raise ValueError(f"Failed to generate initial greeting: {str(e)}")

        except Exception as e:
            logger.error(f"\033[91mError in session initialization or greeting: {str(e)}\033[0m", exc_info=True)
            raise ValueError(f"Error in session initialization or greeting: {str(e)}")

    except Exception as e:
        if isinstance(e, ValueError):
            logger.error(f"\033[91mValueError: {str(e)}\033[0m", exc_info=True)
        else:
            logger.error(f"\033[91mError in entrypoint: {str(e)}\033[0m", exc_info=True)
        
        try:
            if lead_id:
                async with aiohttp.ClientSession() as session:
                    url = f"{API_URL}/api/trpc/campaign.updateLeadStatus"
                    await session.post(
                        url,
                        json={
                            "id": lead_id,
                            "status": "FAILED",
                            "errorReason": str(e),
                        }
                    )
                    logger.info(f"Updated lead {lead_id} status to FAILED")
        except Exception as update_error:
            logger.error(f"\033[91mFailed to update lead status: {str(update_error)}\033[0m", exc_info=True)
        raise

# Global health server instance
health_server = HealthCheckServer(port=8081)

# Start health server in background
async def start_health_server_task():
    await health_server.start()
    logger.info("Health check server started on http://localhost:8081/health")

# Modified entrypoint to update health status
async def entrypoint_with_health(ctx: RunContext):
    # Store agent ID in a file for the web UI to read
    try:
        agent_info = {
            "worker_id": getattr(ctx.worker, 'id', 'unknown') if hasattr(ctx, 'worker') else 'unknown',
            "livekit_url": os.getenv("LIVEKIT_URL"),
            "timestamp": datetime.now().isoformat()
        }
        with open('/tmp/livekit_agent_status.json', 'w') as f:
            json.dump(agent_info, f)
        logger.info(f"Agent status written: {agent_info['worker_id']}")
    except Exception as e:
        logger.error(f"Failed to write agent status: {e}")
    
    # Update health server status
    if health_server:
        health_server.update_status(
            is_connected=True,
            worker_id=ctx.worker.id if hasattr(ctx, 'worker') else None,
            livekit_url=os.getenv("LIVEKIT_URL")
        )
    
    # Call the original entrypoint
    return await entrypoint(ctx)

if __name__ == "__main__":
    # Start health server in background
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.create_task(start_health_server_task())
    
    # Run the agent with modified entrypoint
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint_with_health))