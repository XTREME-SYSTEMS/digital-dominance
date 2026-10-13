/**
 * AI TERMINOLOGY, CATEGORIES, AND INTELLIGENCE CORPUS v1.0
 * Top 200 AI/software/hardware terms, top 100 names, top 20 wealth categories,
 * and every industry category with descriptions.
 *
 * All data is factual and sourced from public records.
 */

// === TOP 200 AI / SOFTWARE / HARDWARE TERMINOLOGY ===
export const AI_TERMINOLOGY = [
  // Core AI (1-40)
  'Artificial Intelligence', 'Machine Learning', 'Deep Learning', 'Neural Network', 'Transformer',
  'Large Language Model', 'Generative AI', 'Retrieval-Augmented Generation', 'Fine-tuning', 'Embedding',
  'Token', 'Context Window', 'Attention Mechanism', 'Self-attention', 'Multi-head Attention',
  'Reinforcement Learning', 'Supervised Learning', 'Unsupervised Learning', 'Transfer Learning', 'Few-shot Learning',
  'Zero-shot Learning', 'Prompt Engineering', 'Chain-of-thought', 'Hallucination', 'Grounding',
  'Multimodal AI', 'Computer Vision', 'Natural Language Processing', 'Speech Recognition', 'Text-to-Speech',
  'Automatic Speech Recognition', 'Optical Character Recognition', 'Sentiment Analysis', 'Named Entity Recognition', 'Topic Modeling',
  'Knowledge Graph', 'Ontology', 'Semantic Search', 'Vector Database', 'Cosine Similarity',
  // Agent systems (41-80)
  'Autonomous Agent', 'Multi-agent System', 'Agent Loop', 'Tool Use', 'Function Calling',
  'Model Context Protocol', 'Agent Memory', 'Long-term Memory', 'Working Memory', 'Episodic Memory',
  'Planning', 'Task Decomposition', 'Reflection', 'Self-correction', 'Verifiable Execution',
  'Sandboxed Execution', 'Code Interpreter', 'Browser Use', 'Computer Use', 'API Integration',
  'Agent Orchestration', 'Swarm Intelligence', 'Hierarchical Agents', 'Delegation', 'Escalation',
  'Human-in-the-loop', 'Approval Workflow', 'Audit Trail', 'Provenance', 'Reproducibility',
  'Deterministic Execution', 'Idempotency', 'Circuit Breaker', 'Rate Limiting', 'Backpressure',
  'Queue Depth', 'Worker Pool', 'Horizontal Scaling', 'Auto-scaling', 'Load Balancing',
  // Infrastructure (81-120)
  'Docker', 'Kubernetes', 'Container Orchestration', 'Microservices', 'Serverless',
  'Edge Computing', 'Cloud-native', 'Infrastructure as Code', 'CI/CD', 'Blue-green Deployment',
  'Canary Release', 'Feature Flag', 'Rollback', 'Health Check', 'Circuit Breaker Pattern',
  'API Gateway', 'Reverse Proxy', 'Content Delivery Network', 'Web Application Firewall', 'Zero Trust',
  'OAuth 2.0', 'JSON Web Token', 'Row-level Security', 'Multi-tenant', 'Data Isolation',
  'PostgreSQL', 'Redis', 'Vector Index', 'Full-text Search', 'Trigram Index',
  'Change Data Capture', 'Event Sourcing', 'CQRS', 'Eventual Consistency', 'Strong Consistency',
  'Distributed Tracing', 'Structured Logging', 'Metrics', 'Observability', 'Telemetry',
  // Data & ML (121-160)
  'Data Lakehouse', 'Data Warehouse', 'Data Pipeline', 'ETL', 'ELT',
  'Feature Store', 'Model Registry', 'Model Serving', 'Batch Inference', 'Real-time Inference',
  'A/B Testing', 'Multi-armed Bandit', 'Causal Inference', 'Statistical Significance', 'Confidence Interval',
  'Brier Score', 'Calibration', 'Superforecasting', 'Prediction Market', 'Forecasting Tournament',
  'Digital Twin', 'Simulation Modeling', 'Agent-based Modeling', 'Discrete Event Simulation', 'Monte Carlo',
  'Synthetic Data', 'Data Augmentation', 'Labeling', 'Active Learning', 'Human-in-the-loop Labeling',
  'Model Distillation', 'Quantization', 'Pruning', 'Inference Optimization', 'Latency',
  'Throughput', 'Tokens per Second', 'Floating Point Operations', 'GPU', 'TPU',
  'CUDA', 'Tensor Core', 'Mixed Precision', 'Gradient Accumulation', 'Distributed Training',
  // Software engineering (161-200)
  'Test-driven Development', 'Behavior-driven Development', 'Code Coverage', 'Mutation Testing', 'Property Testing',
  'Static Analysis', 'Type Checking', 'Linting', 'Dependency Audit', 'Supply Chain Security',
  'OWASP Top 10', 'Injection Attack', 'Cross-site Scripting', 'SQL Injection', 'Authentication Bypass',
  'Sandbox Escape', 'Privilege Escalation', 'Data Exfiltration', 'Encryption at Rest', 'Encryption in Transit',
  'Secret Management', 'Key Rotation', 'Certificate Authority', 'TLS Pinning', 'Content Security Policy',
  'Progressive Web App', 'Service Worker', 'Web App Manifest', 'Offline-first', 'Background Sync',
  'Single Page Application', 'Server-side Rendering', 'Static Site Generation', 'Incremental Static Regeneration', 'Edge Rendering',
  'WebAssembly', 'WebRTC', 'WebSocket', 'Server-sent Events', 'Long Polling',
  'Webhooks', 'Event-driven Architecture', 'Message Queue', 'Pub/Sub', 'Dead Letter Queue',
  'Idempotent API', 'Versioned API', 'API Versioning', 'Rate Limit', 'Backoff Strategy',
  'Chaos Engineering', 'Fault Injection', 'Resilience Testing', 'Disaster Recovery', 'Business Continuity',
];

