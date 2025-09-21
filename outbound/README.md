# LiveKit SIP AI Agent System

A comprehensive AI-powered call center solution built with LiveKit, Next.js, and Python for automated loan qualification campaigns. This system enables real-time monitoring, live transcription, and intelligent call handling with professional dashboard management.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LiveKit SIP AI Agent System                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │   Web Dashboard │    │  LiveKit Cloud  │    │   AI Agent      │  │
│  │   (Next.js)     │◄──►│   (SIP/RTC)     │◄──►│   (Python)      │  │
│  │                 │    │                 │    │                 │  │
│  │ • Campaign Mgmt │    │ • SIP Trunk     │    │ • OpenAI GPT    │  │
│  │ • Real-time     │    │ • Room Mgmt     │    │ • Conversation  │  │
│  │   Monitoring    │    │ • Audio Stream  │    │   Logic         │  │
│  │ • Live Transcript│   │ • Participant   │    │ • Transcript    │  │
│  │ • Call Controls │    │   Management    │    │   Capture       │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│           │                       │                       │         │
│           └───────────────────────┼───────────────────────┘         │
│                                   │                                 │
│  ┌─────────────────┐              │              ┌─────────────────┐ │
│  │   Database      │              │              │   External      │ │
│  │   (PostgreSQL)  │              │              │   Phone System  │ │
│  │                 │              │              │                 │ │
│  │ • Campaigns     │              │              │ • SIP Trunk     │ │
│  │ • Leads         │              │              │ • Phone Numbers │ │
│  │ • Conversations │              │              │ • Call Routing  │ │
│  │ • Transcripts   │              │              │                 │ │
│  └─────────────────┘              │              └─────────────────┘ │
│                                   │                                 │
│                    ┌──────────────▼──────────────┐                  │
│                    │         Call Flow           │                  │
│                    │                             │                  │
│                    │ 1. Campaign starts call    │                  │
│                    │ 2. SIP connects customer   │                  │
│                    │ 3. AI agent joins room     │                  │
│                    │ 4. Conversation begins     │                  │
│                    │ 5. Real-time monitoring    │                  │
│                    │ 6. Transcript generation   │                  │
│                    │ 7. Call completion/hangup  │                  │
│                    └─────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
```

## 🚀 Key Features

### 📞 **AI-Powered Call Management**
- **Automated Outbound Calls**: AI agents initiate and manage loan qualification calls
- **Intelligent Conversation Flow**: Dynamic conversation logic based on customer responses
- **Lead Qualification**: Automated assessment of loan interest and customer qualification
- **Call Outcome Tracking**: Comprehensive tracking of call results and lead status

### 🎧 **Real-Time Call Monitoring**
- **Live Call Dashboard**: Monitor active calls in real-time with visual indicators
- **Audio Streaming**: Listen to live calls with volume controls and audio level indicators
- **Participant Tracking**: View all call participants (AI agent, customer, monitors)
- **Connection Status**: Real-time connection health and status monitoring

### 📝 **Live Transcript System**
- **Real-Time Transcription**: Live conversation transcription during calls
- **Speaker Identification**: Automatic differentiation between agent and customer speech
- **Timestamp Tracking**: Precise timing for each conversation entry
- **Auto-Scroll Interface**: Automatically follows conversation flow
- **Database Persistence**: All transcripts saved for future review

### 📊 **Professional Dashboard**
- **Campaign Management**: Create, configure, and manage loan qualification campaigns
- **Lead Upload**: CSV import for bulk lead management
- **Real-Time Statistics**: Live updates on call metrics and conversion rates
- **Call History**: Comprehensive view of recent call outcomes with relative timestamps
- **Hang-Up Detection**: Automatic detection and handling of customer disconnections

### 🛠️ **Advanced Call Features**
- **Hang-Up Detection**: Real-time detection when customers end calls
- **Stale Call Cleanup**: Automatic completion of inactive calls
- **Manual Call Control**: Manual call completion and management controls
- **Interest Level Tracking**: Automated assessment of customer loan interest
- **Transfer Capabilities**: Seamless transfer to human agents when needed

## 🏭 **Technical Stack**

### **Frontend (Web Dashboard)**
- **Framework**: Next.js 15 with TypeScript
- **UI Components**: Tailwind CSS + Radix UI components
- **API Layer**: tRPC for type-safe API calls
- **Real-Time Updates**: React Query for automatic data synchronization
- **Icons**: React Icons (Ant Design icons)

### **Backend (API Server)**
- **Runtime**: Node.js with TypeScript
- **Framework**: tRPC + Prisma ORM
- **Database**: PostgreSQL with JSON support
- **Authentication**: Environment-based API keys
- **LiveKit Integration**: Official LiveKit Server SDK

### **AI Agent (Call Handler)**
- **Language**: Python 3.9+
- **AI Engine**: OpenAI GPT-4 with real-time API
- **Audio Processing**: LiveKit Agents SDK
- **Speech**: OpenAI TTS for natural voice synthesis
- **Conversation Management**: Custom conversation flow logic

### **Infrastructure**
- **Communication**: LiveKit Cloud for SIP/RTC
- **Database**: PostgreSQL with Prisma migrations
- **Environment**: Docker-ready with environment configuration
- **Monitoring**: Built-in logging and error tracking

## 📁 **Project Structure**

```
Inbound/
├── web-ui/                          # Next.js Web Dashboard
│   ├── src/
│   │   ├── components/              # React components
│   │   │   ├── CallMonitorPopup.tsx # Live call monitoring interface
│   │   │   ├── RealTimeDashboard.tsx# Main dashboard with live stats
│   │   │   └── ConversationDetails.tsx # Call history details
│   │   ├── pages/                   # Next.js pages
│   │   │   ├── index.tsx           # Main dashboard page
│   │   │   └── campaigns.tsx       # Campaign management
│   │   ├── server/api/routers/     # tRPC API endpoints
│   │   │   ├── campaign.ts         # Campaign and call management
│   │   │   └── livekit.ts          # LiveKit integration
│   │   └── utils/                  # Utility functions
│   ├── prisma/                     # Database schema and migrations
│   ├── package.json               # Dependencies and scripts
│   └── .env.example              # Environment configuration template
│
├── ai-agent/                      # Python AI Agent
│   ├── campaign_agent.py         # Main AI agent implementation
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example             # Agent environment template
│   └── venv/                    # Virtual environment
│
└── README.md                    # This documentation
```

## 🔧 **Setup Instructions**

### **Prerequisites**
- Node.js 18.18+ or 20+ (for Next.js compatibility)
- Python 3.9+
- PostgreSQL database
- LiveKit Cloud account
- OpenAI API key

### **1. Environment Setup**

Create environment files from templates:

```bash
# Web UI Environment
cp web-ui/.env.example web-ui/.env.local

