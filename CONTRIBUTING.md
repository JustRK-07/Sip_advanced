# 🤝 Contributing Guide

Thank you for your interest in contributing to the LiveKit SIP AI Agent System! This guide will help you get started with contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Process](#contributing-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Issue Guidelines](#issue-guidelines)
- [Pull Request Guidelines](#pull-request-guidelines)

## 📜 Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. Please:

- Be respectful and inclusive
- Use welcoming and inclusive language
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 18+** and npm
- **Python 3.9+** and pip
- **Git** for version control
- **LiveKit Cloud account** (for testing)
- **Twilio account** (for testing)
- **OpenAI API key** (for testing)

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Sip_advanced.git
   cd Sip_advanced
   ```

3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/JustRK-07/Sip_advanced.git
   ```

## 🛠️ Development Setup

### 1. Environment Setup

Follow the [Setup Guide](SETUP_GUIDE.md) to configure your development environment.

### 2. Install Dependencies

```bash
# Web UI dependencies
cd outbound/web-ui
npm install

# AI Agent dependencies
cd ../ai-agent
pip install -r requirements.txt
```

### 3. Database Setup

```bash
cd outbound/web-ui
npx prisma generate
npx prisma db push
```

### 4. Start Development Servers

```bash
# Terminal 1: Web UI
cd outbound/web-ui
npm run dev

# Terminal 2: AI Agent
cd outbound/ai-agent
python main.py
```

## 🔄 Contributing Process

### 1. Create a Branch

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/your-bug-description
```

### 2. Make Changes

- Write clean, readable code
- Follow the coding standards
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run tests
npm test

# Check code quality
npm run lint
npm run type-check

# Test the application
npm run dev
```

### 4. Commit Changes

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "feat: add new campaign analytics feature

- Add real-time campaign statistics
- Implement call outcome tracking
- Update dashboard with new metrics

Closes #123"
```

### 5. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create a pull request on GitHub
```

## 📝 Coding Standards

### TypeScript/JavaScript

- Use **TypeScript** for all new code
- Follow **ESLint** and **Prettier** configurations
- Use **meaningful variable names**
- Add **JSDoc comments** for complex functions
- Use **async/await** instead of promises where possible

```typescript
/**
 * Creates a new campaign with the specified parameters
 * @param name - The campaign name
 * @param script - The AI conversation script
 * @returns Promise<Campaign>
 */
async function createCampaign(name: string, script?: string): Promise<Campaign> {
  try {
    const campaign = await prisma.campaign.create({
      data: { name, script }
    });
    return campaign;
  } catch (error) {
    logger.error('Failed to create campaign:', error);
    throw new Error('Campaign creation failed');
  }
}
```

### Python

- Follow **PEP 8** style guidelines
- Use **type hints** for function parameters and return values
- Add **docstrings** for all functions and classes
- Use **async/await** for asynchronous operations

```python
async def create_campaign(name: str, script: str = None) -> Campaign:
    """
    Creates a new campaign with the specified parameters.
    
    Args:
        name: The campaign name
        script: The AI conversation script (optional)
        
    Returns:
        Campaign: The created campaign object
        
    Raises:
        ValueError: If the campaign name is invalid
        DatabaseError: If the database operation fails
    """
    try:
        campaign = await prisma.campaign.create({
            "data": {"name": name, "script": script}
        })
        return campaign
    except Exception as e:
        logger.error(f"Failed to create campaign: {e}")
        raise DatabaseError("Campaign creation failed")
```

### Database

- Use **Prisma** for all database operations
- Follow **naming conventions** (camelCase for fields)
- Add **proper indexes** for frequently queried fields
- Use **transactions** for related operations

```prisma
model Campaign {
  id        String   @id @default(cuid())
  name      String   @unique
  status    String   @default("DRAFT")
  script    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  leads         Lead[]
  conversations Conversation[]
  
  @@index([status])
  @@index([createdAt])
}
```

## 🧪 Testing

### Unit Tests

Write unit tests for all new functionality:

```typescript
// tests/campaign.test.ts
import { describe, it, expect } from 'vitest';
import { createCampaign } from '../src/utils/campaign';

describe('Campaign Management', () => {
  it('should create a new campaign', async () => {
    const campaign = await createCampaign('Test Campaign', 'Hello world');
    
    expect(campaign.name).toBe('Test Campaign');
    expect(campaign.script).toBe('Hello world');
    expect(campaign.status).toBe('DRAFT');
  });
  
  it('should throw error for invalid campaign name', async () => {
    await expect(createCampaign('')).rejects.toThrow('Invalid campaign name');
  });
});
```

### Integration Tests

Test API endpoints and database operations:

```typescript
// tests/api/campaign.test.ts
import { describe, it, expect } from 'vitest';
import { api } from '../src/utils/api';

describe('Campaign API', () => {
  it('should create campaign via API', async () => {
    const result = await api.campaign.create.mutate({
      name: 'API Test Campaign',
      script: 'Test script'
    });
    
    expect(result.name).toBe('API Test Campaign');
    expect(result.id).toBeDefined();
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📚 Documentation

### Code Documentation

- Add **JSDoc comments** for all public functions
- Document **complex algorithms** and business logic
- Include **usage examples** in documentation
- Update **README files** for new features

### API Documentation

- Update **API_REFERENCE.md** for new endpoints
- Include **request/response examples**
- Document **error codes** and handling
- Add **authentication requirements**

### User Documentation

- Update **README.md** for new features
- Add **setup instructions** for new dependencies
- Include **troubleshooting** for common issues
- Create **tutorials** for complex features

## 🐛 Issue Guidelines

### Before Creating an Issue

1. **Search existing issues** to avoid duplicates
2. **Check the troubleshooting guide** for solutions
3. **Verify the issue** with the latest version
4. **Gather relevant information** (logs, screenshots, etc.)

### Issue Template

When creating an issue, include:

```markdown
## Bug Report / Feature Request

### Description
Brief description of the issue or feature request.

### Steps to Reproduce (for bugs)
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

### Expected Behavior
What you expected to happen.

### Actual Behavior
What actually happened.

### Environment
- OS: [e.g., Ubuntu 20.04]
- Node.js version: [e.g., 18.17.0]
- Python version: [e.g., 3.9.7]
- Browser: [e.g., Chrome 91]

### Additional Context
Add any other context about the problem here.

### Logs
```
Paste relevant log entries here
```
```

## 🔀 Pull Request Guidelines

### Before Submitting

1. **Ensure all tests pass**
2. **Update documentation** as needed
3. **Follow coding standards**
4. **Squash commits** if necessary
5. **Write descriptive commit messages**

### Pull Request Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] All existing tests pass

## Checklist
- [ ] Code follows the project's coding standards
- [ ] Self-review of code completed
- [ ] Documentation updated
- [ ] No new warnings or errors
- [ ] Breaking changes documented

## Related Issues
Closes #123
```

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** in development environment
4. **Documentation review**
5. **Final approval** and merge

## 🏷️ Commit Message Convention

Use conventional commit messages:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(campaign): add real-time analytics dashboard

- Implement live campaign statistics
- Add call outcome tracking
- Update dashboard with new metrics

Closes #123
```

```
fix(sip): resolve 403 forbidden error

- Update SIP trunk configuration
- Fix authentication credentials
- Add proper error handling

Fixes #456
```

## 🎯 Areas for Contribution

### High Priority

- **Performance optimization**
- **Error handling improvements**
- **Test coverage expansion**
- **Documentation updates**
- **Security enhancements**

### Feature Requests

- **Multi-language support**
- **Advanced analytics**
- **CRM integrations**
- **Mobile app support**
- **Webhook integrations**

### Bug Fixes

- **SIP connection issues**
- **Database performance**
- **UI/UX improvements**
- **API error handling**
- **Real-time updates**

## 📞 Getting Help

### Community

- **GitHub Discussions**: For questions and ideas
- **GitHub Issues**: For bug reports and feature requests
- **Discord**: For real-time chat (if available)

### Maintainers

- **@JustRK-07**: Project maintainer
- **Reviewers**: Active contributors who can review PRs

### Resources

- [LiveKit Documentation](https://docs.livekit.io/)
- [Twilio Documentation](https://www.twilio.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## 🏆 Recognition

Contributors will be recognized in:

- **README.md** contributors section
- **Release notes** for significant contributions
- **GitHub contributors** page
- **Project documentation**

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to the LiveKit SIP AI Agent System!** 🎉

Your contributions help make this project better for everyone. If you have any questions about contributing, please don't hesitate to ask!