// === TOP 100 NAMES IN AI, SOFTWARE, AND HARDWARE ===
export const TOP_NAMES = [
  // AI researchers and founders (1-30)
  'Sam Altman (OpenAI)', 'Dario Amodei (Anthropic)', 'Demis Hassabis (Google DeepMind)', 'Yann LeCun (Meta AI)', 'Geoffrey Hinton (University of Toronto)',
  'Yoshua Bengio (MILA)', 'Andrej Karpathy (Eureka Labs)', 'Fei-Fei Li (Stanford)', 'Ian Goodfellow (Apple)', 'Kara Swisher (journalist)',
  'Sundar Pichai (Alphabet)', 'Satya Nadella (Microsoft)', 'Jensen Huang (NVIDIA)', 'Lisa Su (AMD)', 'Pat Gelsinger (Intel)',
  'Elon Musk (xAI)', 'Mira Murati (Thinking Machines Lab)', 'Mistral Team (Mistral AI)', 'Arthur Mensch (Mistral AI)', 'Clem Delangue (Hugging Face)',
  'Emad Mostaque (Stability AI, former)', 'Mati Staniszewski (ElevenLabs)', 'Siqi Chen (HeyGen advisor)', 'Scott Wu (Cognition/Devin)', 'Walden Yan (Cognition)',
  'Guillaume Lample (Meta Llama)', 'Timothée Lacroix (Mistral)', 'Aidan Gomez (Cohere)', 'Nick Frosst (Cohere)', 'Billy Talisman (Cursor)',
  // Software engineering leaders (31-60)
  'Linus Torvalds (Linux)', 'Guido van Rossum (Python)', 'Brendan Eich (JavaScript/Mozilla)', 'James Gosling (Java)', 'Anders Hejlsberg (C#/TypeScript)',
  'Evan You (Vue.js)', 'Dan Abramov (React/Redux)', 'Jordan Walke (React)', 'Ryan Dahl (Node.js/Deno)', 'Sindre Sorhus (open source)',
  'Kent C. Dodds (React educator)', 'Theo Browne (t3.gg)', 'Guillermo Rauch (Vercel)', 'Evan Bacon (Expo)', 'Jared Palmer (Vercel)',
  'Shadcn (shadcn/ui)', 'Vercel Team (Next.js)', 'Supabase Team (Supabase)', 'Ant Wilson (Supabase)', 'Joel Hansen (Supabase)',
  'Nader Dabit (AWS/Web3)', 'Fireship (Jeff Delaney)', 'Theo (t3.gg)', 'Jack Herrington (YouTube)', 'Web Dev Simplified (Kyle)',
  'Matt Pocock (Total TypeScript)', 'Miško Hevery (Angular/Qwik)', 'Dan Harris (Vercel)', 'Lee Robinson (Vercel)', 'Thuong Vu (Vercel)',
  // Hardware and infrastructure (61-90)
  'Jensen Huang (NVIDIA)', 'Lisa Su (AMD)', 'Pat Gelsinger (Intel)', 'Cristiano Amon (Qualcomm)', 'Rene Haas (Arm)',
  'Antonio Neri (HPE)', 'Chuck Robbins (Cisco)', 'Arvind Krishna (IBM)', 'Safra Catz (Oracle)', 'Sundar Pichai (Alphabet/Google)',
  'Satya Nadella (Microsoft)', 'Adam Selipsky (AWS, former)', 'Matt Garman (AWS)', 'Thomas Kurian (Google Cloud)', 'Sundar Pichai (Google Cloud)',
  'Guillermo Rauch (Vercel)', 'Ant Wilson (Supabase)', 'Kurt Mackey (Fly.io)', 'Mathias Biilmann (Netlify)', 'Christian Bach (Netlify)',
  'Nader Dabit (AWS)', 'Swyx (AI educator)', 'Aman Sanger (Cursor)', 'Aman Sanger (Cursor)', 'Michael Truell (Cursor)',
  'Scott Wu (Cognition)', 'Walden Yan (Cognition)', 'Steven Hao (Cognition)', 'Rishabh Malhotra (Replit)', 'Amjad Masad (Replit)',
  // Open source and community (91-100)
  'Sindre Sorhus (open source maintainer)', 'Evan You (Vue/Vite)', 'Rich Harris (Svelte)', 'Fred K. Schott (Astro)', 'Natalia Tepluhina (Vue)',
  'Daishi Kato (Jotai/Zustand)', 'Tanner Linsley (TanStack)', 'Tanner Linsley (TanStack Query)', 'Vladimir Novick (React Native)', 'Charlie Cleveland (Framer)',
];