# AI Agent Environment  
cp ai-agent/.env.example ai-agent/.env
```

Configure the following environment variables:

#### **Web UI (.env.local)**
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/livekit_sip"

# LiveKit Configuration
LIVEKIT_API_ENDPOINT="wss://your-project.livekit.cloud"
LIVEKIT_API_KEY="your-api-key"
LIVEKIT_API_SECRET="your-api-secret"
LIVEKIT_SIP_TRUNK_ID="your-sip-trunk-id"

# Next.js
NEXTAUTH_SECRET="your-nextauth-secret"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

#### **AI Agent (.env)**
```env
# LiveKit Configuration  
LIVEKIT_API_ENDPOINT="wss://your-project.livekit.cloud"
LIVEKIT_API_KEY="your-api-key"
LIVEKIT_API_SECRET="your-api-secret"

# OpenAI Configuration
OPENAI_API_KEY="your-openai-api-key"

# API Integration
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### **2. Database Setup**

```bash
cd web-ui

# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma db push

# Optional: Launch Prisma Studio
npx prisma studio
```

### **3. Web Dashboard Setup**

```bash
cd web-ui

# Install dependencies (if not done above)
npm install

# Start development server
npm run dev
```

The dashboard will be available at `http://localhost:3000`

### **4. AI Agent Setup**

```bash
cd ai-agent

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the AI agent
python campaign_agent.py
```

## 📱 **Usage Guide**

### **Creating a Campaign**

1. **Access Dashboard**: Navigate to `http://localhost:3000`
2. **Create Campaign**: Click "New Campaign" and provide a name
3. **Upload Leads**: Use CSV upload with columns: `phoneNumber`, `name`, `email`
4. **Configure Script**: Set up the conversation script for the AI agent
5. **Start Campaign**: Activate the campaign to begin automated calls

### **Monitoring Live Calls**

