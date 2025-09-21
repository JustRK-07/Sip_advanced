# 🚨 Troubleshooting Guide

This guide helps you diagnose and fix common issues with the LiveKit SIP AI Agent System.

## 🔍 Quick Diagnostics

### System Health Check
Run this command to check if all services are running:

```bash
# Check if web UI is running
curl -f http://localhost:3025/api/health || echo "Web UI not responding"

# Check if AI agent is running
ps aux | grep "python main.py" | grep -v grep || echo "AI Agent not running"

# Check database
cd outbound/web-ui && npx prisma db push --accept-data-loss || echo "Database issues"
```

## 🚨 Common Issues

### 1. "Failed to make real call: twirp error unknown: object cannot be found"

**Symptoms:**
- Real calls fail with twirp error
- Test calls work fine
- Error in web UI console

**Causes:**
- LiveKit SIP trunk not properly configured
- Incorrect SIP trunk ID
- Twilio credentials mismatch

**Solutions:**

1. **Verify SIP Trunk Configuration:**
   ```bash
   # Check your LiveKit dashboard
   # Go to SIP → Trunks
   # Verify the trunk ID matches your .env file
   ```

2. **Update SIP Trunk ID:**
   ```bash
   # In outbound/web-ui/.env
   LIVEKIT_SIP_TRUNK_ID="your-correct-trunk-id"
   
   # In outbound/sip-participant.json
   {
     "sip_trunk_id": "your-correct-trunk-id",
     ...
   }
   ```

3. **Recreate SIP Trunk:**
   ```bash
   # Delete old trunk in LiveKit dashboard
   # Create new trunk with correct Twilio credentials
   # Update all configuration files
   ```

### 2. "SIP 403 Forbidden" Error

**Symptoms:**
- SIP participant creation fails
- 403 Forbidden error in logs
- Calls cannot be initiated

**Causes:**
- Incorrect Twilio credentials
- SIP trunk authentication issues
- Phone number not properly configured

**Solutions:**

1. **Verify Twilio Credentials:**
   ```bash
   # Test Twilio connection
   curl -X POST https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Calls.json \
     -u YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN \
     -d "To=+1234567890" \
     -d "From=YOUR_TWILIO_NUMBER" \
     -d "Url=http://example.com/twiml"
   ```

2. **Check SIP Trunk Configuration:**
   ```bash
   # In outbound/outbound-trunk.json
   {
     "trunk": {
       "name": "Outbound campaign agent",
       "address": "outbound-campaign-agent.pstn.twilio.com",
       "numbers": ["+19033267692"],
       "authUsername": "YOUR_TWILIO_ACCOUNT_SID",
       "authPassword": "YOUR_TWILIO_AUTH_TOKEN"
     }
   }
   ```

3. **Verify Phone Number:**
   - Ensure phone number is purchased in Twilio
   - Check number has voice capabilities
   - Verify number is not suspended

### 3. AI Agent Connection Issues

**Symptoms:**
- AI agent cannot connect to LiveKit
- "Cannot connect to host" errors
- Agent shows as disconnected

**Causes:**
- Incorrect LiveKit endpoint
- Network connectivity issues
- Invalid API credentials

**Solutions:**

1. **Check Environment Variables:**
   ```bash
   # In outbound/ai-agent/.env
   LIVEKIT_API_ENDPOINT="wss://your-project.livekit.cloud"
   LIVEKIT_API_KEY="your-api-key"
   LIVEKIT_API_SECRET="your-api-secret"
   LIVEKIT_URL="wss://your-project.livekit.cloud"
   ```

2. **Test LiveKit Connection:**
   ```bash
   # Test WebSocket connection
   curl -I "wss://your-project.livekit.cloud"
   
   # Check API credentials
   curl -H "Authorization: Bearer YOUR_API_KEY" \
     "https://your-project.livekit.cloud/v1/room/list"
   ```

3. **Restart AI Agent:**
   ```bash
   cd outbound/ai-agent
   pkill -f "python main.py"
   python main.py
   ```

