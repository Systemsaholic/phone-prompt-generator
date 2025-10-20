# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

We take the security of Phone Prompt Generator seriously. If you believe you have found a security vulnerability, please report it to us responsibly.

### How to Report

1. **Email**: Send details to the repository maintainers via GitHub (preferred)
2. **GitHub Security Advisory**: Use GitHub's private vulnerability reporting feature
3. **Encrypted Communication**: For highly sensitive issues, request PGP key first

### What to Include

Please include the following information in your report:

- **Type of vulnerability** (e.g., SQL injection, XSS, authentication bypass)
- **Full paths of source file(s)** related to the vulnerability
- **Location of the affected source code** (tag/branch/commit or direct URL)
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact of the vulnerability** and potential attack scenarios
- **Suggested fixes** (if you have any)

### What to Expect

1. **Acknowledgment**: We'll acknowledge receipt within 48 hours
2. **Assessment**: We'll assess the vulnerability and determine its severity
3. **Communication**: We'll keep you informed of our progress
4. **Fix Development**: We'll work on a fix with priority based on severity
5. **Disclosure**: We'll coordinate public disclosure with you

### Disclosure Timeline

- **0-7 days**: Vulnerability assessment and verification
- **7-30 days**: Fix development and testing
- **30-90 days**: Public disclosure (coordinated with reporter)

We ask that you:
- Give us reasonable time to address the issue before public disclosure
- Make a good faith effort to avoid privacy violations and data destruction
- Don't exploit the vulnerability beyond what's necessary to demonstrate it

## Security Best Practices

### For Users

1. **Strong Credentials**
   ```bash
   # Always generate strong passwords
   pnpm run generate-creds
   ```

2. **Environment Security**
   - Never commit `.env` files
   - Use bcrypt-hashed passwords
   - Generate long random SESSION_SECRET (32+ chars)
   - Rotate secrets regularly

3. **Production Deployment**
   - Always use HTTPS
   - Configure firewall rules
   - Enable rate limiting at reverse proxy level
   - Set up monitoring and alerts
   - Regular security updates

4. **Access Control**
   - Change default AUTH_USERNAME
   - Use strong AUTH_PASSWORD
   - Limit session duration if needed
   - Monitor login attempts

### For Developers

1. **Code Security**
   - Never hardcode secrets
   - Validate all user inputs
   - Sanitize error messages
   - Use parameterized queries
   - Follow OWASP guidelines

2. **Dependencies**
   ```bash
   # Regular security audits
   pnpm audit
   pnpm audit fix
   ```

3. **Authentication**
   - Use provided auth system
   - Implement rate limiting
   - Validate session tokens
   - Use HTTPOnly cookies

4. **Error Handling**
   - Don't expose stack traces in production
   - Log security events
   - Use typed error classes
   - Sanitize error responses

## Security Features

Our application includes multiple security layers:

### Authentication & Authorization
- ✅ Cookie-based session management
- ✅ HMAC-SHA256 token signing
- ✅ Cryptographically secure tokens (`crypto.randomBytes`)
- ✅ Session expiration (24 hours)
- ✅ HTTPOnly, Secure, SameSite cookies

### Rate Limiting
- ✅ Login attempt limiting (5 attempts/15 min)
- ✅ Per-IP address tracking
- ✅ Automatic lockout reset

### Input Validation
- ✅ Comprehensive validation system
- ✅ Type checking with TypeScript
- ✅ Length and format validation
- ✅ Filename sanitization

### Password Security
- ✅ Bcrypt hashing support (10 rounds)
- ✅ Timing-safe comparison
- ✅ Plain text fallback (development only)

### Session Security
- ✅ Signature verification (HMAC)
- ✅ Expiration checking
- ✅ Secure token generation
- ✅ Automatic cleanup

### Error Handling
- ✅ Typed error classes
- ✅ Structured logging
- ✅ Production-safe responses
- ✅ No internal error exposure

### Environment Security
- ✅ Startup validation
- ✅ Required variable enforcement
- ✅ Secret strength checking
- ✅ Production-specific checks

## Known Security Considerations

### Current Limitations

1. **In-Memory Session Store**
   - Sessions lost on server restart
   - Not suitable for multi-instance deployments
   - **Mitigation**: Use Redis or database for production scaling

2. **Single-User Architecture**
   - Currently designed for single-user/team use
   - No multi-tenant isolation
   - **Mitigation**: Additional RBAC for multi-user scenarios

3. **File-Based Storage**
   - Audio files stored on local filesystem
   - Session cleanup required
   - **Mitigation**: Set up periodic cleanup cron job

### Attack Surface

**Protected Endpoints:**
- All routes except `/login` require authentication
- Rate limiting on login endpoint
- Input validation on all API routes

**Potential Risks:**
- OpenAI API key compromise (mitigated by env vars)
- Brute force attacks (mitigated by rate limiting)
- Session hijacking (mitigated by HMAC signing)
- File system access (mitigated by path validation)

## Security Updates

We regularly:
- Monitor security advisories for dependencies
- Update vulnerable packages promptly
- Test security patches before release
- Document security fixes in CHANGELOG.md

## Compliance

This application is designed with the following in mind:
- OWASP Top 10 protection
- GDPR-friendly (no PII storage beyond necessary)
- SOC 2 principles (for deployment)
- CIS Security Benchmarks

## Security Checklist

Before deploying to production, verify:

- [ ] All environment variables set correctly
- [ ] SESSION_SECRET is strong (32+ chars)
- [ ] AUTH_PASSWORD is bcrypt-hashed
- [ ] HTTPS is configured
- [ ] Firewall rules are in place
- [ ] Database backups configured
- [ ] Session cleanup cron job set
- [ ] Monitoring/alerting configured
- [ ] Rate limiting enabled
- [ ] Error logging working
- [ ] No default credentials in use
- [ ] All dependencies updated
- [ ] Security audit passed (`pnpm audit`)

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)

## Hall of Fame

We recognize security researchers who responsibly disclose vulnerabilities:

<!-- Add contributors here -->

---

Thank you for helping keep Phone Prompt Generator and our users safe!