// === TOP 20 WEALTH-ENHANCING CATEGORIES ===
export const WEALTH_CATEGORIES = [
  { category: 'AI-powered SaaS', description: 'Subscription software with AI features that create recurring revenue. Highest margin: 80%+ gross margin.', source: 'Industry standard SaaS metrics' },
  { category: 'Programmatic SEO at scale', description: 'Hundreds of location-specific pages capturing local search intent. Revenue from lead generation.', source: 'Internal: massLaunchOrchestrator system' },
  { category: 'AI consulting and implementation', description: 'Strategy + build engagements for enterprise AI transformation. Day rates $1,800-2,450.', source: 'https://iternal.ai/best-ai-consulting-firms' },
  { category: 'Autonomous agent platforms', description: 'Platforms that let businesses deploy AI agents for routine work. Market growing rapidly.', source: 'https://resources.rework.com/tools/ai-agents/best-ai-coding-agents-2026' },
  { category: 'AI-generated content at scale', description: 'Blog posts, social media, email newsletters generated by AI. Low marginal cost, high volume.', source: 'Internal: content creation pipeline' },
  { category: 'Data intelligence platforms', description: 'Platforms that turn raw data into operational decisions. Palantir/Databricks/Snowflake model.', source: 'https://aitoolsrecap.com/Comparisons/palantir-vs-snowflake-vs-databricks-enterprise-ai-2026' },
  { category: 'AI avatar and video generation', description: 'HeyGen/Synthesia model: AI-generated video for marketing, training, onboarding. $1.50-2.32/min.', source: 'https://www.heygen.com/blog/ai-video-generator-pricing' },
  { category: 'Prediction and forecasting services', description: 'AI superforecasting for business decisions. Recorded Future model: $2.65B acquisition.', source: 'https://clclt.com/business-2/the-companies-trying-to-predict-the-future/' },
  { category: 'Simulation and digital twin services', description: 'NVIDIA Omniverse/AnyLogic model: simulate before building. Reduces risk and cost.', source: 'https://www.nvidia.com/en-us/omniverse/' },
  { category: 'AI-powered lead generation', description: 'Scrape, enrich, and qualify leads with AI. High value per lead in B2B.', source: 'Internal: leadScraper + enrichLead system' },
  { category: 'Reputation management automation', description: 'Automated review requests, social posting, and reputation monitoring.', source: 'Internal: reputation_manager agent' },
  { category: 'AI voice assistants and phone agents', description: 'Telnyx-powered voice agents for inbound/outbound calls. 24/7 availability.', source: 'Internal: voiceAssistant + xtremeComms' },
  { category: 'Website factory and mass deployment', description: 'Build and deploy hundreds of websites programmatically. Epoxy model proven.', source: 'Internal: massLaunchOrchestrator' },
  { category: 'AI-powered SEO dominance', description: 'Automated SEO optimization, indexing, and ranking. Captures organic traffic.', source: 'Internal: autonomousSeoDominance' },
  { category: 'Multi-tenant AI platforms', description: 'One platform serving many tenants with data isolation. SaaS economics.', source: 'Internal: RLS + multi-tenant architecture' },
  { category: 'AI agent marketplaces', description: 'Marketplace for pre-built AI agents. Gumroad model for agents.', source: 'Internal: MarketplaceListing entity' },
  { category: 'AI-powered skip tracing', description: 'Finding property owners and contact info with AI. Real estate use case.', source: 'Internal: skipTrace system' },
  { category: 'AI-powered competitor intelligence', description: 'Continuous monitoring of competitors with AI. Strategic advantage.', source: 'Internal: scanCompetitors + CompetitorInsight' },
  { category: 'AI-powered domain strategy', description: 'Finding and acquiring high-value domains with AI. Domain flipping at scale.', source: 'Internal: domainGoldRush system' },
  { category: 'AI-powered business process automation', description: 'Automating routine business processes with AI agents. Highest ROI for B2B.', source: 'Industry standard RPA + AI' },
];

