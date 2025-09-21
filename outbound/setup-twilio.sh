#!/bin/bash

# LiveKit SIP AI Agent - Twilio Setup Script
# This script helps configure environment variables and validate setup

set -e

echo "🚀 LiveKit SIP AI Agent - Twilio Configuration Setup"
echo "===================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to prompt for user input
prompt_for_input() {
    local prompt="$1"
    local var_name="$2"
    local is_secret="$3"
    
    if [ "$is_secret" = "true" ]; then
        echo -n "$prompt: "
        read -s value
        echo
    else
        echo -n "$prompt: "
        read value
    fi
    
    eval "$var_name='$value'"
}

# Function to validate environment variables
validate_env() {
    local env_file="$1"
    echo -e "${BLUE}Validating $env_file...${NC}"
    
    if [ ! -f "$env_file" ]; then
        echo -e "${RED}❌ Environment file $env_file not found!${NC}"
        return 1
    fi
    
    # Check required variables
    local required_vars=(
        "LIVEKIT_API_ENDPOINT"
        "LIVEKIT_API_KEY"
        "LIVEKIT_API_SECRET"
        "LIVEKIT_SIP_TRUNK_ID"
    )
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" "$env_file"; then
            echo -e "${RED}❌ Missing required variable: $var${NC}"
            return 1
        fi
    done
    
    echo -e "${GREEN}✅ Environment file validation passed${NC}"
    return 0
}

# Function to test LiveKit connection
test_livekit_connection() {
    echo -e "${BLUE}Testing LiveKit connection...${NC}"
    
    # Load environment variables
    source web-ui/.env.local 2>/dev/null || {
        echo -e "${RED}❌ Could not load web-ui/.env.local${NC}"
        return 1
    }
    
    # Basic connectivity test (requires curl and jq)
    if command -v curl &> /dev/null; then
        echo "Testing API endpoint connectivity..."
        local endpoint_url="${LIVEKIT_API_ENDPOINT/wss:/https:}"
        
        if curl -s --connect-timeout 5 "$endpoint_url" > /dev/null; then
            echo -e "${GREEN}✅ LiveKit endpoint is reachable${NC}"
        else
            echo -e "${YELLOW}⚠️ LiveKit endpoint connectivity test failed${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ curl not found, skipping connectivity test${NC}"
    fi
}

# Function to create environment files
create_env_files() {
    echo -e "${BLUE}Creating environment configuration files...${NC}"
    
    # Gather Twilio information
    echo -e "\n${YELLOW}📞 Twilio Configuration${NC}"
    prompt_for_input "Twilio Account SID (AC...)" TWILIO_ACCOUNT_SID
    prompt_for_input "Twilio Auth Token" TWILIO_AUTH_TOKEN true
    prompt_for_input "Twilio Phone Number (+1234567890)" TWILIO_PHONE_NUMBER
    
    # Gather LiveKit information
    echo -e "\n${YELLOW}🔗 LiveKit Configuration${NC}"
    prompt_for_input "LiveKit API Endpoint (wss://your-project.livekit.cloud)" LIVEKIT_API_ENDPOINT
    prompt_for_input "LiveKit API Key (AP...)" LIVEKIT_API_KEY
    prompt_for_input "LiveKit API Secret" LIVEKIT_API_SECRET true
    prompt_for_input "LiveKit SIP Trunk ID (twilio-trunk)" LIVEKIT_SIP_TRUNK_ID
    
    # Gather OpenAI information
    echo -e "\n${YELLOW}🤖 OpenAI Configuration${NC}"
    prompt_for_input "OpenAI API Key (sk-...)" OPENAI_API_KEY true
    
    # Gather Database information
    echo -e "\n${YELLOW}🗄️ Database Configuration${NC}"
    prompt_for_input "Database URL (postgresql://user:pass@localhost:5432/db)" DATABASE_URL
    
    # Create web-ui/.env.local
    echo -e "\n${BLUE}Creating web-ui/.env.local...${NC}"
    cat > web-ui/.env.local << EOF
# Database Configuration
DATABASE_URL="$DATABASE_URL"

# LiveKit Configuration
LIVEKIT_API_ENDPOINT="$LIVEKIT_API_ENDPOINT"
LIVEKIT_API_KEY="$LIVEKIT_API_KEY"
LIVEKIT_API_SECRET="$LIVEKIT_API_SECRET"
LIVEKIT_SIP_TRUNK_ID="$LIVEKIT_SIP_TRUNK_ID"

# Twilio Configuration
TWILIO_ACCOUNT_SID="$TWILIO_ACCOUNT_SID"
TWILIO_AUTH_TOKEN="$TWILIO_AUTH_TOKEN"
TWILIO_PHONE_NUMBER="$TWILIO_PHONE_NUMBER"

# Next.js Configuration
NEXTAUTH_SECRET="$(openssl rand -base64 32 2>/dev/null || echo "your-nextauth-secret-change-me")"
NEXT_PUBLIC_API_URL="http://localhost:3000"
EOF
    
    # Create ai-agent/.env
    echo -e "${BLUE}Creating ai-agent/.env...${NC}"
    cat > ai-agent/.env << EOF
# LiveKit Configuration
LIVEKIT_API_ENDPOINT="$LIVEKIT_API_ENDPOINT"
LIVEKIT_API_KEY="$LIVEKIT_API_KEY"
LIVEKIT_API_SECRET="$LIVEKIT_API_SECRET"

# OpenAI Configuration
OPENAI_API_KEY="$OPENAI_API_KEY"

# API Integration
NEXT_PUBLIC_API_URL="http://localhost:3000"
EOF
    
    # Set secure permissions
    chmod 600 web-ui/.env.local ai-agent/.env
    
    echo -e "${GREEN}✅ Environment files created successfully${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}Checking prerequisites...${NC}"
    
    # Check if Node.js is installed
    if command -v node &> /dev/null; then
        local node_version=$(node --version | sed 's/v//')
        echo -e "${GREEN}✅ Node.js found: v$node_version${NC}"
        
        # Check Node.js version
        local major_version=$(echo $node_version | cut -d. -f1)
        if [ "$major_version" -lt 18 ]; then
            echo -e "${YELLOW}⚠️ Node.js version 18+ recommended for Next.js${NC}"
        fi
    else
        echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
        return 1
    fi
    
    # Check if Python is installed
    if command -v python3 &> /dev/null; then
        local python_version=$(python3 --version | sed 's/Python //')
        echo -e "${GREEN}✅ Python found: $python_version${NC}"
    else
        echo -e "${RED}❌ Python 3 not found. Please install Python 3.9+${NC}"
        return 1
    fi
    
    # Check if PostgreSQL is accessible
    if command -v psql &> /dev/null; then
        echo -e "${GREEN}✅ PostgreSQL client found${NC}"
    else
        echo -e "${YELLOW}⚠️ PostgreSQL client not found. Make sure PostgreSQL is installed${NC}"
    fi
    
    return 0
}

