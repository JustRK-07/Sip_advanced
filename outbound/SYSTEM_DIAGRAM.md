# LiveKit SIP AI Agent - System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              LIVEKIT SIP AI AGENT SYSTEM                                │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WEB BROWSER   │    │  NEXT.JS WEB    │    │   LIVEKIT       │    │  AI AGENT       │
│                 │    │    DASHBOARD    │    │    CLOUD        │    │   (PYTHON)      │
│ • Monitor Calls │◄──►│                 │◄──►│                 │◄──►│                 │
│ • View Dashboard│    │ • Campaign Mgmt │    │ • SIP Gateway   │    │ • OpenAI GPT-4  │
│ • Live Transcr. │    │ • Live Stats    │    │ • Room Mgmt     │    │ • Conversation  │
│ • Call Controls │    │ • Real-time Mon │    │ • Audio Stream  │    │ • Transcript    │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         └───────────────────────┼───────────────────────┼───────────────────────┘
                                 │                       │
                                 ▼                       ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │   POSTGRESQL    │    │  PHONE NETWORK  │
                    │    DATABASE     │    │   (PSTN/SIP)    │
                    │                 │    │                 │
                    │ • Campaigns     │    │ • Customer      │
                    │ • Leads         │    │   Phone Lines   │
                    │ • Conversations │    │ • SIP Trunk     │
                    │ • Transcripts   │    │ • Call Routing  │
                    └─────────────────┘    └─────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════

                              📞 CALL FLOW SEQUENCE

1. CAMPAIGN START     │ Dashboard → Create Campaign & Upload Leads
                      │
2. CALL INITIATION    │ API → LiveKit → SIP Gateway → Customer Phone
                      │
3. CALL CONNECTION    │ Customer Answers → LiveKit Room Created
                      │
4. AI AGENT JOIN      │ Python Agent → Joins LiveKit Room
                      │
5. CONVERSATION       │ AI ↔ Customer (Real-time Audio & Transcript)
                      │
6. LIVE MONITORING    │ Dashboard Shows Live Call + Transcript
                      │
7. CALL COMPLETION    │ Hang-up Detection → Update Database → Dashboard

═══════════════════════════════════════════════════════════════════════════════════════

                            🏗️ COMPONENT BREAKDOWN

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  FRONTEND LAYER                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  RealTimeDashboard.tsx        CallMonitorPopup.tsx        CampaignManager.tsx         │
│  ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐        │
│  │ • Live Stats    │          │ • Audio Control │          │ • Create Campaign│        │
│  │ • Active Calls  │          │ • Live Transcript│         │ • Upload Leads  │        │
│  │ • Recent Outcomes│         │ • Participant   │          │ • Manage Scripts │        │
│  │ • Hang-up Detect│          │   Monitoring    │          │ • Start Campaign │        │
│  └─────────────────┘          └─────────────────┘          └─────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  API LAYER (tRPC)                                       │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│     campaign.ts Router                           livekit.ts Router                     │
│  ┌─────────────────────────┐                  ┌─────────────────────────┐              │
│  │ • getOverallStats()     │                  │ • getListenToken()      │              │
│  │ • makeCall()            │                  │ • getConversationTrans()│              │
│  │ • handleCallHangup()    │                  │ • makeCall()            │              │
│  │ • markCallCompleted()   │                  │                         │              │
│  │ • autoCompleteStale()   │                  │                         │              │
│  └─────────────────────────┘                  └─────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              AI AGENT LAYER (PYTHON)                                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│                             CampaignAgent Class                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │ • on_transcript() - Handle customer speech                                      │   │
│  │ • save_conversation_transcript() - Save real-time transcript                   │   │
│  │ • analyze_loan_interest() - Determine customer interest                        │   │
│  │ • handle_participant_disconnect() - Detect hang-ups                           │   │
│  │ • transfer_to_agent() - Connect to human agent                                │   │
│  │ • update_call_status() - Track call progress                                  │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               DATABASE SCHEMA                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│    Campaign Table              Lead Table                 Conversation Table           │
│  ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐            │
│  │ • id (PK)       │   ┌────│ • id (PK)       │   ┌────│ • id (PK)       │            │
│  │ • name          │   │    │ • phone_number  │   │    │ • lead_id (FK)  │            │
│  │ • status        │   │    │ • name          │   │    │ • campaign_id   │            │
│  │ • script        │   │    │ • email         │   │    │ • status        │            │
│  │ • created_at    │   │    │ • status        │   │    │ • call_start    │            │
│  └─────────────────┘   │    │ • campaign_id   │   │    │ • call_end      │            │
│           │             │    └─────────────────┘   │    │ • duration      │            │
│           └─────────────┘             │            │    │ • results (JSON)│            │
│                                       └────────────┘    └─────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════

                            🔄 REAL-TIME DATA FLOW

┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ AI AGENT    │───►│ API CALLS   │───►│ DATABASE    │───►│ DASHBOARD   │
│ Transcript  │    │ Save Data   │    │ Updates     │    │ Auto-Refresh│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ LiveKit     │    │ tRPC        │    │ Prisma ORM  │    │ React Query │
│ Events      │    │ Mutations   │    │ Queries     │    │ Polling     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘

        ┌─────────────────────────────────────────────────────────────┐
        │                 UPDATE FREQUENCIES                           │
        ├─────────────────────────────────────────────────────────────┤
        │ • Live Transcript: Every 5 seconds                          │
        │ • Dashboard Stats: Every 3 seconds                          │
        │ • Hang-up Detection: Real-time (LiveKit events)             │
        │ • Stale Call Cleanup: Every 2 minutes                       │
        │ • Relative Time Updates: Every 30 seconds                   │
        └─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════

                              🚀 KEY FEATURES

📞 AI-POWERED CALLS          🎧 LIVE MONITORING           📝 REAL-TIME TRANSCRIPT
• Automated outbound calls   • Listen to live calls       • Live conversation text
• Intelligent conversation  • Audio level indicators     • Speaker identification
• Lead qualification        • Participant tracking       • Timestamp tracking
• Call outcome tracking     • Connection status          • Auto-scroll interface

📊 PROFESSIONAL DASHBOARD    🛠️ ADVANCED FEATURES         🔐 SECURITY & RELIABILITY
• Campaign management       • Hang-up detection          • Environment variables
• Real-time statistics      • Stale call cleanup         • API key management
• Call history with times   • Manual call controls       • Database encryption
• Lead upload via CSV       • Interest level tracking    • Input validation

═══════════════════════════════════════════════════════════════════════════════════════

                            📋 TECHNOLOGY STACK

FRONTEND           │ BACKEND            │ AI AGENT          │ INFRASTRUCTURE
─────────────────  │ ─────────────────  │ ───────────────── │ ─────────────────
• Next.js 15      │ • Node.js          │ • Python 3.9+    │ • LiveKit Cloud
• TypeScript      │ • tRPC             │ • OpenAI GPT-4    │ • PostgreSQL
• Tailwind CSS    │ • Prisma ORM       │ • LiveKit Agents  │ • Docker Ready
• React Query     │ • PostgreSQL       │ • OpenAI TTS      │ • Environment Config
• Radix UI        │ • LiveKit SDK      │ • Speech-to-Text  │ • Logging & Monitoring

═══════════════════════════════════════════════════════════════════════════════════════
``` 