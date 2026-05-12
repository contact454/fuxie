---
description: Role routing table for the Fuxie internal software company operating model.
---

# Task Role Router

Use this file before every task to choose one primary role and up to three support roles.

## Default Routing

| Task type | Primary role | Support roles |
| --- | --- | --- |
| Company strategy, hiring plan, funding priorities | CEO / General Manager | CTO / Tech Lead, Product Manager EdTech, Finance / Admin Officer |
| Technical architecture, engineering standards, cross-system decisions | CTO / Tech Lead | Backend Engineer, DevOps / Cloud Engineer, Security / Privacy Consultant |
| Roadmap, feature prioritization, product requirements | Product Manager EdTech | German Academic Lead, Product Designer, Data / Analytics Engineer |
| Sprint planning, delivery tracking, release coordination | Project Manager / Delivery Manager | CTO / Tech Lead, QA Automation Engineer, Product Manager EdTech |
| Next.js feature or bug fix | Full-stack Engineer | QA Automation Engineer, Product Designer |
| API, database, Prisma, auth, queues, integrations | Backend Engineer | DevOps / Cloud Engineer, Security / Privacy Consultant |
| UI component, responsive layout, client-side behavior | Frontend Engineer | Product Designer, QA Automation Engineer |
| AI tutor, grading, generation, prompts, evals, cost control | AI / LLM Engineer | German Academic Lead, Data / Analytics Engineer, Security / Privacy Consultant |
| Speech recognition, TTS, pronunciation scoring, audio pipelines | Speech / Audio Engineer | AI / LLM Engineer, Audio Script & Voice Producer |
| Deployment, CI/CD, environments, observability, production smoke | DevOps / Cloud Engineer | Security / Privacy Consultant, QA Automation Engineer |
| Test automation, regression, smoke, content QA tooling | QA Automation Engineer | Full-stack Engineer, Content QA / Linguistic Reviewer |
| Analytics, metrics, dashboards, learning events, cohorts | Data / Analytics Engineer | Product Manager EdTech, Growth Lead |
| Security audit, secrets, privacy risk, access control | Security / Privacy Consultant | DevOps / Cloud Engineer, Backend Engineer, Legal / Compliance Advisor |
| CEFR standards, pedagogy, exam validity, academic policy | German Academic Lead | German Curriculum Designer, Content QA / Linguistic Reviewer |
| Course structure, lesson sequencing, learning paths | German Curriculum Designer | German Academic Lead, Product Manager EdTech |
| German exercise writing, explanations, examples | German Content Writer | German Curriculum Designer, Content QA / Linguistic Reviewer |
| Vietnamese learner localization, bilingual explanation | Vietnamese-German Localization Specialist | German Content Writer, German Academic Lead |
| Goethe/Telc/OSD mock tests, rubrics, scoring | Exam Prep Specialist | German Academic Lead, Content QA / Linguistic Reviewer |
| Linguistic review, answer validation, CEFR fit | Content QA / Linguistic Reviewer | German Academic Lead, German Content Writer |
| Listening scripts, voice direction, TTS/audio quality | Audio Script & Voice Producer | Speech / Audio Engineer, German Content Writer |
| UX flows, wireframes, learner/teacher/admin usability | Product Designer | Product Manager EdTech, Frontend Engineer |
| Design system, tokens, reusable UI patterns | Design System Designer | Product Designer, Frontend Engineer |
| Mascot, 3D assets, visual brand character | Illustrator / 3D Mascot Artist | Product Designer, Motion Designer |
| Animation, micro-interactions, mascot motion | Motion Designer | Product Designer, Frontend Engineer |
| XP, streaks, Fucoin, missions, rewards, game loops | Gamification Designer | Product Manager EdTech, Data / Analytics Engineer |
| User acquisition, retention campaigns, funnels | Growth Lead | Data / Analytics Engineer, Product Manager EdTech |
| School, teacher, center, enterprise partnerships | Sales / Partnership Manager | CEO / General Manager, Product Manager EdTech |
| Student support, community, onboarding feedback | Customer Success / Community Lead | Product Manager EdTech, Operations Manager |
| Internal process, vendor tools, release operations | Operations Manager | Project Manager / Delivery Manager, Finance / Admin Officer |
| Budget, invoices, payroll, runway | Finance / Admin Officer | CEO / General Manager |
| Terms, privacy, IP, education/legal claims | Legal / Compliance Advisor | Security / Privacy Consultant, CEO / General Manager |
| Recruiting, JD, interview process, onboarding | HR / Talent Partner | CEO / General Manager, relevant hiring manager |

## Tie-Breakers

- If code changes are required, choose an engineering primary role.
- If learning correctness is the main risk, choose a learning/content primary role.
- If the user asks "what should we build", choose Product Manager EdTech.
- If the user asks "how should the company operate", choose CEO / General Manager or Operations Manager.
- If production stability or data exposure is at stake, include Security / Privacy Consultant or DevOps / Cloud Engineer.
- If the task is ambiguous, choose the role responsible for the final deliverable, not the person who merely advises.
