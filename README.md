# 🚀 LiveKit SIP AI Agent System

A comprehensive AI-powered call center solution that enables automated phone calls with intelligent conversation handling using LiveKit, Twilio, and OpenAI GPT-4.

## ✨ Features

### 🎯 Core Functionality
- **AI-Powered Calls**: Automated phone calls with intelligent conversation handling
- **Real-Time Monitoring**: Live call monitoring and analytics dashboard
- **Campaign Management**: Create and manage calling campaigns with lead tracking
- **Twilio Integration**: Real phone call capabilities with SIP trunking
- **LiveKit Communication**: High-quality voice communication infrastructure
- **OpenAI GPT-4**: Advanced AI conversation logic and response generation

### 🛡️ Security & Privacy
- **Secure Environment**: All sensitive data is properly masked and protected
- **Environment Variables**: Secure configuration management
- **API Key Protection**: Sensitive credentials are hidden from UI
- **Database Security**: SQLite for local development with Prisma ORM

### 📊 Analytics & Monitoring
- **Real-Time Dashboard**: Live call monitoring and statistics
- **Call Analytics**: Detailed call outcomes and performance metrics
- **Lead Tracking**: Comprehensive lead management and status tracking
- **Conversation Recording**: Full conversation transcripts and analysis

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
│           ▼                       ▼                       ▼         │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │   Database      │    │   Twilio        │    │   OpenAI        │  │
│  │   (SQLite)      │    │   (SIP/PSTN)    │    │   (GPT-4)       │  │
│  │                 │    │                 │    │                 │  │
│  │ • Campaigns     │    │ • Phone Calls   │    │ • AI Responses  │  │
│  │ • Leads         │    │ • SIP Trunking  │    │ • Conversation  │  │
│  │ • Conversations │    │ • Call Routing  │    │   Analysis      │  │
│  │ • Analytics     │    │ • Webhooks      │    │ • Intent        │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

### Frontend (Web Dashboard)
- **Next.js 15.5.3** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **tRPC** - End-to-end typesafe APIs
- **Prisma** - Database ORM
- **React Icons** - Icon library

### Backend (AI Agent)
- **Python 3.9+** - Core AI agent logic
- **LiveKit Agents** - Real-time communication framework
- **OpenAI GPT-4** - AI conversation engine
- **asyncio** - Asynchronous programming
- **aiohttp** - HTTP client/server

### Infrastructure
- **LiveKit Cloud** - Real-time communication platform
- **Twilio** - Voice and SIP services
- **SQLite** - Local database (development)
- **Docker** - Containerization (optional)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- LiveKit Cloud account
- Twilio account with phone number
- OpenAI API key

### 1. Clone the Repository
```bash
git clone https://github.com/JustRK-07/Sip_advanced.git
cd Sip_advanced
```

### 2. Environment Setup

#### Web UI Configuration
```bash
cd outbound/web-ui
cp .env.example .env
```

Edit `.env` with your credentials:
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

#### AI Agent Configuration
```bash
cd outbound/ai-agent
cp .env.example .env
```

Edit `.env` with your credentials:
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

### 3. Install Dependencies

#### Web UI
```bash
cd outbound/web-ui
npm install
```

#### AI Agent
```bash
cd outbound/ai-agent
pip install -r requirements.txt
```

### 4. Database Setup
```bash
cd outbound/web-ui
npx prisma generate
npx prisma db push
```

### 5. Start the Services

#### Web Dashboard (Terminal 1)
```bash
cd outbound/web-ui
npm run dev
```
Access at: http://localhost:3025

#### AI Agent (Terminal 2)
```bash
cd outbound/ai-agent
python main.py
```

## 📖 Usage Guide

### 1. Campaign Management
1. Navigate to the **Campaigns** page
2. Click **"Create New Campaign"**
3. Enter campaign name and AI conversation script
4. Add phone numbers to call
5. Start the campaign

### 2. Making Calls
- **Test Call**: Uses LiveKit SIP for testing (no real phone call)
- **Real Call**: Uses Twilio to make actual phone calls

### 3. Monitoring
- View real-time call statistics on the dashboard
- Monitor active calls and their status
- Review conversation transcripts
- Analyze call outcomes and performance

### 4. Settings Configuration
- **SIP Settings**: Configure Twilio and LiveKit credentials
- **Environment Variables**: View and manage configuration
- **API Keys**: Securely manage sensitive credentials

## 🔧 Configuration

### LiveKit Setup
1. Create a LiveKit Cloud account
2. Create a new project
3. Generate API keys
4. Set up SIP trunk for outbound calls