# Function to run database setup
setup_database() {
    echo -e "${BLUE}Setting up database...${NC}"
    
    cd web-ui
    
    # Install dependencies if not already installed
    if [ ! -d "node_modules" ]; then
        echo "Installing Node.js dependencies..."
        npm install
    fi
    
    # Generate Prisma client
    echo "Generating Prisma client..."
    npx prisma generate
    
    # Push database schema
    echo "Setting up database schema..."
    npx prisma db push
    
    cd ..
    
    echo -e "${GREEN}✅ Database setup completed${NC}"
}

# Function to setup AI agent dependencies
setup_ai_agent() {
    echo -e "${BLUE}Setting up AI agent dependencies...${NC}"
    
    cd ai-agent
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        echo "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment and install dependencies
    echo "Installing Python dependencies..."
    source venv/bin/activate
    pip install -r requirements.txt
    
    cd ..
    
    echo -e "${GREEN}✅ AI agent setup completed${NC}"
}

# Function to display next steps
show_next_steps() {
    echo -e "\n${GREEN}🎉 Setup completed successfully!${NC}"
    echo -e "\n${YELLOW}📋 Next Steps:${NC}"
    echo "1. Configure your Twilio SIP trunk (see TWILIO_SETUP_GUIDE.md)"
    echo "2. Configure your LiveKit SIP settings"
    echo "3. Test the configuration:"
    echo ""
    echo -e "${BLUE}   # Start the web dashboard:${NC}"
    echo "   cd web-ui && npm run dev"
    echo ""
    echo -e "${BLUE}   # Start the AI agent (in another terminal):${NC}"
    echo "   cd ai-agent && source venv/bin/activate && python campaign_agent.py"
    echo ""
    echo -e "${BLUE}   # Access the dashboard:${NC}"
    echo "   http://localhost:3000"
    echo ""
    echo -e "${YELLOW}📖 Documentation:${NC}"
    echo "   - README.md - Complete setup guide"
    echo "   - TWILIO_SETUP_GUIDE.md - Detailed Twilio configuration"
    echo "   - ARCHITECTURE.md - System architecture diagrams"
    echo ""
}

# Main execution
main() {
    echo -e "\n${BLUE}Starting LiveKit SIP AI Agent setup...${NC}"
    
    # Check if we're in the right directory
    if [ ! -f "README.md" ] || [ ! -d "web-ui" ] || [ ! -d "ai-agent" ]; then
        echo -e "${RED}❌ This script must be run from the Inbound/ directory${NC}"
        exit 1
    fi
    
    # Check prerequisites
    if ! check_prerequisites; then
        echo -e "${RED}❌ Prerequisites check failed. Please install missing dependencies.${NC}"
        exit 1
    fi
    
    # Ask user what they want to do
    echo -e "\n${YELLOW}What would you like to do?${NC}"
    echo "1. Create environment configuration files"
    echo "2. Setup database"
    echo "3. Setup AI agent dependencies"
    echo "4. Validate existing configuration"
    echo "5. Full setup (all of the above)"
    echo "6. Exit"
    
    read -p "Choose option (1-6): " choice
    
    case $choice in
        1)
            create_env_files
            ;;
        2)
            setup_database
            ;;
        3)
            setup_ai_agent
            ;;
        4)
            validate_env "web-ui/.env.local"
            validate_env "ai-agent/.env"
            test_livekit_connection
            ;;
        5)
            create_env_files
            setup_database
            setup_ai_agent
            echo -e "\n${BLUE}Validating configuration...${NC}"
            validate_env "web-ui/.env.local"
            validate_env "ai-agent/.env"
            test_livekit_connection
            show_next_steps
            ;;
        6)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option. Please choose 1-6.${NC}"
            exit 1
            ;;
    esac
}

# Run main function
main "$@" 