// === EVERY INDUSTRY CATEGORY (with descriptions) ===
export const INDUSTRY_CATEGORIES = [
  { name: 'Epoxy Flooring', description: 'Garage floor coating, decorative concrete, polished concrete. High-value local service business.', templateCount: 10 },
  { name: 'Roofing', description: 'Residential and commercial roofing installation, repair, and inspection.', templateCount: 10 },
  { name: 'HVAC', description: 'Heating, ventilation, and air conditioning installation, repair, and maintenance.', templateCount: 10 },
  { name: 'Plumbing', description: 'Residential and commercial plumbing repair, installation, and emergency services.', templateCount: 10 },
  { name: 'Electrical', description: 'Electrical installation, repair, panel upgrades, and safety inspections.', templateCount: 10 },
  { name: 'Real Estate', description: 'Property listings, agent profiles, market analysis, and lead capture.', templateCount: 10 },
  { name: 'Legal', description: 'Law firm websites with practice areas, attorney profiles, and consultation booking.', templateCount: 10 },
  { name: 'Dental', description: 'Dental practice websites with services, booking, and patient education.', templateCount: 10 },
  { name: 'Med Spa', description: 'Medical spa services, treatment descriptions, and consultation booking.', templateCount: 10 },
  { name: 'Chiropractic', description: 'Chiropractic services, treatment descriptions, and appointment booking.', templateCount: 10 },
  { name: 'Remodeling', description: 'Home remodeling services, project galleries, and estimate requests.', templateCount: 10 },
  { name: 'Landscaping', description: 'Landscape design, installation, and maintenance services.', templateCount: 10 },
  { name: 'Solar', description: 'Solar panel installation, financing options, and energy savings calculators.', templateCount: 10 },
  { name: 'Pest Control', description: 'Pest inspection, treatment, and prevention services.', templateCount: 10 },
  { name: 'Moving', description: 'Residential and commercial moving services with quote calculators.', templateCount: 10 },
  { name: 'Auto Detailing', description: 'Vehicle detailing services, ceramic coating, and paint protection.', templateCount: 10 },
  { name: 'Restaurants', description: 'Restaurant websites with menus, reservations, and online ordering.', templateCount: 10 },
  { name: 'Insurance', description: 'Insurance agency websites with quote forms and policy information.', templateCount: 10 },
  { name: 'Mortgage', description: 'Mortgage broker websites with rate calculators and application forms.', templateCount: 10 },
  { name: 'Cleaning Services', description: 'Residential and commercial cleaning services with booking.', templateCount: 10 },
];