1. **Dashboard View**: Monitor the "Live Calls" section for active conversations
2. **Listen to Calls**: Click "Listen" on any active call to open the monitoring popup
3. **View Transcript**: Real-time conversation transcript updates every 5 seconds
4. **Audio Controls**: Adjust volume, mute/unmute, and control audio levels
5. **Call Management**: Complete calls manually or handle hang-ups

### **Managing Call Outcomes**

1. **Recent Outcomes**: View completed calls in the "Recent Call Outcomes" section
2. **Relative Timestamps**: See when calls completed (e.g., "5 mins ago")
3. **Status Indicators**: Color-coded status badges for different call outcomes
4. **Hang-Up Detection**: Automatic processing of customer hang-ups
5. **Stale Call Cleanup**: Automatic completion of inactive calls (>10 minutes)

### **Campaign Analytics**

- **Real-Time Stats**: Active calls, completed calls, interested leads, callbacks
- **Conversion Tracking**: Monitor lead interest levels and qualification rates  
- **Call Duration**: Track average call times and engagement metrics
- **Success Rates**: View completion rates and campaign effectiveness

## 🔍 **API Reference**

### **Campaign Management**
- `POST /api/trpc/campaign.create` - Create new campaign
- `POST /api/trpc/campaign.uploadLeads` - Upload leads via CSV
- `POST /api/trpc/campaign.startCampaign` - Begin automated calling
- `GET /api/trpc/campaign.getOverallStats` - Get dashboard statistics

### **Call Management**
- `POST /api/trpc/campaign.makeCall` - Initiate test call
- `POST /api/trpc/campaign.markCallCompleted` - Manually complete call
- `POST /api/trpc/campaign.handleCallHangup` - Process hang-up detection
- `POST /api/trpc/campaign.autoCompleteStaleCall` - Cleanup stale calls

### **LiveKit Integration**
- `POST /api/trpc/livekit.getListenToken` - Get monitoring token
- `GET /api/trpc/livekit.getConversationTranscript` - Fetch live transcript
- `POST /api/trpc/livekit.makeCall` - Create test call with LiveKit

## 🛡️ **Security Considerations**

- **Environment Variables**: All sensitive data stored in environment variables
- **API Key Management**: Secure storage of LiveKit and OpenAI credentials
- **Database Security**: Parameterized queries prevent SQL injection
- **Access Control**: Token-based authentication for LiveKit rooms
- **Data Privacy**: Conversation data encrypted and stored securely

## 🐛 **Troubleshooting**

### **Common Issues**

1. **Node.js Version Warning**
   ```bash
   # Upgrade Node.js to 18.18+ or 20+
   nvm install 20
   nvm use 20
   ```

2. **Database Connection Issues**
   ```bash
   # Check PostgreSQL is running
   npx prisma db push
   npx prisma generate
   ```

3. **LiveKit Connection Errors**
   - Verify API endpoint and credentials in environment variables
   - Check SIP trunk configuration in LiveKit Cloud
   - Ensure proper firewall settings for WebRTC

4. **AI Agent Not Responding**
   - Verify OpenAI API key has sufficient credits
   - Check Python virtual environment activation
   - Review agent logs for specific error messages

### **Development Tips**

- **Hot Reloading**: Both web dashboard and AI agent support hot reloading
- **Debug Mode**: Set `NODE_ENV=development` for detailed logging
- **Prisma Studio**: Use `npx prisma studio` to inspect database
- **Live Logs**: Monitor browser console and terminal output for real-time debugging

## 📈 **Performance Metrics**

- **Real-Time Updates**: Dashboard refreshes every 3 seconds
- **Transcript Latency**: Live transcription with ~2-3 second delay
- **Call Capacity**: Supports multiple concurrent calls
- **Database Performance**: Optimized queries with proper indexing
- **Auto-Cleanup**: Automatic stale call cleanup every 2 minutes

## 🔮 **Future Enhancements**

- **Advanced Analytics**: Detailed reporting and analytics dashboard
- **Multi-Language Support**: Support for multiple languages in conversations
- **CRM Integration**: Connect with popular CRM systems
- **Advanced AI Models**: Integration with newer OpenAI models
- **Mobile App**: Mobile application for on-the-go monitoring
- **Webhook Support**: Real-time webhook notifications for integrations

## 📄 **License**

This project is proprietary software for internal use.

## 🆘 **Support**

For technical support or questions:
- Review the troubleshooting section above
- Check environment variable configuration
- Verify all dependencies are properly installed
- Monitor logs for specific error messages

---

**Built with ❤️ using LiveKit, Next.js, and OpenAI GPT-4** 