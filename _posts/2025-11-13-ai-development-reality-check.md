---
layout: post
title:  "Why That Nagging Feeling Is Right: What I Learned Building with AI"
date:   2025-11-13 10:00:00
categories: professional development
tags: [AI development software-engineering code-quality production-readiness best-practices]
---

## When "Done" Doesn't Feel Right

We've all been there. The project is technically complete, all features work as specified, tests are passing, and yet... something feels off. That persistent whisper in the back of your mind suggesting that maybe, just maybe, you should take another look before calling it done.

As a seasoned software engineer, I recently conducted an experiment that validated this intuition in ways I didn't expect. I set out to build a web application entirely through AI assistance—not as a production deployment, but as a case study in AI-driven development. The journey taught me more about both AI capabilities and the irreplaceable value of engineering experience than I anticipated.

## A Journey That Started with a Book

Before I tell you about the experiment, let me take you back to where my engineering journey truly began. When I was 12 years old, I discovered a book that would change my life: "O Guia do Hacker Brasileiro" (The Brazilian Hacker's Guide) by [Marcos Flávio Araújo Assunção](https://www.youtube.com/@mflavio2k).

For a kid who had mostly used computers to write and play games, this book was a revelation. The internet was still a luxury—dial-up was expensive, it blocked the phone line, and every connection was announced by that symphony of modem beeps that now triggers waves of nostalgia. But in those precious connected moments, a whole new world opened up.

The book introduced me to legends like Robert Morris Jr., Captain Crunch, Kevin Poulsen, and Kevin Mitnick. These weren't just names; they were people who saw systems differently, who understood that every piece of software had vulnerabilities waiting to be discovered. Kevin Mitnick, particularly, fascinated me with his social engineering approach—proving that sometimes the weakest link isn't in the code but in the human element.

At 12, I was hooked. I spent every presentation opportunity at school talking about cybersecurity, nagging teachers and classmates about password security, explaining phishing before most people knew the term. I was determined to become a cybersecurity professional.

But then came a realization that would shape my entire career: to truly understand how to secure systems, I first needed to understand how to build them. Knowing both sides—construction and deconstruction—would give me an advantage. That's how I pivoted to web development, gradually shifting my focus to backend systems and software architecture design.

Twenty years later, that foundation in security thinking has never left me. It's why I instinctively check for SQL injection vulnerabilities, why I automatically think about race conditions, why missing audit logs make me uncomfortable. It's a lens through which I view every line of code.

## The Experiment: Building with AI from Vision to Implementation

The setup was straightforward: I approached this project as I would any professional engagement. Clear vision document. Detailed functional requirements. Explicit coding standards including SOLID principles and Test-Driven Development. I wanted to see if AI could truly deliver production-quality code when given proper guidance.

The process was surprisingly smooth. Through iterative conversations with AI assistants, we:
- Established a comprehensive project plan
- Implemented all specified functionality
- Created automated tests
- Achieved what appeared to be a complete, working application

After a few intense days of back-and-forth refinement, everything worked. The features matched the spec. Tests were green. By all visible metrics, the project was "done."

## The Uncomfortable Success

But here's where experience kicks in. Despite the apparent success, I felt that familiar unease—the same feeling you get when you're pushing to meet a deadline and cutting corners you know you shouldn't. That sensation when you're so tired of a project that you just want it over with, even though you know you're compromising on quality.

Sound familiar?

It's that moment when you rationalize: "It works, doesn't it? The tests pass. The customer is happy. Ship it."

Except this time, I had the luxury of no real deadline. No external pressure. Just me and my instincts saying, "This isn't right."

## The Week of Reflection

I parked the project. For a full week, I let it simmer in the background of my mind. Not actively thinking about it, but not forgetting it either. That nagging feeling persisted—a low-grade anxiety that experienced developers know all too well.

This is human sensory at work. It's pattern recognition built from years of debugging production issues at 3 AM, of inheriting "working" codebases that turned into maintenance nightmares, of seeing how technical debt compounds when left unchecked.

After a week, I decided to trust that instinct. I reopened the project with fresh eyes and a different approach.

## The Deep Dive: Automated Code Quality Assessment

Instead of manually reviewing the code, I decided to turn AI on itself. I deployed two independent AI agents with a single mission: critically analyze this codebase and assess its production readiness. No sugar-coating. No benefit of the doubt. Just brutal, honest assessment.

The results were sobering:

**Critical Issues (P0): 12 problems that would cause immediate production failures**
- Database queries without proper indexing, creating N+1 query bombs
- Missing transaction boundaries around critical operations
- Absence of concurrent access controls
- Zero rate limiting on public endpoints
- Hard-coded credentials and configuration values
- Complete lack of audit logging for sensitive operations

**High Priority Issues (P1): 18 problems that would cause significant problems**
- No pagination on data-heavy endpoints
- Missing error boundaries in the UI layer
- Inadequate input validation allowing potential security exploits
- No retry logic for external service calls
- Absent health check endpoints
- Non-existent database migration rollback strategies

**Medium Priority Issues (P2): 16 issues impacting maintainability and performance**
- Inconsistent error handling patterns across modules
- Missing database query optimization
- No caching strategy for expensive operations
- Incomplete API documentation
- Lack of performance monitoring hooks
- Missing data archival strategies

**Low Priority Issues (P3): 14 nice-to-have improvements**
- Opportunities for code deduplication
- Missing unit tests for edge cases
- Inconsistent naming conventions
- Incomplete JSDoc comments
- Missing developer onboarding documentation

## Coming Full Circle

Reading this report, I felt something profound wash over me. Here I was, decades after that 12-year-old discovered "O Guia do Hacker Brasileiro," staring at a list of vulnerabilities that would have made Kevin Mitnick smile. The missing rate limiting, the absent input validation, the lack of audit trails—these weren't just code quality issues. They were security vulnerabilities, the very things that book had taught me to look for all those years ago.

It was deeply nostalgic. I could almost hear those dial-up modem beeps again, feel the excitement of that young kid who spent every free moment learning about buffer overflows and SQL injections. That book, written by a 20-year-old Brazilian on the other side of the Atlantic Ocean, had sparked something that never left me. And here, in this moment of reviewing AI-generated code, everything had come full circle.

The security vulnerabilities in the assessment report weren't just technical debt—they were exactly the kind of gaps that the people in that book would have exploited. It reminded me why I had shifted from wanting to break systems to building them: because understanding both perspectives makes you see what others miss. The hacker's mindset isn't about breaking things; it's about seeing systems differently, understanding their weak points, knowing where they'll fail under pressure.

## The Patterns Behind the Problems

What struck me wasn't just the quantity of issues, but their nature. The AI had successfully implemented what I explicitly asked for, but missed countless implicit requirements that experienced developers handle automatically:

### The "UserSubscription" Syndrome
Throughout the codebase, models like the subscription management system worked correctly in isolation but failed to consider real-world scenarios. The AI created clean CRUD operations but didn't anticipate:
- What happens when two users modify the same subscription simultaneously?
- How do we handle subscription changes mid-billing-cycle?
- What audit trail exists for compliance requirements?
- How do we prevent subscription bombing attacks?

### The Testing Illusion
Yes, there were tests. They passed. But they tested the happy path—the scenarios I had explicitly described. Missing were:
- Boundary condition tests
- Concurrency tests
- Performance regression tests
- Integration tests with realistic data volumes
- Chaos engineering scenarios

### The Architectural Gaps
The application structure was clean and followed SOLID principles when viewed at the method level. But zoom out, and critical architectural patterns were absent:
- No event sourcing for critical state changes
- Missing circuit breakers for external dependencies
- No feature flags for gradual rollouts
- Absent observability and tracing infrastructure
- No clear separation between read and write models for scalability

## The Real Lesson: AI as a Powerful Tool, Not a Replacement

This experiment crystallized something important: AI is incredibly capable at executing explicit instructions but lacks the implicit knowledge that comes from battle scars. It's like having a brilliant junior developer who can code anything you describe but hasn't yet experienced a production meltdown.

The AI didn't fail—it delivered exactly what I asked for. The failure was in expecting it to know what I didn't explicitly state. Every experienced developer carries a mental checklist built from past failures:
- "Remember that time the database melted because we didn't add indexes?"
- "Remember when that race condition only appeared under load?"
- "Remember when we got sued because we didn't have audit logs?"

These memories shape our instincts. They're why we feel uneasy even when everything appears to work.

## The Path Forward: Augmented Development

This experience hasn't diminished my enthusiasm for AI-assisted development—it's refined it. AI excels at:
- Rapidly prototyping ideas
- Generating boilerplate code
- Implementing well-defined algorithms
- Writing comprehensive documentation
- Suggesting alternative approaches

But it needs to be paired with human expertise for:
- Architectural decisions based on non-functional requirements
- Security considerations from a threat modeling perspective
- Performance optimization based on real-world usage patterns
- Error handling from the lens of debugging experience
- Code organization from a maintenance perspective

## Your Action Items

If you're using AI for development (and you should be), here's my advice:

1. **Trust your instincts**: That nagging feeling exists for a reason. If something feels off, investigate.

2. **Explicitly state implicit requirements**: Don't assume AI knows about rate limiting, concurrent access, or audit trails unless you specify them.

3. **Use AI agents for code review**: Turn AI into your harshest critic. Ask it to find problems, not validate your work.

4. **Build in reflection time**: Don't ship immediately after "completion." Let the code sit, then return with fresh eyes.

5. **Maintain a production readiness checklist**: Document your implicit knowledge. Make it explicit for both AI and future team members.

6. **Layer your testing strategy**: Unit tests are just the beginning. Plan for integration, performance, security, and chaos testing.

## The Bottom Line

AI has fundamentally changed how we develop software, but it hasn't changed what production-quality means. The bar remains high, and the consequences of missing it remain severe.

That gut feeling you have? That voice saying "something's not right"? Listen to it. It's the accumulated wisdom of every bug you've fixed, every outage you've resolved, every piece of legacy code you've inherited. For me, it's also the voice of that 12-year-old kid who read about Kevin Mitnick and realized that every system has vulnerabilities—you just need to know where to look.

Use AI to move faster, but don't let speed compromise your standards. The 60 issues my code review revealed weren't AI failures—they were specification gaps. The difference between "working code" and "production code" remains as vast as ever.

In the end, AI is an incredibly powerful tool that amplifies our capabilities. But like any tool, its effectiveness depends entirely on the wisdom and experience of the person wielding it. Trust your instincts, verify thoroughly, and never mistake "done" for "ready."

Because that nagging feeling? It's usually right. It's the same instinct that once made a young Marcos realize there was more to computers than games and word processors. It's what happens when curiosity meets experience, when the desire to build meets the knowledge of how things break.

And sometimes, it takes you full circle—from learning about hackers in a book, to building systems, to finding those same vulnerabilities decades later, reminding you that some lessons, once learned, become part of who you are as an engineer.

---

*What's your experience with AI-assisted development? Have you encountered similar gaps between "working" and "production-ready"? What books or experiences shaped your engineering mindset?