### 4. Database Connection Errors

**Symptoms:**
- "Database connection failed" errors
- Prisma errors in logs
- Data not persisting

**Causes:**
- SQLite database not initialized
- Database file permissions
- Corrupted database

**Solutions:**

1. **Initialize Database:**
   ```bash
   cd outbound/web-ui
   npx prisma generate
   npx prisma db push
   ```

2. **Check Database File:**
   ```bash
   # Check if database file exists
   ls -la outbound/web-ui/prisma/dev.db
   
   # Check permissions
   chmod 664 outbound/web-ui/prisma/dev.db
   ```

3. **Reset Database:**
   ```bash
   cd outbound/web-ui
   rm prisma/dev.db
   npx prisma db push
   ```

### 5. Port Already in Use

**Symptoms:**
- "Port 3025 is already in use" error
- Web UI cannot start
- EADDRINUSE error

**Solutions:**

1. **Kill Process Using Port:**
   ```bash
   # Find process using port 3025
   lsof -ti:3025
   
   # Kill the process
   lsof -ti:3025 | xargs kill -9
   ```

2. **Use Different Port:**
   ```bash
   # Start with different port
   PORT=3026 npm run dev
   
   # Update environment variables
   NEXT_PUBLIC_API_URL="http://localhost:3026"
   ```

### 6. Module Not Found Errors

**Symptoms:**
- "Module not found" errors
- Import errors in console
- Build failures

**Causes:**
- Missing dependencies
- Incorrect import paths
- Node modules corruption

**Solutions:**

