# Contributing to Phone Prompt Generator

Thank you for your interest in contributing to Phone Prompt Generator! This document provides guidelines and workflows for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Development Methodology](#development-methodology)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Security Considerations](#security-considerations)

## Code of Conduct

This project adheres to a [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- Node.js 20+ installed
- pnpm package manager (`npm install -g pnpm`)
- OpenAI API key for testing
- Git configured with your name and email
- FFmpeg installed (for audio conversion testing)

### Initial Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/phone-prompt-generator.git
   cd phone-prompt-generator
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/Systemsaholic/phone-prompt-generator.git
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Set up environment**
   ```bash
   cp .env.example .env
   pnpm run generate-creds
   # Add your OPENAI_API_KEY to .env
   ```

5. **Initialize database**
   ```bash
   pnpm exec prisma db push
   ```

6. **Validate setup**
   ```bash
   pnpm run validate-env
   pnpm build
   pnpm dev
   ```

## Development Workflow

### Branch Strategy

We follow a simplified Git Flow model:

```
master (main branch)
  ├── feature/* (new features)
  ├── fix/* (bug fixes)
  ├── docs/* (documentation updates)
  ├── refactor/* (code refactoring)
  └── hotfix/* (urgent production fixes)
```

### Creating a Branch

1. **Sync with upstream**
   ```bash
   git checkout master
   git fetch upstream
   git rebase upstream/master
   ```

2. **Create feature branch**
   ```bash
   # Feature branch
   git checkout -b feature/user-roles

   # Bug fix branch
   git checkout -b fix/audio-generation-timeout

   # Documentation branch
   git checkout -b docs/api-reference
   ```

### Making Changes

1. **Make your changes**
   - Follow coding standards (see below)
   - Add tests if applicable
   - Update documentation as needed

2. **Test your changes**
   ```bash
   pnpm lint              # Check code style
   pnpm build             # Test build
   pnpm run validate-env  # Validate environment
   ```

3. **Commit your changes** (see [Commit Convention](#commit-convention))
   ```bash
   git add .
   git commit -m "feat: add user role management"
   ```

4. **Keep branch updated**
   ```bash
   git fetch upstream
   git rebase upstream/master
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/user-roles
   ```

## Development Methodology

### Agile Principles

We follow Agile development principles:

1. **Iterative Development**
   - Small, incremental changes
   - Frequent commits with clear messages
   - Regular feedback and adaptation

2. **Test-Driven Development (TDD)**
   - Write tests before implementation (when applicable)
   - Ensure all tests pass before committing
   - Maintain high test coverage

3. **Continuous Integration**
   - Automated testing on every commit
   - Build verification before merging
   - Environment validation checks

4. **Code Review**
   - All changes require peer review
   - Two approvals minimum for major changes
   - Constructive feedback encouraged

### Security-First Approach

All contributions must prioritize security:

1. **Never commit secrets**
   - Check `.gitignore` before committing
   - Use environment variables for sensitive data
   - Run `git diff` before every commit

2. **Input validation**
   - Validate all user inputs
   - Sanitize data before processing
   - Use TypeScript for type safety

3. **Error handling**
   - Never expose internal errors to users
   - Log errors appropriately
   - Handle edge cases gracefully

4. **Authentication & Authorization**
   - Verify user permissions
   - Use secure session management
   - Implement rate limiting where appropriate

### Code Quality Standards

1. **TypeScript Best Practices**
   - Use strict mode (`"strict": true`)
   - Avoid `any` types
   - Prefer interfaces over types for objects
   - Use type guards for narrowing

2. **Async/Await Pattern**
   - Use async/await over callbacks
   - Handle errors with try/catch
   - Clean up resources in finally blocks

3. **Error Handling Pattern**
   ```typescript
   import { logError, formatErrorResponse, ValidationError } from '@/lib/errors'

   export async function POST(request: NextRequest) {
     try {
       // Validate inputs
       const data = await parseRequestBody(request)
       validateInput(data)

       // Process request
       const result = await processData(data)

       return NextResponse.json({ success: true, result })
     } catch (error) {
       logError(error as Error, 'EndpointName')
       const errorResponse = formatErrorResponse(error as Error)
       return NextResponse.json(errorResponse, {
         status: errorResponse.statusCode
       })
     }
   }
   ```

4. **Resource Management**
   - Clean up temporary files
   - Close database connections
   - Use try/finally for cleanup

## Coding Standards

### File Organization

```
app/
├── api/              # API routes
│   ├── [route]/
│   │   └── route.ts  # API endpoint
lib/
├── utils.ts          # Utility functions
├── errors.ts         # Error classes
├── validation.ts     # Validation functions
components/
├── Component.tsx     # React components
```

### Naming Conventions

- **Files**: PascalCase for components (`UserProfile.tsx`), camelCase for utilities (`audioConverter.ts`)
- **Functions**: camelCase (`getUserData`, `validateInput`)
- **Classes**: PascalCase (`ValidationError`, `AudioConverter`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`, `API_ENDPOINT`)
- **Interfaces**: PascalCase with 'I' prefix optional (`User` or `IUser`)
- **Types**: PascalCase (`ApiResponse`, `SessionData`)

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Line Length**: Max 100 characters (exceptions for long strings)
- **Trailing Commas**: Required in multiline structures

### TypeScript Guidelines

```typescript
// Good
interface UserData {
  id: string
  name: string
  email: string
}

async function getUser(id: string): Promise<UserData> {
  const user = await database.findUser(id)
  if (!user) {
    throw new NotFoundError('User')
  }
  return user
}

// Bad
async function getUser(id: any) {
  const user = await database.findUser(id)
  return user
}
```

### React Component Guidelines

```typescript
// Good - Functional component with TypeScript
interface Props {
  title: string
  onSubmit: (data: FormData) => Promise<void>
}

export function MyComponent({ title, onSubmit }: Props) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Submit failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return <div>{title}</div>
}
```

## Testing Guidelines

### Test Structure

```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Arrange
    const props = { title: 'Test' }

    // Act
    const result = render(<Component {...props} />)

    // Assert
    expect(result.getByText('Test')).toBeInTheDocument()
  })
})
```

### Testing Checklist

- [ ] Unit tests for utility functions
- [ ] Integration tests for API endpoints
- [ ] Component tests for React components
- [ ] Error handling tests
- [ ] Edge case coverage
- [ ] Security validation tests

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm exec playwright test
```

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, build config)
- `ci`: CI/CD changes
- `security`: Security fixes

