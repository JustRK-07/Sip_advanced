# Twilio + LiveKit SIP Configuration Guide

Complete step-by-step guide to configure Twilio phone numbers and SIP trunking with your LiveKit AI Agent system.

## 📋 **Prerequisites**

Before starting, ensure you have:
- ✅ Twilio account with billing enabled
- ✅ LiveKit Cloud account
- ✅ Your LiveKit SIP AI Agent system running
- ✅ Credit card for Twilio phone number purchase
- ✅ Admin access to configure SIP settings

---

## 🚀 **Step 1: Twilio Account Setup**

### **1.1 Create Twilio Account**
1. Go to [https://www.twilio.com/](https://www.twilio.com/)
2. Click "Sign up for free" or "Try for free"
3. Fill in your details:
   - Email address
   - Password
   - First and last name
   - Company name (optional)
4. Verify your email address
5. Complete phone number verification

### **1.2 Upgrade to Paid Account**
1. Log into your Twilio Console: [https://console.twilio.com/](https://console.twilio.com/)
2. Navigate to **Account > Billing**
3. Click **"Upgrade Account"**
4. Add payment method (credit card)
5. Choose a billing plan (Pay-as-you-go recommended for testing)

### **1.3 Get Account Credentials**
1. In Twilio Console, go to **Account > API keys & tokens**
2. Copy and save these values:
   ```
   Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Auth Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

---

## 📞 **Step 2: Purchase Phone Number**

### **2.1 Buy Twilio Phone Number**
1. In Twilio Console, go to **Phone Numbers > Manage > Buy a number**
2. Select your country (e.g., United States)
3. Choose capabilities needed:
   - ✅ **Voice** (required for calls)
   - ✅ **SMS** (optional, for notifications)
4. Search for available numbers
5. Select a number and click **"Buy this number"**
6. Confirm purchase

### **2.2 Configure Phone Number**
1. Go to **Phone Numbers > Manage > Active numbers**
2. Click on your purchased number
3. Configure the following:
   - **Friendly Name**: "LiveKit AI Agent Line"
   - **Voice Configuration**:
     - **Accept Incoming**: Voice calls
     - **Configure with**: Webhooks, TwiML Bins, Functions, Studio, or Proxy
   - **Messaging Configuration** (if SMS enabled):
     - Configure as needed

---

## 🔗 **Step 3: LiveKit Cloud Setup**

### **3.1 Create LiveKit Cloud Account**
1. Go to [https://cloud.livekit.io/](https://cloud.livekit.io/)
2. Sign up or log in
3. Create a new project:
   - Project name: "SIP AI Agent"
   - Region: Choose closest to your location

### **3.2 Enable SIP Service**
1. In LiveKit Cloud dashboard, go to **Settings > SIP**
2. Click **"Enable SIP"**
3. Configure SIP settings:
   - **SIP Domain**: Your LiveKit domain (e.g., `your-project.livekit.cloud`)
   - **Enable Authentication**: Yes
4. Save settings

### **3.3 Get LiveKit Credentials**
1. Go to **Settings > Keys**
2. Copy these values:
   ```
   API Key: APxxxxxxxxxxxxxxxxxxxxxxxx
   API Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   WebSocket URL: wss://your-project.livekit.cloud
   ```

---

## 🌉 **Step 4: Configure SIP Trunking**

### **4.1 Create SIP Trunk in Twilio**
1. In Twilio Console, go to **Voice > SIP > Trunks**
2. Click **"Create new SIP Trunk"**
3. Configure trunk settings:
   ```
   Friendly Name: LiveKit-AI-Agent-Trunk
   Origination URI: sip:your-project.livekit.cloud:5060
   Secure: Yes (recommended)
   ```

### **4.2 Configure Trunk Authentication**
1. In your SIP Trunk settings, go to **Authentication**
2. Add authentication:
   ```
   Type: IP Authentication
   IP Address: LiveKit's IP ranges (get from LiveKit support)
   ```
   
   **Alternative: Username/Password Authentication**
   ```
   Type: Username/Password
   Username: livekit-trunk-user
   Password: [generate strong password]
   ```

### **4.3 Configure Origination (Inbound Calls)**
1. In SIP Trunk settings, go to **Origination**
2. Add Origination URI:
   ```
   URI: sip:your-project.livekit.cloud:5060
   Priority: 10
   Weight: 10
   ```

### **4.4 Configure Termination (Outbound Calls)**
1. In SIP Trunk settings, go to **Termination**
2. Add Termination URI:
   ```
   URI: sip:+15551234567@your-twilio-domain.pstn.twilio.com
   ```
   (Replace with your Twilio phone number)

---

## ⚙️ **Step 5: LiveKit SIP Configuration**

### **5.1 Configure SIP Trunk in LiveKit**
1. In LiveKit Cloud, go to **SIP > Trunks**
2. Click **"Add SIP Trunk"**
3. Configure trunk:
   ```yaml
   Name: twilio-trunk
   Outbound Address: your-domain.pstn.twilio.com:5060
   Outbound Transport: UDP
   Inbound Username: [if using auth]
   Inbound Password: [if using auth]
   Outbound Username: [your twilio credentials]
   Outbound Password: [your twilio auth token]
   ```

### **5.2 Configure Phone Number Mapping**
1. In LiveKit SIP settings, add number mapping:
   ```yaml
   Phone Number: +15551234567  # Your Twilio number
   SIP Trunk: twilio-trunk
   Project: your-project-id
   ```

---

## 🔧 **Step 6: Update Application Configuration**

### **6.1 Update Environment Variables**

Update your `web-ui/.env.local`:
```env
# LiveKit Configuration
LIVEKIT_API_ENDPOINT="wss://your-project.livekit.cloud"
LIVEKIT_API_KEY="APxxxxxxxxxxxxxxxxxxxxxxxx"
LIVEKIT_API_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
LIVEKIT_SIP_TRUNK_ID="twilio-trunk"

# Twilio Configuration (for additional features)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_PHONE_NUMBER="+15551234567"

# Database and other settings...
DATABASE_URL="postgresql://username:password@localhost:5432/livekit_sip"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

Update your `ai-agent/.env`:
```env
# LiveKit Configuration
LIVEKIT_API_ENDPOINT="wss://your-project.livekit.cloud"
LIVEKIT_API_KEY="APxxxxxxxxxxxxxxxxxxxxxxxx"
LIVEKIT_API_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# OpenAI Configuration
OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# API Integration
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### **6.2 Update Code Configuration**

Update the SIP client configuration in `web-ui/src/server/api/routers/campaign.ts`:

```typescript
const sipClient = new SipClient(
  env.LIVEKIT_API_ENDPOINT,
  env.LIVEKIT_API_KEY,
  env.LIVEKIT_API_SECRET
);

// Update makeCall function to use Twilio trunk
const sipParticipant = await sipClient.createSipParticipant(
  "twilio-trunk", // Use your configured trunk name
  input.phoneNumber,
  roomName,
  {
    participantIdentity: input.phoneNumber,
    participantName: "Phone Caller",
    playRingtone: true,
  }
);
```

---

## 🧪 **Step 7: Testing Configuration**

### **7.1 Test Outbound Calls**
1. Start your application:
   ```bash
   cd web-ui && npm run dev
   cd ai-agent && python campaign_agent.py
   ```

2. In the dashboard, create a test call:
   - Use a real phone number you can answer
   - Monitor the call logs in both Twilio and LiveKit consoles

### **7.2 Test Call Flow**
1. **Initiate Call**: Dashboard → API → LiveKit → Twilio → Phone
2. **Answer Call**: Phone should ring and connect to AI agent
3. **Monitor**: Check dashboard for live call monitoring
4. **Transcript**: Verify real-time transcript is working
5. **Hang-up**: Test hang-up detection

### **7.3 Troubleshooting Tests**
Run these tests to verify configuration:

```bash
# Test 1: Verify LiveKit connection
curl -X POST "https://your-project.livekit.cloud/twirp/livekit.RoomService/CreateRoom" \
  -H "Authorization: Bearer $(echo -n 'APxxxx:secretxxxx' | base64)" \
  -H "Content-Type: application/json" \
  -d '{"name": "test-room"}'

# Test 2: Check SIP trunk status in Twilio Console
# Go to Voice > SIP > Trunks > Your Trunk > Logs

# Test 3: Verify phone number is correctly mapped
# Check LiveKit SIP settings for number mapping
```

---

## 📊 **Step 8: Monitoring and Logs**

### **8.1 Twilio Monitoring**
Monitor calls in Twilio Console:
1. **Voice > Logs > Calls**: View all call attempts
2. **Voice > SIP > Trunks > [Your Trunk] > Logs**: SIP-specific logs
3. **Monitor > Debugger**: Real-time event monitoring

### **8.2 LiveKit Monitoring**
Monitor in LiveKit Cloud:
1. **Rooms**: Active and completed rooms
2. **SIP**: SIP call logs and status
3. **Analytics**: Call metrics and performance

### **8.3 Application Logs**
Monitor your application logs:
```bash
# Web UI logs
cd web-ui && npm run dev

# AI Agent logs
cd ai-agent && python campaign_agent.py

# Database monitoring
npx prisma studio
```

---

## 🔒 **Step 9: Security Configuration**

### **9.1 Secure SIP Communication**
1. **Enable TLS**: Use `sips:` instead of `sip:` where possible
2. **IP Whitelisting**: Restrict SIP trunk access to known IPs
3. **Authentication**: Use strong passwords for SIP authentication

### **9.2 Firewall Configuration**
Open required ports:
```
Outbound:
- Port 5060 (SIP signaling)
- Port 5061 (Secure SIP - TLS)
- Ports 10000-20000 (RTP media - configurable)

Inbound:
- Only if receiving direct SIP calls
```

### **9.3 Environment Security**
```bash
# Secure environment files
chmod 600 web-ui/.env.local
chmod 600 ai-agent/.env

# Never commit credentials to git
echo "*.env*" >> .gitignore
```

---

## 🚨 **Common Issues and Solutions**

### **Issue 1: Calls Not Connecting**
**Symptoms**: Calls fail to initiate or immediately disconnect

**Solutions**:
1. Check SIP trunk configuration in both Twilio and LiveKit
2. Verify phone number format (E.164: +1234567890)
3. Check account balance in Twilio
4. Verify LiveKit project has SIP enabled

### **Issue 2: No Audio During Calls**
**Symptoms**: Call connects but no audio

**Solutions**:
1. Check firewall settings for RTP ports
2. Verify codec compatibility
3. Check NAT/firewall configuration
4. Test with different networks

### **Issue 3: Authentication Errors**
**Symptoms**: 401/403 errors in logs

**Solutions**:
1. Verify Twilio credentials are correct
2. Check LiveKit API key permissions
3. Verify SIP trunk authentication settings
4. Check IP authentication if using IP-based auth

### **Issue 4: One-Way Audio**
**Symptoms**: Can hear AI agent but agent can't hear customer

**Solutions**:
1. Check symmetric RTP settings
2. Verify STUN/TURN configuration
3. Check firewall rules for RTP traffic
4. Test from different networks

---

## 💰 **Cost Optimization**

### **Twilio Costs**
- **Phone Number**: ~$1-2/month
- **Outbound Calls**: ~$0.013/minute (US)
- **Inbound Calls**: ~$0.0085/minute (US)
- **SIP Trunking**: Additional charges may apply

### **LiveKit Costs**
- **SIP Minutes**: Check LiveKit pricing
- **Room Minutes**: Charges for active rooms
- **Egress**: Costs for recording/streaming

### **Cost Reduction Tips**
1. Use efficient call routing
2. Implement call timeout limits
3. Monitor usage regularly
4. Consider bulk pricing for high volume

---

## 📈 **Scaling Considerations**

### **For High Volume**
1. **Multiple Trunks**: Configure multiple SIP trunks for redundancy
2. **Load Balancing**: Use multiple LiveKit projects
3. **Geographic Distribution**: Deploy in multiple regions
4. **Monitoring**: Implement comprehensive monitoring

### **Example High-Volume Configuration**
```yaml
# Multiple SIP trunks
trunks:
  - name: twilio-trunk-us-east
    region: us-east
    capacity: 100
  - name: twilio-trunk-us-west
    region: us-west
    capacity: 100

# Automatic failover
failover:
  primary: twilio-trunk-us-east
  backup: twilio-trunk-us-west
```

---

## ✅ **Verification Checklist**

Before going live, verify:

- [ ] Twilio account is upgraded and funded
- [ ] Phone number is purchased and configured
- [ ] SIP trunk is created and tested
- [ ] LiveKit project has SIP enabled
- [ ] Environment variables are correctly set
- [ ] Test calls are successful
- [ ] Audio quality is acceptable
- [ ] Hang-up detection works
- [ ] Monitoring and logging are configured
- [ ] Security settings are properly configured

---

## 📞 **Support and Resources**

### **Twilio Support**
- Documentation: [https://www.twilio.com/docs](https://www.twilio.com/docs)
- Support: [https://support.twilio.com](https://support.twilio.com)
- Community: [https://stackoverflow.com/questions/tagged/twilio](https://stackoverflow.com/questions/tagged/twilio)

### **LiveKit Support**
- Documentation: [https://docs.livekit.io](https://docs.livekit.io)
- SIP Guide: [https://docs.livekit.io/sip/](https://docs.livekit.io/sip/)
- Discord: [https://discord.gg/livekit](https://discord.gg/livekit)

### **Testing Resources**
- **Test Phone Numbers**: Use Twilio test credentials for development
- **SIP Testing Tools**: 
  - SIPp for load testing
  - Wireshark for protocol analysis
  - Online SIP testers for connectivity

---

**🎉 Congratulations! Your LiveKit SIP AI Agent system is now configured with Twilio for production phone calls.** 