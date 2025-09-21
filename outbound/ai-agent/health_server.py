import asyncio
from aiohttp import web
import logging
import time

logger = logging.getLogger("health-server")

class HealthCheckServer:
    def __init__(self, port=8080):
        self.port = port
        self.app = web.Application()
        self.runner = None
        self.start_time = time.time()
        self.is_connected = False
        self.worker_id = None
        self.livekit_url = None
        
        # Setup routes
        self.app.router.add_get('/health', self.health_check)
        self.app.router.add_get('/status', self.status_check)
    
    async def health_check(self, request):
        """Simple health check endpoint"""
        return web.json_response({
            'status': 'healthy',
            'timestamp': time.time()
        })
    
    async def status_check(self, request):
        """Detailed status endpoint"""
        uptime = int(time.time() - self.start_time)
        return web.json_response({
            'status': 'online',
            'connected_to_livekit': self.is_connected,
            'worker_id': self.worker_id,
            'livekit_url': self.livekit_url,
            'uptime_seconds': uptime,
            'timestamp': time.time()
        })
    
    def update_status(self, is_connected, worker_id=None, livekit_url=None):
        """Update the agent's connection status"""
        self.is_connected = is_connected
        if worker_id:
            self.worker_id = worker_id
        if livekit_url:
            self.livekit_url = livekit_url
    
    async def start(self):
        """Start the health check server"""
        self.runner = web.AppRunner(self.app)
        await self.runner.setup()
        site = web.TCPSite(self.runner, '0.0.0.0', self.port)
        await site.start()
        logger.info(f"Health check server started on port {self.port}")
    
    async def stop(self):
        """Stop the health check server"""
        if self.runner:
            await self.runner.cleanup()
            logger.info("Health check server stopped")