1. **Reinstall Dependencies:**
   ```bash
   cd outbound/web-ui
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check Import Paths:**
   ```bash
   # Ensure imports use @/ instead of ~/
   # Example:
   import { api } from '@/utils/api';
   # Not:
   import { api } from '~/utils/api';
   ```

3. **Clear Next.js Cache:**
   ```bash
   cd outbound/web-ui
   rm -rf .next
   npm run dev
   ```

### 7. OpenAI API Errors

**Symptoms:**
- "OpenAI API error" messages
- AI responses not working
- Authentication failures

**Causes:**
- Invalid API key
- Insufficient credits
- Rate limiting

**Solutions:**

1. **Verify API Key:**
   ```bash
   # Test API key
   curl -H "Authorization: Bearer YOUR_OPENAI_API_KEY" \
     "https://api.openai.com/v1/models"
   ```

2. **Check Account Status:**
   - Verify OpenAI account has credits
   - Check usage limits
   - Ensure GPT-4 access

3. **Update API Key:**
   ```bash
   # In outbound/ai-agent/.env
   OPENAI_API_KEY="your-new-api-key"
   ```

## 🔧 Debug Mode

### Enable Debug Logging

1. **Web UI Debug:**
   ```bash
   # In outbound/web-ui/.env
   DEBUG=true
   LOG_LEVEL=debug
   ```

2. **AI Agent Debug:**
   ```bash
   # In outbound/ai-agent/.env
   DEBUG=true
   LOG_LEVEL=debug
   ```

3. **Restart Services:**
   ```bash
   # Restart both services to apply debug settings
   ```

### Log Locations

- **Web UI Logs**: Terminal running `npm run dev`
- **AI Agent Logs**: Terminal running `python main.py`
- **Database Logs**: Prisma query logs in web UI terminal
- **System Logs**: `/var/log/` (Linux) or Console.app (macOS)

## 🧪 Testing Components

### Test Individual Components

1. **Test Database:**
   ```bash
   cd outbound/web-ui
   npx prisma studio
   # Open http://localhost:5555
   ```

2. **Test LiveKit:**
   ```bash
   # Test room creation
   curl -X POST "https://your-project.livekit.cloud/v1/room/create" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"name": "test-room"}'
   ```

3. **Test Twilio:**
   ```bash
   # Test account info
   curl -u YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN \
     "https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID.json"
   ```

4. **Test OpenAI:**
   ```bash
   # Test API access
   curl -H "Authorization: Bearer YOUR_OPENAI_API_KEY" \
     "https://api.openai.com/v1/models"
   ```

## 📊 Performance Issues

### Slow Response Times

1. **Check Database Performance:**
   ```bash
   # Monitor database queries
   cd outbound/web-ui
   npx prisma studio
   ```

2. **Check API Response Times:**
   ```bash
   # Monitor API calls
   curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3025/api/trpc/campaign.getAll"
   ```

3. **Check Memory Usage:**
   ```bash
   # Monitor memory usage
   top -p $(pgrep -f "node.*next")
   top -p $(pgrep -f "python.*main.py")
   ```

### High CPU Usage

1. **Check for Infinite Loops:**
   - Review AI agent logs
   - Check for recursive calls
   - Monitor database queries

2. **Optimize Database Queries:**
   ```bash
   # Add database indexes
   cd outbound/web-ui
   npx prisma db push
   ```

## 🔒 Security Issues

### API Key Exposure

1. **Check for Exposed Keys:**
   ```bash
   # Search for potential key exposure
   grep -r "sk-" outbound/
   grep -r "AC" outbound/
   ```

2. **Rotate Keys:**
   - Generate new API keys
   - Update environment variables
   - Restart services

### Unauthorized Access

1. **Check Network Security:**
   ```bash
   # Check open ports
   netstat -tulpn | grep :3025
   ```

2. **Verify CORS Settings:**
   ```bash
   # Check CORS configuration in next.config.js
   ```

## 📞 Getting Help

### Before Asking for Help

1. **Check Logs:**
   - Review all error messages
   - Check system logs
   - Verify environment variables

2. **Test Components:**
   - Test each service individually
   - Verify network connectivity
   - Check external service status

3. **Document the Issue:**
   - Note exact error messages
   - Include relevant log snippets
   - Describe steps to reproduce

### Creating an Issue

When creating a GitHub issue, include:

1. **System Information:**
   - OS version
   - Node.js version
   - Python version
   - Browser version

2. **Error Details:**
   - Complete error message
   - Stack trace
   - Relevant log entries

3. **Steps to Reproduce:**
   - Exact commands run
   - Configuration used
   - Expected vs actual behavior

4. **Environment:**
   - Environment variables (masked)
   - Configuration files
   - Network setup

### Emergency Recovery

If the system is completely broken:

1. **Reset Environment:**
   ```bash
   # Backup important data
   cp -r outbound/web-ui/prisma/dev.db backup/
   
   # Reset to clean state
   git checkout HEAD -- outbound/
   npm install
   npx prisma db push
   ```

2. **Restore from Backup:**
   ```bash
   # Restore database
   cp backup/dev.db outbound/web-ui/prisma/
   
   # Restart services
   ```

## ✅ Health Check Script

Create a health check script:

```bash
#!/bin/bash
# health-check.sh

echo "🔍 LiveKit SIP AI Agent System Health Check"
echo "=========================================="

# Check web UI
echo "📱 Web UI Status:"
curl -f http://localhost:3025/api/health > /dev/null 2>&1 && echo "✅ Running" || echo "❌ Not responding"

# Check AI agent
echo "🤖 AI Agent Status:"
ps aux | grep "python main.py" | grep -v grep > /dev/null && echo "✅ Running" || echo "❌ Not running"

# Check database
echo "🗄️ Database Status:"
cd outbound/web-ui && npx prisma db push --accept-data-loss > /dev/null 2>&1 && echo "✅ Connected" || echo "❌ Connection failed"

# Check environment variables
echo "🔐 Environment Variables:"
[ -f "outbound/web-ui/.env" ] && echo "✅ Web UI .env exists" || echo "❌ Web UI .env missing"
[ -f "outbound/ai-agent/.env" ] && echo "✅ AI Agent .env exists" || echo "❌ AI Agent .env missing"

echo "=========================================="
echo "Health check complete!"
```

Run the health check:
```bash
chmod +x health-check.sh
./health-check.sh
```

---

**Remember**: Always backup your data before making significant changes, and test in a development environment first!
