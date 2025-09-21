# 🛠️ Complete Setup Guide

This guide will walk you through setting up the LiveKit SIP AI Agent System from scratch.

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Node.js 18+** installed ([Download](https://nodejs.org/))
- [ ] **Python 3.9+** installed ([Download](https://python.org/))
- [ ] **Git** installed ([Download](https://git-scm.com/))
- [ ] **LiveKit Cloud account** ([Sign up](https://cloud.livekit.io/))
- [ ] **Twilio account** ([Sign up](https://www.twilio.com/))
- [ ] **OpenAI API key** ([Get API key](https://platform.openai.com/api-keys))

## 🚀 Step-by-Step Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/JustRK-07/Sip_advanced.git
cd Sip_advanced
```

### Step 2: LiveKit Cloud Setup

1. **Create LiveKit Project**
   - Go to [LiveKit Cloud](https://cloud.livekit.io/)
   - Sign up/Login to your account
   - Click "Create Project"
   - Name your project (e.g., "SIP AI Agent")
   - Note down your project details

2. **Get API Credentials**
   - In your project dashboard, go to "API Keys"
   - Create a new API key with the following permissions:
     - `room:create`
     - `room:list`
     - `room:delete`
     - `room:record`
     - `room:admin`
   - Copy the API Key, API Secret, and WebSocket URL

3. **Configure SIP Trunk**
   - Go to "SIP" in your project dashboard
   - Click "Create SIP Trunk"
   - Configure with your Twilio credentials (we'll set up Twilio next)

### Step 3: Twilio Setup

1. **Create Twilio Account**
   - Go to [Twilio Console](https://console.twilio.com/)
   - Sign up for a new account
   - Verify your phone number

2. **Purchase Phone Number**
   - Go to "Phone Numbers" → "Manage" → "Buy a number"
   - Choose a number with voice capabilities
   - Purchase the number

3. **Set Up SIP Trunking**
   - Go to "Elastic SIP Trunking" → "Trunks"
   - Click "Create Trunk"
   - Configure the trunk with your LiveKit SIP domain
   - Note down the Trunk SID

4. **Get Account Credentials**
   - Go to "Account" → "API keys & tokens"
   - Copy your Account SID and Auth Token

### Step 4: OpenAI Setup

1. **Create OpenAI Account**
   - Go to [OpenAI Platform](https://platform.openai.com/)
   - Sign up for an account
   - Add payment method (required for API usage)

2. **Generate API Key**
   - Go to "API Keys" section
   - Click "Create new secret key"
   - Copy the API key (starts with `sk-`)
   - Ensure you have GPT-4 access

### Step 5: Environment Configuration

#### Web UI Environment

```bash
cd outbound/web-ui
cp .env.example .env
```

Edit the `.env` file with your credentials:

```env
# Database
DATABASE_URL="file:./dev.db"

# LiveKit Configuration
LIVEKIT_API_ENDPOINT="wss://your-project.livekit.cloud"
LIVEKIT_API_KEY="your-livekit-api-key"
LIVEKIT_API_SECRET="your-livekit-api-secret"
LIVEKIT_SIP_TRUNK_ID="your-sip-trunk-id"

# Twilio Configuration
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="your-twilio-phone-number"
TWILIO_SIP_TRUNK_SID="your-twilio-sip-trunk-sid"

# Next.js
NEXTAUTH_SECRET="your-nextauth-secret-key-here"
NEXT_PUBLIC_API_URL="http://localhost:3025"
```

#### AI Agent Environment

```bash
cd outbound/ai-agent
cp .env.example .env
```

Edit the `.env` file:

```env
# LiveKit Configuration
LIVEKIT_API_ENDPOINT="wss://your-project.livekit.cloud"
LIVEKIT_API_KEY="your-livekit-api-key"
LIVEKIT_API_SECRET="your-livekit-api-secret"
LIVEKIT_URL="wss://your-project.livekit.cloud"

# OpenAI Configuration
OPENAI_API_KEY="your-openai-api-key"

# API Integration
NEXT_PUBLIC_API_URL="http://localhost:3025"
```

### Step 6: Install Dependencies

#### Web UI Dependencies

```bash
cd outbound/web-ui
npm install
```

#### AI Agent Dependencies

```bash
cd outbound/ai-agent
pip install -r requirements.txt
```

### Step 7: Database Setup

```bash
cd outbound/web-ui
npx prisma generate
npx prisma db push
```

### Step 8: Start the Services

#### Terminal 1: Web Dashboard
```bash
cd outbound/web-ui
npm run dev
```

The web dashboard will be available at: http://localhost:3025

#### Terminal 2: AI Agent
```bash
cd outbound/ai-agent
python main.py
```

## 🧪 Testing Your Setup

### 1. Test Web Dashboard
- Open http://localhost:3025 in your browser
- You should see the dashboard without errors
- Navigate to "Settings" to verify environment variables are loaded

### 2. Test Twilio Connection
- Go to "SIP Settings" in the web dashboard
- Click "Test Connection" to verify Twilio credentials

### 3. Test AI Agent
- Check the AI agent terminal for successful connection messages
- Look for "Entrypoint Called" and LiveKit connection logs

### 4. Test Call Functionality
- Go to "Campaigns" page
- Create a new campaign
- Try a "Test Call" first (uses LiveKit SIP)
- Then try a "Real Call" (uses Twilio)

## 🔧 Configuration Files

### LiveKit SIP Trunk Configuration

Edit `outbound/outbound-trunk.json`:

```json
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

### SIP Participant Configuration

Edit `outbound/sip-participant.json`:

```json
{
  "sip_trunk_id": "YOUR_LIVEKIT_SIP_TRUNK_ID",
  "sip_call_to": "+1234567890",
  "room_name": "test-room",
  "participant_identity": "test-caller",
  "participant_name": "Test Caller",
  "krisp_enabled": true,
  "wait_until_answered": true
}
```

## 🚨 Troubleshooting

### Common Issues and Solutions

#### 1. "Failed to make real call: twirp error unknown: object cannot be found"
**Cause**: LiveKit SIP trunk not properly configured
**Solution**:
- Verify SIP trunk ID in LiveKit dashboard
- Check Twilio credentials in environment variables
- Ensure SIP trunk is active in LiveKit

#### 2. "SIP 403 Forbidden" Error
**Cause**: Incorrect Twilio SIP trunk configuration
**Solution**:
- Verify Twilio Account SID and Auth Token
- Check SIP trunk configuration in Twilio console
- Ensure phone number is properly configured

#### 3. AI Agent Connection Issues
**Cause**: Incorrect LiveKit endpoint configuration
**Solution**:
- Verify LIVEKIT_API_ENDPOINT in ai-agent/.env
- Check API key and secret are correct
- Ensure LiveKit project is active

#### 4. Database Connection Errors
**Cause**: SQLite database not initialized
**Solution**:
```bash
cd outbound/web-ui
npx prisma generate
npx prisma db push
```

#### 5. Port Already in Use
**Cause**: Another service using port 3025
**Solution**:
```bash
# Kill process using port 3025
lsof -ti:3025 | xargs kill -9

# Or use a different port
PORT=3026 npm run dev
```

### Debug Mode

Enable debug logging by adding to your `.env` files:

```env
DEBUG=true
LOG_LEVEL=debug
```

### Log Locations

- **Web UI Logs**: Check terminal running `npm run dev`
- **AI Agent Logs**: Check terminal running `python main.py`
- **Database Logs**: Check Prisma query logs in web UI terminal

## 📞 Making Your First Call

1. **Create a Campaign**
   - Go to "Campaigns" page
   - Click "Create New Campaign"
   - Enter a campaign name
   - Add a conversation script

2. **Add Phone Numbers**
   - Click "Add Lead"
   - Enter a phone number (include country code, e.g., +1234567890)
   - Save the lead

3. **Test the Call**
   - Click "Test Call" to use LiveKit SIP (no real phone call)
   - Click "Real Call" to use Twilio (actual phone call)

4. **Monitor the Call**
   - Watch the real-time dashboard
   - View call status and duration
   - Check conversation transcripts

## 🔒 Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files to version control
   - Use strong, unique API keys
   - Rotate credentials regularly

2. **API Keys**
   - Store all sensitive data in environment variables
   - Use different keys for development and production
   - Monitor API usage and set limits

3. **Database**
   - Use strong database passwords in production
   - Enable database encryption
   - Regular backups

4. **Network Security**
   - Use HTTPS in production
   - Configure proper CORS settings
   - Implement rate limiting

## 📈 Performance Optimization

1. **Database Optimization**
   - Add proper indexes for frequently queried fields
   - Use connection pooling
   - Monitor query performance

2. **API Optimization**
   - Implement caching for frequently accessed data
   - Use pagination for large datasets
   - Optimize database queries

3. **Real-time Updates**
   - Use WebSocket connections efficiently
   - Implement proper error handling
   - Monitor connection stability

## 🆘 Getting Help

If you encounter issues:

1. **Check the logs** for error messages
2. **Verify all credentials** are correct
3. **Test each component** individually
4. **Check the troubleshooting section** above
5. **Create an issue** on GitHub with detailed information

## ✅ Setup Complete!

Once you've completed all steps and tested the functionality, you should have:

- ✅ Web dashboard running on http://localhost:3025
- ✅ AI agent connected to LiveKit
- ✅ Twilio integration working
- ✅ Database initialized and working
- ✅ Test calls functioning properly

You're now ready to start using the LiveKit SIP AI Agent System! 🎉
