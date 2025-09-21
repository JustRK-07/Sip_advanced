# System Architecture Diagrams

## 🏗️ High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        Monitor[Call Monitor Interface]
    end

    subgraph "Web Dashboard (Next.js)"
        UI[React Components]
        API[tRPC API Router]
        DB_Client[Prisma Client]
    end

    subgraph "LiveKit Cloud Platform"
        SIP[SIP Gateway]
        Rooms[Room Management]
        Audio[Audio/Video Streams]
        Participants[Participant Management]
    end

    subgraph "AI Agent Service (Python)"
        Agent[Campaign Agent]
        OpenAI[OpenAI GPT-4]
        TTS[Text-to-Speech]
        Transcript[Transcript Engine]
    end

    subgraph "Database Layer"
        PostgreSQL[(PostgreSQL)]
        Tables[Campaigns, Leads, Conversations]
    end

    subgraph "External Services"
        Phone[Phone Network]
        PSTN[PSTN/SIP Trunk]
    end

    Browser --> UI
    Monitor --> API
    UI --> API
    API --> DB_Client
    DB_Client --> PostgreSQL
    
    API --> Rooms
    Agent --> Rooms
    Rooms --> SIP
    SIP --> PSTN
    PSTN --> Phone
    
    Agent --> OpenAI
    Agent --> TTS
    Agent --> Transcript
    Agent --> API
    
    Audio --> Monitor
    Participants --> UI

    style Browser fill:#e1f5fe
    style Agent fill:#f3e5f5
    style PostgreSQL fill:#e8f5e8
    style LiveKit fill:#fff3e0
```

## 📞 Call Flow Architecture

```mermaid
sequenceDiagram
    participant Dashboard as Web Dashboard
    participant API as tRPC API
    participant DB as PostgreSQL
    participant LK as LiveKit
    participant Agent as AI Agent
    participant Customer as Customer Phone

    Dashboard->>API: Start Campaign
    API->>DB: Create Campaign & Leads
    API->>LK: Create Room with Metadata
    
    loop For each lead
        API->>LK: Create SIP Participant
        LK->>Customer: Initiate Call
        Customer->>LK: Answer/No Answer
        
        alt Call Answered
            LK->>Agent: Room Event (Participant Joined)
            Agent->>LK: Join Room as AI Agent
            Agent->>Customer: Begin Conversation
            
            loop During Conversation
                Customer->>Agent: Speech
                Agent->>API: Save Transcript
                Agent->>Customer: AI Response
                Dashboard->>API: Monitor Live Call
                API->>Dashboard: Live Updates
            end
            
            alt Customer Hangs Up
                Customer->>LK: Disconnect
                LK->>Agent: Participant Disconnected Event
                Agent->>API: Mark as Hung Up
                API->>DB: Update Call Status
            else Conversation Complete
                Agent->>API: Mark as Completed
                API->>DB: Save Results
            end
        else No Answer/Voicemail
            LK->>API: Call Failed
            API->>DB: Mark as No Answer
        end
    end
    
    API->>Dashboard: Campaign Complete
```

## 🔄 Real-Time Data Flow

```mermaid
graph LR
    subgraph "Real-Time Updates"
        LiveCall[Live Calls Monitor]
        Stats[Dashboard Stats]
        Transcript[Live Transcript]
    end

    subgraph "Data Sources"
        Agent[AI Agent Transcript]
        LiveKit[LiveKit Events]
        Database[(Database Changes)]
    end

    subgraph "Update Mechanisms"
        Polling[React Query Polling]
        Events[LiveKit Events]
        API[tRPC Mutations]
    end

    Agent --> API
    LiveKit --> Events
    Database --> Polling
    
    API --> LiveCall
    Events --> Transcript
    Polling --> Stats
    
    LiveCall --> Browser[Browser Display]
    Stats --> Browser
    Transcript --> Browser

    style Agent fill:#f3e5f5
    style LiveCall fill:#e1f5fe
    style Browser fill:#e8f5e8