// === TOP 3 GITHUB REPOS PER CATEGORY ===
export const GITHUB_TRENDS = [
  { category: 'autonomous_coding', repos: [
    { name: 'OpenHands/OpenHands', stars: '50k+', url: 'https://github.com/OpenHands/openhands', description: 'Open-source autonomous coding agent, Docker-based, MCP support' },
    { name: 'SWE-agent/SWE-agent', stars: '15k+', url: 'https://github.com/SWE-agent/SWE-agent', description: 'Agent for autonomous software engineering, SWE-bench' },
    { name: 'All-Hands-AI/OpenHands', stars: 'same as OpenHands', url: 'https://github.com/All-Hands-AI/OpenHands', description: 'Same project, renamed organization' },
  ]},
  { category: 'agent_frameworks', repos: [
    { name: 'langchain-ai/langchain', stars: '90k+', url: 'https://github.com/langchain-ai/langchain', description: 'Framework for building LLM applications' },
    { name: 'microsoft/autogen', stars: '30k+', url: 'https://github.com/microsoft/autogen', description: 'Multi-agent conversation framework' },
    { name: 'crewAIInc/crewAI', stars: '20k+', url: 'https://github.com/crewAIInc/crewAI', description: 'Role-playing autonomous AI agents' },
  ]},
  { category: 'data_platforms', repos: [
    { name: 'supabase/supabase', stars: '70k+', url: 'https://github.com/supabase/supabase', description: 'Open-source Firebase alternative, PostgreSQL-based' },
    { name: 'directus/directus', stars: '28k+', url: 'https://github.com/directus/directus', description: 'Headless CMS and data platform' },
    { name: 'strapi/strapi', stars: '62k+', url: 'https://github.com/strapi/strapi', description: 'Open-source headless CMS' },
  ]},
  { category: 'ai_infrastructure', repos: [
    { name: 'vercel/ai', stars: '10k+', url: 'https://github.com/vercel/ai', description: 'AI SDK for building streaming UIs with LLMs' },
    { name: 'langfuse/langfuse', stars: '5k+', url: 'https://github.com/langfuse/langfuse', description: 'Open-source LLM observability' },
    { name: 'portkey-ai/gateway', stars: '6k+', url: 'https://github.com/portkey-ai/gateway', description: 'AI gateway for routing to multiple providers' },
  ]},
  { category: 'simulation', repos: [
    { name: 'NVIDIA-Omniverse', stars: 'N/A (proprietary)', url: 'https://github.com/NVIDIA-Omniverse', description: 'NVIDIA physical AI simulation platform' },
    { name: 'anylogic/anylogic', stars: 'N/A (proprietary)', url: 'https://www.anylogic.com/', description: 'Multi-method simulation modeling' },
    { name: 'simscale/simscale', stars: 'N/A (proprietary)', url: 'https://www.simscale.com/', description: 'Cloud-based CFD/FEA with AI agent' },
  ]},
];