### Examples

```bash
# Feature
git commit -m "feat(auth): add OAuth2 authentication support"

# Bug fix
git commit -m "fix(audio): resolve MP3 to WAV conversion issue"

# Documentation
git commit -m "docs(deployment): add Kubernetes deployment guide"

# Breaking change
git commit -m "feat(api)!: change authentication endpoint structure

BREAKING CHANGE: /api/login now requires username field instead of email"
```

### Commit Best Practices

1. **Atomic commits** - One logical change per commit
2. **Clear messages** - Describe what and why, not how
3. **Present tense** - "Add feature" not "Added feature"
4. **Imperative mood** - "Fix bug" not "Fixes bug"
5. **Reference issues** - Include issue numbers when applicable

## Pull Request Process

### Before Creating PR

1. ✅ All tests passing
2. ✅ Code linted and formatted
3. ✅ Documentation updated
4. ✅ Commits follow convention
5. ✅ Branch rebased on latest master
6. ✅ No merge conflicts

### Creating the PR

1. **Push your branch**
   ```bash
   git push origin feature/your-feature
   ```

2. **Create PR on GitHub**
   - Use descriptive title following commit convention
   - Fill out the PR template completely
   - Link related issues
   - Add appropriate labels

3. **PR Title Format**
   ```
   feat(scope): Add feature description
   ```

### PR Template Checklist

- [ ] Description of changes
- [ ] Related issue numbers
- [ ] Breaking changes documented
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Screenshots (if UI changes)
- [ ] Migration guide (if breaking changes)

### Review Process

1. **Automated Checks**
   - CI/CD pipeline must pass
   - Build verification
   - Lint checks
   - Test coverage

2. **Peer Review**
   - At least one approval required
   - Address all comments
   - No unresolved conversations

3. **Maintainer Review**
   - Security review
   - Architecture review
   - Final approval

### After PR Approval

1. **Squash and merge** (preferred for features)
2. **Rebase and merge** (for clean history)
3. **Update CHANGELOG.md** if needed
4. **Delete branch** after merge

## Security Considerations

### Before Committing

1. **Check for secrets**
   ```bash
   git diff --cached
   # Look for API keys, passwords, tokens
   ```

2. **Verify .gitignore**
   - `.env` files ignored
   - Database files ignored
   - Audio files ignored

3. **Run security audit**
   ```bash
   pnpm audit
   ```

### Security Review Checklist

- [ ] No hardcoded secrets
- [ ] Input validation implemented
- [ ] Error messages sanitized
- [ ] Authentication checked
- [ ] Rate limiting considered
- [ ] SQL injection prevented
- [ ] XSS prevention in place
- [ ] CSRF protection enabled

### Reporting Security Issues

**Do NOT open public issues for security vulnerabilities.**

See [SECURITY.md](./SECURITY.md) for responsible disclosure process.

## Getting Help

- **Documentation**: Check README.md, DEPLOYMENT.md, and CLAUDE.md
- **Issues**: Search existing issues before creating new ones
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: [Join our community](#) (if available)

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- CHANGELOG.md
- Release notes

Thank you for contributing to Phone Prompt Generator! 🎉