```

## 🏢 Component Architecture

```mermaid
graph TB
    subgraph "Frontend Components"
        Dashboard[RealTimeDashboard.tsx]
        Monitor[CallMonitorPopup.tsx]
        Campaign[CampaignManager.tsx]
    end

    subgraph "API Layer"
        CampaignAPI[campaign.ts Router]
        LiveKitAPI[livekit.ts Router]
        TRPCCore[tRPC Core]
    end

    subgraph "Database Schema"
        CampaignTable[Campaign Table]
        LeadTable[Lead Table]
        ConversationTable[Conversation Table]
    end

    subgraph "AI Agent Components"
        AgentCore[CampaignAgent Class]
        ConversationFlow[Conversation Logic]
        TranscriptSaver[Transcript Manager]
        HangupDetector[Hangup Detection]
    end

    Dashboard --> CampaignAPI
    Monitor --> LiveKitAPI
    Campaign --> CampaignAPI
    
    CampaignAPI --> TRPCCore
    LiveKitAPI --> TRPCCore
    TRPCCore --> CampaignTable
    TRPCCore --> LeadTable
    TRPCCore --> ConversationTable
    
    AgentCore --> ConversationFlow
    AgentCore --> TranscriptSaver
    AgentCore --> HangupDetector
    AgentCore --> CampaignAPI

    style Dashboard fill:#e1f5fe
    style AgentCore fill:#f3e5f5
    style TRPCCore fill:#fff3e0
