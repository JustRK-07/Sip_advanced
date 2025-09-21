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
- **Real-Time Dashboard**: Live call statistics and performance metrics
- **Call Recording**: Conversation tracking and analysis
- **Lead Management**: Comprehensive lead tracking and status updates
- **Campaign Analytics**: Detailed campaign performance insights

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js UI    │    │  Python AI      │    │   Twilio SIP    │
│   Dashboard     │◄──►│   Agent         │◄──►│   Trunking      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Prisma DB     │    │   LiveKit       │    │   OpenAI        │
│   (SQLite)      │    │   Cloud         │    │   GPT-4         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Git
- Twilio Account
- LiveKit Cloud Account
- OpenAI API Key

### 1. Clone the Repository
```bash
git clone git@github.com:JustRK-07/Sip_advanced.git
cd Sip_advanced
```

### 2. Setup Web Dashboard
```bash
cd outbound/web-ui
npm install
```

### 3. Setup AI Agent
```bash
cd ../ai-agent
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Configure Environment Variables

#### Web UI Environment (`outbound/web-ui/.env`)
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
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXT_PUBLIC_API_URL="http://localhost:3025"
```

#### AI Agent Environment (`outbound/ai-agent/.env`)
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

### 5. Initialize Database
```bash
cd outbound/web-ui
npx prisma generate
npx prisma db push
```

### 6. Start the Services

#### Start Web Dashboard
```bash
cd outbound/web-ui
npm run dev
```

#### Start AI Agent
```bash
cd outbound/ai-agent
source venv/bin/activate
python campaign_agent.py dev
```

### 7. Access the Application
- **Web Dashboard**: http://localhost:3025
- **Campaigns**: http://localhost:3025/campaigns
- **Settings**: http://localhost:3025/settings
- **SIP Settings**: http://localhost:3025/sip-settings

## 📱 Usage

### Creating a Campaign
1. Navigate to the Campaigns page
2. Click "Create New Campaign"
3. Enter campaign details and script
4. Add leads with phone numbers
5. Start the campaign

### Making Calls
1. **Test Call**: Uses LiveKit SIP for testing (no real phone call)
2. **Real Call**: Uses Twilio to make actual phone calls
3. Monitor calls in real-time through the dashboard

### Managing Settings
1. Navigate to SIP Settings
2. Configure Twilio credentials
3. Test connection
4. Save settings

## 🔧 Configuration

### Twilio Setup
1. Sign up for Twilio account
2. Get your Account SID and Auth Token
3. Purchase a phone number
4. Set up SIP trunking
5. Configure webhook URLs

### LiveKit Setup
1. Create LiveKit Cloud account
2. Create a new project
3. Get API key and secret
4. Configure SIP trunking
5. Set up webhook endpoints

### OpenAI Setup
1. Get OpenAI API key
2. Ensure sufficient credits
3. Configure model settings
4. Test API connectivity

## 📁 Project Structure

```
Sip_advanced/
├── outbound/
│   ├── web-ui/                 # Next.js dashboard
│   │   ├── src/
│   │   │   ├── components/     # React components
│   │   │   ├── pages/          # Next.js pages
│   │   │   ├── server/         # tRPC API routes
│   │   │   └── utils/          # Utility functions
│   │   ├── prisma/             # Database schema
│   │   └── package.json
│   └── ai-agent/               # Python AI agent
│       ├── campaign_agent.py   # Main agent logic
│       ├── requirements.txt    # Python dependencies
│       └── .env                # Environment variables
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

## 🛠️ Development

### Adding New Features
1. Create feature branch
2. Implement changes
3. Test thoroughly
4. Update documentation
5. Submit pull request

### Database Migrations
```bash
cd outbound/web-ui
npx prisma migrate dev --name your-migration-name
```

### Testing
```bash
# Test web dashboard
cd outbound/web-ui
npm test

# Test AI agent
cd outbound/ai-agent
python -m pytest
```

## 🔒 Security

- All sensitive information is masked in the UI
- Environment variables are properly secured
- API keys are never exposed in client-side code
- Database connections use secure protocols
- All external API calls use HTTPS

## 📊 Monitoring

### Real-Time Metrics
- Active calls count
- Call success rate
- Average call duration
- Campaign performance
- Lead conversion rates

### Logs
- AI agent logs
- Web server logs
- Database queries
- API call logs
- Error tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting guide

## 🎯 Roadmap

- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Call recording playback
- [ ] Integration with CRM systems
- [ ] Mobile app
- [ ] Advanced AI models
- [ ] Voice cloning capabilities
- [ ] Real-time transcription

---

**Built with ❤️ using LiveKit, Twilio, OpenAI, Next.js, and Python**
