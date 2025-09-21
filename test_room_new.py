from dotenv import load_dotenv
import asyncio
import logging
from livekit import rtc
from livekit.api import AccessToken, VideoGrants
import os
import json

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("room-test")

def create_token(room_name: str, identity: str) -> str:
    """Create a token with the necessary permissions."""
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")
    
    if not api_key or not api_secret:
        raise ValueError("LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set in .env file")
    
    # Create token with all required permissions using method chaining
    at = AccessToken(api_key, api_secret)
    at = at.with_identity(identity)
    at = at.with_name("AI Agent")
    at = at.with_kind("agent")
    at = at.with_grants(VideoGrants(
        room=room_name,
        room_join=True,
        room_admin=True,  # Add admin permission to access metadata
        room_create=True,
        agent=True  # Add agent permission
    ))
    token = at.to_jwt()
    
    return token

async def test_room_connection(room_name: str):
    try:
        # Create a room client
        room = rtc.Room()
        
        # Get LiveKit URL
        url = os.getenv("LIVEKIT_URL")
        if not url:
            raise ValueError("LIVEKIT_URL must be set in .env file")
            
        # Generate token with proper permissions
        token = create_token(room_name, f"test-agent-{room_name}")
        
        logger.info(f"Attempting to connect to room: {room_name}")
        logger.info(f"Using LiveKit URL: {url}")
        
        # Connect to the room
        await room.connect(url, token)
        
        # Log room details
        logger.info(f"Successfully connected to room: {room.name}")
        logger.info(f"Room connection state: {room.connection_state}")
        
        # Check metadata
        if room.metadata:
            try:
                metadata = json.loads(room.metadata)
                logger.info(f"Room metadata: {metadata}")
                # Check required fields
                logger.info("Checking required metadata fields:")
                logger.info(f"- campaignId: {metadata.get('campaignId', 'MISSING')}")
                logger.info(f"- leadId: {metadata.get('leadId', 'MISSING')}")
                logger.info(f"- script: {'PRESENT' if metadata.get('script') else 'MISSING'}")
            except json.JSONDecodeError:
                logger.error(f"Failed to parse metadata: {room.metadata}")
        else:
            logger.error("No metadata available in room")
        
        # Log participants
        logger.info("Current participants:")
        for participant in room.participants.values():
            logger.info(f"- {participant.identity} (state: {participant.connection_state})")
        
        # Disconnect from the room
        await room.disconnect()
        
    except Exception as e:
        logger.error(f"Error testing room connection: {str(e)}", exc_info=True)

if __name__ == "__main__":
    load_dotenv()
    
    # Get room name from command line or use default
    import sys
    room_name = sys.argv[1] if len(sys.argv) > 1 else "test-room"
    
    asyncio.run(test_room_connection(room_name)) 