```

## 📊 Data Model Relationships

```mermaid
erDiagram
    Campaign ||--o{ Lead : "has many"
    Campaign ||--o{ Conversation : "tracks"
    Lead ||--o{ Conversation : "generates"
    
    Campaign {
        string id PK
        string name
        string status
        string script
        datetime created_at
        datetime updated_at
    }
    
    Lead {
        string id PK
        string phone_number
        string name
        string email
        string status
        string error_reason
        string campaign_id FK
        datetime created_at
    }
    
    Conversation {
        string id PK
        string lead_id FK
        string campaign_id FK
        string status
        datetime call_start_time
        datetime call_end_time
        integer duration
        json results
        datetime created_at
    }
```

## 🔐 Security Architecture

```mermaid
graph TB
    subgraph "Authentication Layer"
        EnvVars[Environment Variables]
        APIKeys[API Key Management]
        Tokens[LiveKit Tokens]
    end

    subgraph "Network Security"
        HTTPS[HTTPS/WSS]
        CORS[CORS Protection]
        Firewall[Firewall Rules]
    end

    subgraph "Data Security"
        Encryption[Data Encryption]
        Sanitization[Input Sanitization]
        Validation[Schema Validation]
    end

    subgraph "Access Control"
        RoomAuth[Room Authentication]
        APIAuth[API Authentication]
        DBAccess[Database Access Control]
    end

    EnvVars --> APIKeys
    APIKeys --> Tokens
    Tokens --> RoomAuth
    
    HTTPS --> CORS
    CORS --> Firewall
    
    Encryption --> Sanitization
    Sanitization --> Validation
    
    RoomAuth --> APIAuth
    APIAuth --> DBAccess

    style EnvVars fill:#ffebee
    style Encryption fill:#e8f5e8
    style RoomAuth fill:#e1f5fe
```

## 🚀 Deployment Architecture

```mermaid
graph TB
    subgraph "Development Environment"
        DevWeb[Next.js Dev Server]
        DevAgent[Python Agent]
        DevDB[(Local PostgreSQL)]
    end

    subgraph "Production Environment"
        ProdWeb[Next.js Production]
        ProdAgent[Python Agent Service]
        ProdDB[(Production PostgreSQL)]
        LoadBalancer[Load Balancer]
    end

    subgraph "External Services"
        LiveKitCloud[LiveKit Cloud]
        OpenAIAPI[OpenAI API]
        SIPProvider[SIP Provider]
    end

    subgraph "Monitoring & Logging"
        Logs[Application Logs]
        Metrics[Performance Metrics]
        Alerts[Error Alerts]
    end

    DevWeb --> DevAgent
    DevAgent --> DevDB
    
    LoadBalancer --> ProdWeb
    ProdWeb --> ProdAgent
    ProdAgent --> ProdDB
    
    ProdWeb --> LiveKitCloud
    ProdAgent --> LiveKitCloud
    ProdAgent --> OpenAIAPI
    LiveKitCloud --> SIPProvider
    
    ProdWeb --> Logs
    ProdAgent --> Logs
    Logs --> Metrics
    Metrics --> Alerts

    style DevWeb fill:#e1f5fe
    style ProdWeb fill:#e8f5e8
    style LiveKitCloud fill:#fff3e0
```

## 📈 Scalability Considerations

```mermaid
graph LR
    subgraph "Horizontal Scaling"
        WebReplicas[Multiple Web Instances]
        AgentReplicas[Multiple AI Agents]
        DBReplicas[Database Replicas]
    end

    subgraph "Performance Optimizations"
        Caching[Response Caching]
        Pooling[Connection Pooling]
        Indexing[Database Indexing]
    end

    subgraph "Resource Management"
        LoadBalancing[Load Distribution]
        AutoScaling[Auto Scaling]
        ResourceLimits[Resource Limits]
    end

    WebReplicas --> LoadBalancing
    AgentReplicas --> ResourceLimits
    DBReplicas --> Pooling
    
    Caching --> Performance[Better Performance]
    Pooling --> Performance
    Indexing --> Performance
    
    LoadBalancing --> AutoScaling
    AutoScaling --> Scalability[High Scalability]
    ResourceLimits --> Scalability

    style Performance fill:#e8f5e8
    style Scalability fill:#e1f5fe
```

## 🔄 Development Workflow

```mermaid
gitgraph
    commit id: "Initial Setup"
    branch feature/dashboard
    commit id: "Create Dashboard"
    commit id: "Add Real-time Updates"
    checkout main
    merge feature/dashboard
    
    branch feature/ai-agent
    commit id: "Implement AI Agent"
    commit id: "Add Transcript Capture"
    checkout main
    merge feature/ai-agent
    
    branch feature/monitoring
    commit id: "Live Call Monitoring"
    commit id: "Hangup Detection"
    checkout main
    merge feature/monitoring
    
    commit id: "Production Deploy"
```

## 🧪 Testing Strategy

```mermaid
graph TB
    subgraph "Unit Tests"
        APITests[API Route Tests]
        ComponentTests[React Component Tests]
        AgentTests[AI Agent Tests]
    end

    subgraph "Integration Tests"
        DBTests[Database Integration]
        LiveKitTests[LiveKit Integration]
        EndToEndTests[E2E Call Tests]
    end

    subgraph "Performance Tests"
        LoadTests[Load Testing]
        StressTests[Stress Testing]
        ConcurrencyTests[Concurrent Call Tests]
    end

    subgraph "Quality Assurance"
        CodeReview[Code Review]
        SecurityAudit[Security Audit]
        UserTesting[User Acceptance Testing]
    end

    APITests --> DBTests
    ComponentTests --> EndToEndTests
    AgentTests --> LiveKitTests
    
    DBTests --> LoadTests
    EndToEndTests --> StressTests
    LiveKitTests --> ConcurrencyTests
    
    LoadTests --> CodeReview
    StressTests --> SecurityAudit
    ConcurrencyTests --> UserTesting

    style APITests fill:#e1f5fe
    style LoadTests fill:#fff3e0
    style CodeReview fill:#e8f5e8
```

## 📱 Mobile Architecture (Future)

```mermaid
graph TB
    subgraph "Mobile Apps"
        iOS[iOS App]
        Android[Android App]
        ReactNative[React Native Core]
    end

    subgraph "Mobile Features"
        PushNotifications[Push Notifications]
        OfflineMode[Offline Mode]
        AudioControls[Audio Controls]
    end

    subgraph "API Integration"
        MobileAPI[Mobile API Endpoints]
        RealTimeSync[Real-time Sync]
        Authentication[Mobile Auth]
    end

    iOS --> ReactNative
    Android --> ReactNative
    ReactNative --> MobileAPI
    
    PushNotifications --> RealTimeSync
    OfflineMode --> Authentication
    AudioControls --> MobileAPI
    
    MobileAPI --> ExistingAPI[Existing tRPC API]
    RealTimeSync --> LiveKitCloud[LiveKit Cloud]

    style ReactNative fill:#e1f5fe
    style MobileAPI fill:#fff3e0
```

---

## 📋 Architecture Decision Records (ADRs)

### ADR-001: LiveKit for Real-time Communication
**Decision**: Use LiveKit for SIP integration and real-time communication
**Rationale**: 
- Mature WebRTC infrastructure
- Built-in SIP gateway support
- Excellent documentation and SDK support
- Scalable cloud infrastructure

### ADR-002: Next.js + tRPC for Frontend/API
**Decision**: Use Next.js with tRPC for type-safe full-stack development
**Rationale**:
- Type safety across client/server boundary
- Excellent developer experience
- Built-in optimizations and SSR
- Strong ecosystem and community

### ADR-003: Python for AI Agent
**Decision**: Use Python for AI agent implementation
**Rationale**:
- Rich AI/ML ecosystem
- LiveKit Agents SDK available
- OpenAI SDK support
- Easier conversation logic implementation

### ADR-004: PostgreSQL for Data Storage
**Decision**: Use PostgreSQL with JSON support for flexible data storage
**Rationale**:
- ACID compliance for critical data
- JSON support for flexible transcript storage
- Excellent Prisma ORM integration
- Proven scalability and reliability

---

**This architecture supports the current feature set while providing a foundation for future scalability and enhancements.** 