### Twilio Setup
1. Create a Twilio account
2. Purchase a phone number
3. Set up SIP trunking
4. Configure webhooks for call events

### OpenAI Setup
1. Create an OpenAI account
2. Generate an API key
3. Ensure you have GPT-4 access
4. Set usage limits as needed

## 📁 Project Structure

```
Sip_advanced/
├── README.md                          # This file
├── LICENSE                            # MIT License
├── .gitignore                         # Git ignore rules
├── outbound/                          # Main project directory
│   ├── README.md                      # Detailed project documentation
│   ├── ARCHITECTURE.md                # System architecture details
│   ├── PROJECT_STATUS.md              # Current project status
│   ├── SYSTEM_DIAGRAM.md              # System diagrams
│   ├── TWILIO_SETUP_GUIDE.md          # Twilio configuration guide
│   ├── web-ui/                        # Next.js web dashboard
│   │   ├── src/                       # Source code
│   │   │   ├── components/            # React components
│   │   │   ├── pages/                 # Next.js pages
│   │   │   ├── server/                # tRPC API routes
│   │   │   └── utils/                 # Utility functions
│   │   ├── prisma/                    # Database schema and migrations
│   │   ├── public/                    # Static assets
│   │   └── package.json               # Node.js dependencies
│   ├── ai-agent/                      # Python AI agent
│   │   ├── campaign_agent.py          # Main AI agent logic
│   │   ├── main.py                    # Agent entry point
│   │   ├── requirements.txt           # Python dependencies
│   │   └── .env.example               # Environment template
│   ├── outbound-trunk.json            # LiveKit SIP trunk config
│   └── sip-participant.json           # SIP participant config
└── .env.example                       # Environment template
```

## 🔒 Security

### Environment Variables
- All sensitive data is stored in environment variables
- API keys and secrets are masked in the UI
- Database credentials are encrypted
- Twilio credentials are securely managed

### API Security
- tRPC provides type-safe API endpoints
- Input validation on all API routes
- Rate limiting on sensitive operations
- CORS protection enabled

### Data Protection
- SQLite database for local development
- Prisma ORM for secure database operations
- No sensitive data in client-side code
- Secure credential management

## 🚨 Troubleshooting

### Common Issues

#### 1. "Failed to make real call: twirp error unknown: object cannot be found"
- **Cause**: LiveKit SIP trunk not properly configured
- **Solution**: Verify SIP trunk ID and Twilio credentials in settings

#### 2. "SIP 403 Forbidden" Error
- **Cause**: Incorrect Twilio SIP trunk configuration
- **Solution**: Check Twilio credentials and SIP trunk setup

#### 3. AI Agent Connection Issues
- **Cause**: Incorrect LiveKit endpoint configuration
- **Solution**: Verify LIVEKIT_API_ENDPOINT in ai-agent/.env

#### 4. Database Connection Errors
- **Cause**: SQLite database not initialized
- **Solution**: Run `npx prisma db push` to create database

### Debug Mode
Enable debug logging by setting:
```env
DEBUG=true
LOG_LEVEL=debug
```

## 📈 Performance

### Optimization Features
- **Database Indexing**: Optimized queries with proper indexes
- **Caching**: API response caching for better performance
- **Connection Pooling**: Efficient database connections
- **Real-time Updates**: WebSocket connections for live data

### Monitoring
- **Call Analytics**: Track call success rates and duration
- **Performance Metrics**: Monitor API response times
- **Error Tracking**: Comprehensive error logging
- **Resource Usage**: Monitor CPU and memory usage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation for new features
- Follow the existing code style
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [LiveKit Documentation](https://docs.livekit.io/)
- [Twilio Documentation](https://www.twilio.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

### Community
- [LiveKit Discord](https://discord.gg/livekit)
- [Twilio Community](https://community.twilio.com/)
- [OpenAI Community](https://community.openai.com/)

### Issues
If you encounter any issues, please:
1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed information

## 🎯 Roadmap

### Upcoming Features
- [ ] Multi-language support
- [ ] Advanced call analytics
- [ ] Custom AI model integration
- [ ] Webhook integrations
- [ ] Mobile app support
- [ ] Advanced campaign scheduling
- [ ] A/B testing for scripts
- [ ] CRM integrations

### Version History
- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added real-time monitoring
- **v1.2.0** - Enhanced AI conversation logic
- **v1.3.0** - Improved security and performance

---

**Built with ❤️ using LiveKit, Twilio, OpenAI, and Next.js**
