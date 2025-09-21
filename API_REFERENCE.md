# 📚 API Reference

This document provides comprehensive API documentation for the LiveKit SIP AI Agent System.

## 🔗 Base URLs

- **Web UI**: `http://localhost:3025`
- **API Endpoints**: `http://localhost:3025/api`
- **tRPC API**: `http://localhost:3025/api/trpc`

## 🎯 tRPC API Endpoints

### Campaign Management

#### `campaign.getAll`
Get all campaigns with lead counts.

**Request:**
```typescript
// No input required
```

**Response:**
```typescript
{
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    script: string | null;
    createdAt: Date;
    updatedAt: Date;
    _aggr_count_leads: number;
  }>;
}
```

#### `campaign.create`
Create a new campaign.

**Request:**
```typescript
{
  name: string;
  script?: string;
}
```

**Response:**
```typescript
{
  id: string;
  name: string;
  status: string;
  script: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `campaign.getDetails`
Get detailed information about a specific campaign.

**Request:**
```typescript
{
  id: string;
}
```

**Response:**
```typescript
{
  campaign: {
    id: string;
    name: string;
    status: string;
    script: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  leads: Array<{
    id: string;
    phoneNumber: string;
    name: string | null;
    email: string | null;
    status: string;
    errorReason: string | null;
    campaignId: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}
```

#### `campaign.addLead`
Add a lead to a campaign.

**Request:**
```typescript
{
  campaignId: string;
  phoneNumber: string;
  name?: string;
  email?: string;
}
```

**Response:**
```typescript
{
  id: string;
  phoneNumber: string;
  name: string | null;
  email: string | null;
  status: string;
  campaignId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `campaign.makeCall`
Make a call to a lead.

**Request:**
```typescript
{
  phoneNumber: string;
  script: string;
  useRealCall?: boolean; // Default: true
}
```

**Response:**
```typescript
{
  success: boolean;
  callId?: string;
  message: string;
}
```

#### `campaign.getStats`
Get campaign statistics.

**Request:**
```typescript
{
  id: string;
}
```

**Response:**
```typescript
{
  totalLeads: number;
  completedCalls: number;
  activeCalls: number;
  outcomes: Record<string, number>;
  callStatuses: Record<string, number>;
}
```

#### `campaign.getOverallStats`
Get overall system statistics.

**Request:**
```typescript
// No input required
```

**Response:**
```typescript
{
  totalCampaigns: number;
  totalLeads: number;
  totalCalls: number;
  activeCalls: number;
  completedToday: number;
  interestedLeads: number;
  callbacksScheduled: number;
  conversionRate: number;
  outcomes: Record<string, number>;
  callStatuses: Record<string, number>;
}
```

#### `campaign.getAgentStatus`
Get AI agent status and health.

**Request:**
```typescript
// No input required
```

**Response:**
```typescript
{
  isConnected: boolean;
  lastHeartbeat: Date | null;
  activeJobs: number;
  totalJobs: number;
  status: string;
}
```

#### `campaign.updateScript`
Update campaign script.

**Request:**
```typescript
{
  id: string;
  script: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

### Settings Management

#### `settings.getSipSettings`
Get SIP configuration settings.

**Request:**
```typescript
// No input required
```

**Response:**
```typescript
{
  twilioAccountSid: string | null;
  twilioAuthToken: string | null;
  twilioPhoneNumber: string | null;
  twilioSipTrunkSid: string | null;
  livekitApiEndpoint: string | null;
  livekitApiKey: string | null;
  livekitApiSecret: string | null;
  livekitSipTrunkId: string | null;
}
```

#### `settings.updateSipSettings`
Update SIP configuration settings.

**Request:**
```typescript
{
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  twilioSipTrunkSid?: string;
  livekitApiEndpoint?: string;
  livekitApiKey?: string;
  livekitApiSecret?: string;
  livekitSipTrunkId?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

#### `settings.testConnection`
Test Twilio connection.

**Request:**
```typescript
// No input required
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  details?: any;
}
```

### Twilio Integration

#### `twilio.makeCall`
Make a direct Twilio call.

**Request:**
```typescript
{
  to: string;
  from: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  callSid?: string;
  message: string;
}
```

### LiveKit Integration

#### `livekit.getListenToken`
Get LiveKit listen token for call monitoring.

**Request:**
```typescript
{
  callId: string;
}
```

**Response:**
```typescript
{
  token: string;
  livekitUrl: string;
  roomName: string;
}
```

#### `livekit.getTranscript`
Get conversation transcript.

**Request:**
```typescript
{
  callId: string;
}
```

**Response:**
```typescript
{
  transcript: Array<{
    id: string;
    timestamp: Date;
    speaker: string;
    text: string;
    confidence: number;
  }>;
}
```

### Slot Management

#### `slots.bookSlot`
Book a time slot.

**Request:**
```typescript
{
  name: string;
  date: string; // ISO date string
}
```

**Response:**
```typescript
{
  success: boolean;
  slot: {
    id: string;
    name: string;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
  };
  message: string;
}
```

#### `slots.getAllSlots`
Get all booked slots.

**Request:**
```typescript
// No input required
```

**Response:**
```typescript
Array<{
  id: string;
  name: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}>
```

#### `slots.uploadFile`
Upload a file to the system.

**Request:**
```typescript
{
  name: string;
  content: string; // Base64 or raw text
}
```

**Response:**
```typescript
{
  success: boolean;
  file: {
    id: number;
    name: string;
    content: string;
    createdAt: Date;
  };
}
```

#### `slots.bulkInsertSlots`
Bulk insert slots from CSV/Excel data.

**Request:**
```typescript
{
  slots: Array<{
    name: string;
    date: string; // ISO date string
  }>;
}
```

**Response:**
```typescript
{
  success: boolean;
  count: number;
}
```

### CSV Data Management

#### `csv.uploadCsv`
Upload and process CSV data.

**Request:**
```typescript
{
  csvData: string; // CSV content
}
```

**Response:**
```typescript
{
  success: boolean;
  processed: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}
```

#### `csv.getCsvData`
Get processed CSV data.

**Request:**
```typescript
// No input required
```

**Response:**
```typescript
Array<{
  id: string;
  phoneNumber: string;
  name: string | null;
  processed: boolean;
  createdAt: Date;
  updatedAt: Date;
}>
```

## 🔧 REST API Endpoints

### Environment Information

#### `GET /api/settings/env`
Get web UI environment variables (masked).

**Response:**
```json
{
  "web": {
    "nodeEnv": "development",
    "databaseUrl": "••••••••••••••••",
    "livekitApiEndpoint": "wss://your-project.livekit.cloud",
    "livekitApiKey": "••••••••••••••••",
    "livekitApiSecret": "••••••••••••••••",
    "livekitSipTrunkId": "••••••••••••••••",
    "twilioAccountSid": "••••••••••••••••",
    "twilioAuthToken": "••••••••••••••••",
    "twilioPhoneNumber": "••••••••••••••••",
    "twilioSipTrunkSid": "••••••••••••••••"
  },
  "sensitiveKeys": [
    "databaseUrl",
    "livekitApiKey",
    "livekitApiSecret",
    "livekitSipTrunkId",
    "twilioAccountSid",
    "twilioAuthToken",
    "twilioPhoneNumber",
    "twilioSipTrunkSid"
  ]
}
```

#### `GET /api/settings/agent-env`
Get AI agent environment variables (masked).

**Response:**
```json
{
  "agentEnv": {
    "livekitApiEndpoint": "wss://your-project.livekit.cloud",
    "livekitApiKey": "••••••••••••••••",
    "livekitApiSecret": "••••••••••••••••",
    "livekitUrl": "wss://your-project.livekit.cloud",
    "openaiApiKey": "••••••••••••••••",
    "nextPublicApiUrl": "http://localhost:3025"
  },
  "sensitiveKeys": [
    "openaiApiKey"
  ]
}
```

### TwiML Webhooks

#### `POST /api/twiml/[roomName]`
Handle Twilio TwiML webhooks for call routing.

**Request:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Connecting to AI agent...</Say>
  <Dial>
    <Sip>sip:roomName@your-livekit-sip-domain.com</Sip>
  </Dial>
</Response>
```

**Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Hello! This is a test call from your AI agent.</Say>
  <Pause length="2"/>
  <Say>Thank you for testing the system. Goodbye!</Say>
</Response>
```

### Slot Booking

#### `POST /api/book-slot`
Book a time slot via REST API.

**Request:**
```json
{
  "name": "John Doe",
  "date": "2024-01-15T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "slot": {
    "id": "uuid",
    "name": "John Doe",
    "date": "2024-01-15T10:00:00Z",
    "createdAt": "2024-01-15T09:00:00Z",
    "updatedAt": "2024-01-15T09:00:00Z"
  },
  "message": "Slot booked successfully"
}
```

## 📊 Data Models

### Campaign
```typescript
interface Campaign {
  id: string;
  name: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";
  script: string | null;
  createdAt: Date;
  updatedAt: Date;
  leads: Lead[];
  conversations: Conversation[];
}
```

### Lead
```typescript
interface Lead {
  id: string;
  phoneNumber: string;
  name: string | null;
  email: string | null;
  status: "PENDING" | "PROCESSED" | "FAILED" | "NO_ANSWER" | "VOICEMAIL" | "HUNG_UP" | "COMPLETED" | "WAITING_AGENT";
  errorReason: string | null;
  campaignId: string;
  createdAt: Date;
  updatedAt: Date;
  conversations: Conversation[];
}
```

### Conversation
```typescript
interface Conversation {
  id: string;
  leadId: string;
  campaignId: string;
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED" | "NO_ANSWER" | "VOICEMAIL" | "HUNG_UP" | "WAITING_AGENT";
  callStartTime: Date | null;
  callEndTime: Date | null;
  duration: number | null; // Duration in seconds
  results: any | null; // Structured results from the conversation
  createdAt: Date;
  updatedAt: Date;
}
```

### Slot
```typescript
interface Slot {
  id: string;
  name: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### File
```typescript
interface File {
  id: number;
  name: string;
  content: string;
  createdAt: Date;
}
```

### CsvData
```typescript
interface CsvData {
  id: string;
  phoneNumber: string;
  name: string | null;
  processed: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔐 Authentication

The API uses environment-based authentication. All sensitive operations require proper environment variables to be configured:

- **LiveKit**: API Key and Secret
- **Twilio**: Account SID and Auth Token
- **OpenAI**: API Key

## 📝 Error Handling

### Standard Error Response
```typescript
{
  error: {
    code: string;
    message: string;
    details?: any;
  }
}
```

### Common Error Codes
- `UNAUTHORIZED`: Invalid or missing credentials
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid input data
- `INTERNAL_ERROR`: Server error
- `RATE_LIMITED`: Too many requests
- `SERVICE_UNAVAILABLE`: External service unavailable

## 🚀 Rate Limits

- **API Calls**: 100 requests per minute per IP
- **Call Creation**: 10 calls per minute per campaign
- **File Uploads**: 5MB maximum file size
- **Database Queries**: 1000 queries per minute

## 📈 Monitoring

### Health Check Endpoints
- `GET /api/health` - Overall system health
- `GET /api/health/database` - Database connectivity
- `GET /api/health/livekit` - LiveKit service status
- `GET /api/health/twilio` - Twilio service status

### Metrics Endpoints
- `GET /api/metrics/calls` - Call statistics
- `GET /api/metrics/campaigns` - Campaign metrics
- `GET /api/metrics/performance` - System performance

## 🔄 Webhooks

### Twilio Webhooks
The system supports Twilio webhooks for call events:

- **Call Status**: `POST /api/webhooks/twilio/call-status`
- **Call Recording**: `POST /api/webhooks/twilio/recording`
- **SMS**: `POST /api/webhooks/twilio/sms`

### LiveKit Webhooks
LiveKit webhooks for room events:

- **Room Created**: `POST /api/webhooks/livekit/room-created`
- **Participant Joined**: `POST /api/webhooks/livekit/participant-joined`
- **Participant Left**: `POST /api/webhooks/livekit/participant-left`

## 📚 SDK Examples

### JavaScript/TypeScript
```typescript
import { api } from '@/utils/api';

// Create a campaign
const campaign = await api.campaign.create.mutate({
  name: "My Campaign",
  script: "Hello, this is an AI agent calling..."
});

// Make a call
const result = await api.campaign.makeCall.mutate({
  phoneNumber: "+1234567890",
  script: "Hello, this is an AI agent calling...",
  useRealCall: true
});
```

### Python
```python
import requests

# Make a call via REST API
response = requests.post('http://localhost:3025/api/trpc/campaign.makeCall', 
    json={
        "phoneNumber": "+1234567890",
        "script": "Hello, this is an AI agent calling...",
        "useRealCall": True
    }
)
```

## 🆘 Support

For API support:
1. Check the error messages and status codes
2. Verify your environment configuration
3. Check the system logs
4. Create an issue on GitHub with detailed information

---

**API Version**: 1.0.0  
**Last Updated**: 2024-01-15
