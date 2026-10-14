// Universal Template Categories — every style of website template that exists
// Each category can have multiple layouts (5 per style for maximum variety)

export const UNIVERSAL_CATEGORIES = [
  // ── EXISTING INDUSTRY CATEGORIES ──────────────────────────
  { id: 'contractor', label: 'Contractor', icon: '🔨', niches: ['epoxy', 'roofing', 'hvac', 'plumbing', 'electrical', 'remodeling', 'landscaping', 'garage', 'concrete', 'flooring'], group: 'industry' },
  { id: 'health', label: 'Health & Wellness', icon: '⚕️', niches: ['med_spa', 'dental', 'chiropractic', 'medical', 'wellness', 'therapy', 'fitness'], group: 'industry' },
  { id: 'legal', label: 'Legal', icon: '⚖️', niches: ['legal', 'attorney', 'law', 'notary'], group: 'industry' },
  { id: 'professional', label: 'Professional Services', icon: '💼', niches: ['insurance', 'mortgage', 'accounting', 'consulting', 'financial', 'real_estate'], group: 'industry' },
  { id: 'realestate', label: 'Real Estate', icon: '🏠', niches: ['real_estate', 'property', 'realtor', 'rental'], group: 'industry' },
  { id: 'home', label: 'Home Services', icon: '🛠️', niches: ['cleaning', 'pest_control', 'moving', 'painting', 'pool', 'landscaping'], group: 'industry' },
  { id: 'automotive', label: 'Automotive', icon: '🚗', niches: ['auto_detailing', 'auto_repair', 'towing', 'tires', 'car_wash'], group: 'industry' },

  // ── PLATFORM CREATION CATEGORIES (NEW) ─────────────────────
  { id: 'ecommerce', label: 'E-Commerce', icon: '🛒', niches: ['ecommerce', 'shop', 'store', 'dropshipping', 'marketplace'], group: 'platform', layouts: 5 },
  { id: 'saas', label: 'SaaS Platform', icon: '☁️', niches: ['saas', 'software', 'platform', 'dashboard'], group: 'platform', layouts: 5 },
  { id: 'ai_chat', label: 'AI Chat & Tools', icon: '🤖', niches: ['ai_chat', 'chatbot', 'ai_tool', 'prompt_lab', 'prompt_showcase'], group: 'platform', layouts: 5 },
  { id: 'pwa', label: 'PWA Mobile App', icon: '📱', niches: ['pwa', 'mobile_app', 'progressive_web_app'], group: 'platform', layouts: 5 },
  { id: 'funnel', label: 'Sales Funnel', icon: '🔄', niches: ['funnel', 'landing', 'lead_gen', 'conversion'], group: 'platform', layouts: 5 },
  { id: 'marketplace', label: 'Marketplace', icon: '🏪', niches: ['marketplace', 'multi_vendor', 'directory', 'classifieds'], group: 'platform', layouts: 5 },
  { id: 'agency', label: 'Digital Agency', icon: '🎨', niches: ['agency', 'marketing', 'design', 'branding'], group: 'platform', layouts: 5 },
  { id: 'social', label: 'Social & Community', icon: '💬', niches: ['social', 'community', 'forum', 'scheduler'], group: 'platform', layouts: 5 },
  { id: 'portfolio', label: 'Portfolio & Creative', icon: '🖼️', niches: ['portfolio', 'creative', 'photography', 'art'], group: 'platform', layouts: 5 },
  { id: 'booking', label: 'Booking & Scheduling', icon: '📅', niches: ['booking', 'appointment', 'reservation', 'calendar'], group: 'platform', layouts: 5 },

  // ── AUTOMATION TOOL CATEGORIES (NEW) ───────────────────────
  { id: 'content_generator', label: 'Content Generator', icon: '✍️', niches: ['content_gen', 'blog_writer', 'seo_content'], group: 'automation', layouts: 5 },
  { id: 'branding_generator', label: 'Branding Generator', icon: '🎨', niches: ['branding', 'brand_gen', 'identity'], group: 'automation', layouts: 5 },
  { id: 'logo_generator', label: 'AI Logo Generator', icon: '✨', niches: ['logo', 'logo_gen', 'brand_mark'], group: 'automation', layouts: 5 },
  { id: 'image_generator', label: 'AI Image Generator', icon: '🖼️', niches: ['image_gen', 'ai_art', 'visual_gen'], group: 'automation', layouts: 5 },
  { id: 'app_pack', label: 'App Pack', icon: '📦', niches: ['app_pack', 'mobile_pack', 'pwa_pack'], group: 'automation', layouts: 5 },
  { id: 'web_pack', label: 'Web Pack', icon: '🌐', niches: ['web_pack', 'site_pack', 'launch_pack'], group: 'automation', layouts: 5 },
  { id: 'ai_tool', label: 'AI Tool Template', icon: '⚡', niches: ['ai_tool', 'ai_agent', 'automation_tool'], group: 'automation', layouts: 5 },
];

export const CATEGORY_GROUPS = [
  { id: 'industry', label: 'Industry Templates' },
  { id: 'platform', label: 'Platform Templates' },
  { id: 'automation', label: 'Automation & AI Tools' },
];

// Template definitions for seeding — each category gets 5 layouts
export const UNIVERSAL_TEMPLATES = [
  // E-COMMERCE (5 layouts)
  { name: 'E-Commerce Store — Modern Grid', slug: 'ecom-modern-grid', category: 'ecommerce', niche: 'ecommerce', layout: 1, description: 'Clean product grid with instant search, cart drawer, and one-page checkout' },
  { name: 'E-Commerce Store — Luxury Boutique', slug: 'ecom-luxury-boutique', category: 'ecommerce', niche: 'ecommerce', layout: 2, description: 'Editorial-style product showcase with large imagery and story-driven product pages' },
  { name: 'E-Commerce Store — Dropshipping Minimal', slug: 'ecom-dropship-minimal', category: 'ecommerce', niche: 'dropshipping', layout: 3, description: 'Fast-loading single-product focus with social proof and urgency timers' },
  { name: 'E-Commerce Store — Marketplace Multi-Vendor', slug: 'ecom-marketplace', category: 'ecommerce', niche: 'marketplace', layout: 4, description: 'Multi-vendor marketplace with vendor profiles, product comparison, and reviews' },
  { name: 'E-Commerce Store — Subscription Box', slug: 'ecom-subscription', category: 'ecommerce', niche: 'ecommerce', layout: 5, description: 'Subscription-focused with plan picker, delivery schedule, and unboxing gallery' },

  // SaaS (5 layouts)
  { name: 'SaaS — Dashboard Analytics', slug: 'saas-dashboard', category: 'saas', niche: 'saas', layout: 1, description: 'Data-rich dashboard with charts, KPIs, and real-time metrics' },
  { name: 'SaaS — Project Management', slug: 'saas-project-mgmt', category: 'saas', niche: 'saas', layout: 2, description: 'Kanban boards, task lists, team collaboration, and timeline views' },
  { name: 'SaaS — CRM Pipeline', slug: 'saas-crm', category: 'saas', niche: 'saas', layout: 3, description: 'Sales pipeline with deal stages, contact management, and activity tracking' },
  { name: 'SaaS — Marketing Landing', slug: 'saas-marketing', category: 'saas', niche: 'saas', layout: 4, description: 'High-converting SaaS marketing page with feature comparison and pricing' },
  { name: 'SaaS — API Documentation', slug: 'saas-api-docs', category: 'saas', niche: 'saas', layout: 5, description: 'Clean API docs with code examples, interactive playground, and search' },

  // AI CHAT & TOOLS (5 layouts)
  { name: 'AI Chat — Conversational Assistant', slug: 'ai-chat-assistant', category: 'ai_chat', niche: 'ai_chat', layout: 1, description: 'Full-screen chat interface with streaming responses and tool calling' },
  { name: 'AI Chat — Prompt Lab Studio', slug: 'ai-prompt-lab', category: 'ai_chat', niche: 'prompt_lab', layout: 2, description: 'Prompt engineering workspace with versioning, testing, and sharing' },
  { name: 'AI Chat — Prompt Showcase Gallery', slug: 'ai-prompt-showcase', category: 'ai_chat', niche: 'prompt_showcase', layout: 3, description: 'Curated prompt gallery with categories, ratings, and one-click copy' },
  { name: 'AI Chat — Multi-Model Router', slug: 'ai-multi-model', category: 'ai_chat', niche: 'ai_tool', layout: 4, description: 'Multi-model AI router with model comparison, cost tracking, and fallback' },
  { name: 'AI Chat — Agent Builder', slug: 'ai-agent-builder', category: 'ai_chat', niche: 'ai_tool', layout: 5, description: 'Visual agent builder with tool configuration, memory, and deployment' },

  // PWA (5 layouts)
  { name: 'PWA — Business App', slug: 'pwa-business', category: 'pwa', niche: 'pwa', layout: 1, description: 'Installable business app with offline support, push notifications, and bottom nav' },
  { name: 'PWA — E-Commerce App', slug: 'pwa-ecommerce', category: 'pwa', niche: 'pwa', layout: 2, description: 'Mobile shopping app with product browsing, cart, and one-tap checkout' },
  { name: 'PWA — Service Booking App', slug: 'pwa-booking', category: 'pwa', niche: 'pwa', layout: 3, description: 'Service booking app with calendar, reminders, and customer portal' },
  { name: 'PWA — Social Community App', slug: 'pwa-social', category: 'pwa', niche: 'pwa', layout: 4, description: 'Community app with feed, messaging, and member profiles' },
  { name: 'PWA — Content Media App', slug: 'pwa-media', category: 'pwa', niche: 'pwa', layout: 5, description: 'Media consumption app with articles, videos, and saved content' },

  // FUNNEL (5 layouts)
  { name: 'Funnel — Lead Capture Squeeze', slug: 'funnel-lead-capture', category: 'funnel', niche: 'funnel', layout: 1, description: 'High-conversion squeeze page with opt-in form and instant delivery' },
  { name: 'Funnel — Webinar Registration', slug: 'funnel-webinar', category: 'funnel', niche: 'funnel', layout: 2, description: 'Webinar registration with countdown, speaker bios, and replay delivery' },
  { name: 'Funnel — Product Launch', slug: 'funnel-product-launch', category: 'funnel', niche: 'funnel', layout: 3, description: 'Multi-step product launch with video sales letter and order bump' },
  { name: 'Funnel — Local Lead Gen', slug: 'funnel-local-leads', category: 'funnel', niche: 'lead_gen', layout: 4, description: 'Local business lead funnel with quote form, map, and instant callback' },
  { name: 'Funnel — Tripwire Offer', slug: 'funnel-tripwire', category: 'funnel', niche: 'funnel', layout: 5, description: 'Low-ticket tripwire with upsell stack and one-click order' },

  // MARKETPLACE (5 layouts)
  { name: 'Marketplace — Service Directory', slug: 'marketplace-services', category: 'marketplace', niche: 'marketplace', layout: 1, description: 'Service provider directory with search, reviews, and booking' },
  { name: 'Marketplace — Product Marketplace', slug: 'marketplace-products', category: 'marketplace', niche: 'marketplace', layout: 2, description: 'Multi-vendor product marketplace with vendor dashboards and payouts' },
  { name: 'Marketplace — Classifieds', slug: 'marketplace-classifieds', category: 'marketplace', niche: 'marketplace', layout: 3, description: 'Classified ads with categories, search, and messaging' },
  { name: 'Marketplace — Niche Directory', slug: 'marketplace-directory', category: 'marketplace', niche: 'marketplace', layout: 4, description: 'Niche industry directory with premium listings and lead forwarding' },
  { name: 'Marketplace — Comparison Platform', slug: 'marketplace-comparison', category: 'marketplace', niche: 'marketplace', layout: 5, description: 'Side-by-side comparison platform with filters and affiliate links' },

  // AGENCY (5 layouts)
  { name: 'Agency — Digital Marketing', slug: 'agency-marketing', category: 'agency', niche: 'agency', layout: 1, description: 'Marketing agency site with services, case studies, and team showcase' },
  { name: 'Agency — Design Studio', slug: 'agency-design', category: 'agency', niche: 'design', layout: 2, description: 'Design studio portfolio with project gallery, process, and capabilities' },
  { name: 'Agency — Branding Studio', slug: 'agency-branding', category: 'agency', niche: 'branding', layout: 3, description: 'Branding agency with identity work, case studies, and brand guidelines' },
  { name: 'Agency — Dev Shop', slug: 'agency-dev', category: 'agency', niche: 'agency', layout: 4, description: 'Development agency with tech stack, project showcases, and process' },
  { name: 'Agency — Full-Service Creative', slug: 'agency-creative', category: 'agency', niche: 'agency', layout: 5, description: 'Full-service creative agency with immersive case studies and awards' },

  // SOCIAL (5 layouts)
  { name: 'Social — Post Scheduler', slug: 'social-scheduler', category: 'social', niche: 'scheduler', layout: 1, description: 'Social media scheduler with calendar, multi-platform posting, and analytics' },
  { name: 'Social — Community Forum', slug: 'social-forum', category: 'social', niche: 'community', layout: 2, description: 'Community forum with threads, voting, and member profiles' },
  { name: 'Social — Feed Aggregator', slug: 'social-feed', category: 'social', niche: 'social', layout: 3, description: 'Multi-platform social feed aggregator with unified inbox' },
  { name: 'Social — Creator Platform', slug: 'social-creator', category: 'social', niche: 'social', layout: 4, description: 'Creator platform with content tools, monetization, and audience analytics' },
  { name: 'Social — Event Community', slug: 'social-events', category: 'social', niche: 'social', layout: 5, description: 'Event community with RSVPs, discussions, and attendee networking' },

  // PORTFOLIO (5 layouts)
  { name: 'Portfolio — Photographer', slug: 'portfolio-photographer', category: 'portfolio', niche: 'photography', layout: 1, description: 'Photographer portfolio with full-screen galleries and client proofing' },
  { name: 'Portfolio — Designer', slug: 'portfolio-designer', category: 'portfolio', niche: 'creative', layout: 2, description: 'Designer portfolio with case studies, process, and capabilities' },
  { name: 'Portfolio — Developer', slug: 'portfolio-developer', category: 'portfolio', niche: 'creative', layout: 3, description: 'Developer portfolio with projects, blog, and tech stack showcase' },
  { name: 'Portfolio — Artist', slug: 'portfolio-artist', category: 'portfolio', niche: 'art', layout: 4, description: 'Artist portfolio with collection galleries and exhibition history' },
  { name: 'Portfolio — Studio', slug: 'portfolio-studio', category: 'portfolio', niche: 'creative', layout: 5, description: 'Studio portfolio with immersive project showcases and team' },

  // BOOKING (5 layouts)
  { name: 'Booking — Service Appointment', slug: 'booking-service', category: 'booking', niche: 'booking', layout: 1, description: 'Service booking with calendar, staff selection, and payment' },
  { name: 'Booking — Restaurant Reservation', slug: 'booking-restaurant', category: 'booking', niche: 'reservation', layout: 2, description: 'Restaurant reservation with table selection, waitlist, and menu' },
  { name: 'Booking — Class & Event', slug: 'booking-events', category: 'booking', niche: 'calendar', layout: 3, description: 'Class and event booking with capacity, tickets, and reminders' },
  { name: 'Booking — Rental & Property', slug: 'booking-rental', category: 'booking', niche: 'booking', layout: 4, description: 'Property rental booking with availability calendar and pricing' },
  { name: 'Booking — Multi-Service', slug: 'booking-multi', category: 'booking', niche: 'appointment', layout: 5, description: 'Multi-service booking with provider directory and package deals' },

  // CONTENT GENERATOR (5 layouts)
  { name: 'Content Gen — Blog Writer', slug: 'content-blog-writer', category: 'content_generator', niche: 'content_gen', layout: 1, description: 'AI blog writer with SEO optimization, topic research, and scheduling' },
  { name: 'Content Gen — SEO Content Factory', slug: 'content-seo-factory', category: 'content_generator', niche: 'seo_content', layout: 2, description: 'Programmatic SEO content factory with bulk generation and indexing' },
  { name: 'Content Gen — Social Content', slug: 'content-social', category: 'content_generator', niche: 'content_gen', layout: 3, description: 'Social media content generator with captions, hashtags, and scheduling' },
  { name: 'Content Gen — Email Sequence', slug: 'content-email', category: 'content_generator', niche: 'content_gen', layout: 4, description: 'Email sequence generator with templates, personalization, and automation' },
  { name: 'Content Gen — Video Script', slug: 'content-video-script', category: 'content_generator', niche: 'content_gen', layout: 5, description: 'Video script generator with storyboard, B-roll suggestions, and CTAs' },

  // BRANDING GENERATOR (5 layouts)
  { name: 'Branding — Identity Generator', slug: 'branding-identity', category: 'branding_generator', niche: 'branding', layout: 1, description: 'Complete brand identity generator with colors, fonts, and guidelines' },
  { name: 'Branding — Brand Name Generator', slug: 'branding-name-gen', category: 'branding_generator', niche: 'brand_gen', layout: 2, description: 'AI brand name generator with domain check and trademark search' },
  { name: 'Branding — Style Guide Builder', slug: 'branding-style-guide', category: 'branding_generator', niche: 'identity', layout: 3, description: 'Automated style guide builder with color, type, and component specs' },
  { name: 'Branding — Brand Voice Generator', slug: 'branding-voice', category: 'branding_generator', niche: 'brand_gen', layout: 4, description: 'Brand voice and tone generator with copy guidelines and examples' },
  { name: 'Branding — Rebrand Studio', slug: 'branding-rebrand', category: 'branding_generator', niche: 'branding', layout: 5, description: 'Rebrand studio with before/after, migration checklist, and rollout plan' },

  // LOGO GENERATOR (5 layouts)
  { name: 'Logo Gen — AI Logo Maker', slug: 'logo-ai-maker', category: 'logo_generator', niche: 'logo', layout: 1, description: 'AI logo maker with instant generation, variations, and file export' },
  { name: 'Logo Gen — Icon-Based Logos', slug: 'logo-icon', category: 'logo_generator', niche: 'logo_gen', layout: 2, description: 'Icon-focused logo generator with symbol library and color pairing' },
  { name: 'Logo Gen — Wordmark Generator', slug: 'logo-wordmark', category: 'logo_generator', niche: 'logo_gen', layout: 3, description: 'Typography-focused wordmark generator with font pairing and kerning' },
  { name: 'Logo Gen — Emblem & Badge', slug: 'logo-emblem', category: 'logo_generator', niche: 'brand_mark', layout: 4, description: 'Emblem and badge logo generator with vintage, modern, and minimal styles' },
  { name: 'Logo Gen — Animated Logo', slug: 'logo-animated', category: 'logo_generator', niche: 'logo_gen', layout: 5, description: 'Animated logo generator with motion presets and web-ready exports' },

  // IMAGE GENERATOR (5 layouts)
  { name: 'Image Gen — AI Art Studio', slug: 'image-ai-art', category: 'image_generator', niche: 'image_gen', layout: 1, description: 'AI art generation studio with prompt engineering and style transfer' },
  { name: 'Image Gen — Product Photography', slug: 'image-product', category: 'image_generator', niche: 'image_gen', layout: 2, description: 'AI product photography generator with background removal and scene placement' },
  { name: 'Image Gen — Social Graphics', slug: 'image-social-graphics', category: 'image_generator', niche: 'image_gen', layout: 3, description: 'Social media graphics generator with templates and brand kits' },
  { name: 'Image Gen — Hero Image Builder', slug: 'image-hero', category: 'image_generator', niche: 'image_gen', layout: 4, description: 'Website hero image generator with layout-aware composition' },
  { name: 'Image Gen — Batch Visual Factory', slug: 'image-batch', category: 'image_generator', niche: 'visual_gen', layout: 5, description: 'Batch visual generation factory for programmatic site imagery' },

  // APP PACK (5 layouts)
  { name: 'App Pack — Contractor App', slug: 'app-pack-contractor', category: 'app_pack', niche: 'app_pack', layout: 1, description: 'Complete contractor app pack with booking, quotes, and customer portal' },
  { name: 'App Pack — Retail App', slug: 'app-pack-retail', category: 'app_pack', niche: 'app_pack', layout: 2, description: 'Retail app pack with products, loyalty, and push notifications' },
  { name: 'App Pack — Service App', slug: 'app-pack-service', category: 'app_pack', niche: 'app_pack', layout: 3, description: 'Service business app pack with scheduling, payments, and reviews' },
  { name: 'App Pack — Community App', slug: 'app-pack-community', category: 'app_pack', niche: 'app_pack', layout: 4, description: 'Community app pack with feed, messaging, and events' },
  { name: 'App Pack — Media App', slug: 'app-pack-media', category: 'app_pack', niche: 'app_pack', layout: 5, description: 'Media app pack with content streaming, saved items, and offline mode' },

  // WEB PACK (5 layouts)
  { name: 'Web Pack — Business Launch', slug: 'web-pack-business', category: 'web_pack', niche: 'web_pack', layout: 1, description: 'Complete business website pack with home, about, services, and contact' },
  { name: 'Web Pack — E-Commerce Launch', slug: 'web-pack-ecom', category: 'web_pack', niche: 'web_pack', layout: 2, description: 'E-commerce launch pack with store, product pages, and checkout' },
  { name: 'Web Pack — SaaS Launch', slug: 'web-pack-saas', category: 'web_pack', niche: 'web_pack', layout: 3, description: 'SaaS launch pack with landing, pricing, docs, and dashboard' },
  { name: 'Web Pack — Portfolio Launch', slug: 'web-pack-portfolio', category: 'web_pack', niche: 'web_pack', layout: 4, description: 'Portfolio launch pack with gallery, case studies, and contact' },
  { name: 'Web Pack — Event Launch', slug: 'web-pack-event', category: 'web_pack', niche: 'web_pack', layout: 5, description: 'Event launch pack with schedule, speakers, registration, and sponsors' },

  // AI TOOL (5 layouts)
  { name: 'AI Tool — Code Generator', slug: 'ai-tool-code', category: 'ai_tool', niche: 'ai_tool', layout: 1, description: 'AI code generator with multi-language support and project scaffolding' },
  { name: 'AI Tool — Data Analyzer', slug: 'ai-tool-data', category: 'ai_tool', niche: 'ai_tool', layout: 2, description: 'AI data analyzer with charts, insights, and export' },
  { name: 'AI Tool — Workflow Builder', slug: 'ai-tool-workflow', category: 'ai_tool', niche: 'ai_tool', layout: 3, description: 'Visual workflow builder with AI-assisted automation and triggers' },
  { name: 'AI Tool — Research Assistant', slug: 'ai-tool-research', category: 'ai_tool', niche: 'ai_tool', layout: 4, description: 'AI research assistant with web search, citations, and report generation' },
  { name: 'AI Tool — Universal Generator', slug: 'ai-tool-universal', category: 'ai_tool', niche: 'ai_tool', layout: 5, description: 'Universal generator factory with template engine and provisioning' },
];

// Uploaded template mappings — universalized from the user's uploads
export const UPLOADED_TEMPLATE_MAP = [
  { source: 'UNIVERSAL_GENERATOR_FACTORY_BASE44_v1', category: 'ai_tool', niche: 'ai_tool', name: 'Universal Generator Factory', slug: 'universal-generator-factory' },
  { source: 'drop-fy-copy', category: 'ecommerce', niche: 'dropshipping', name: 'DropFy — Dropshipping Store', slug: 'dropfy-dropshipping' },
  { source: 'glidron-copy', category: 'ecommerce', niche: 'ecommerce', name: 'Glidron — Product Showcase', slug: 'glidron-product' },
  { source: 'local-leads-pro-copy', category: 'funnel', niche: 'lead_gen', name: 'Local Leads Pro — Lead Funnel', slug: 'local-leads-pro' },
  { source: 'margin-digital-agency-copy', category: 'agency', niche: 'agency', name: 'Margin — Digital Agency', slug: 'margin-agency' },
  { source: 'marketplace-11', category: 'marketplace', niche: 'marketplace', name: 'Marketplace — Multi-Vendor', slug: 'marketplace-multi-vendor' },
  { source: 'organic-dropshipping-theme-page-builder', category: 'ecommerce', niche: 'dropshipping', name: 'Organic Dropshipping — Page Builder', slug: 'organic-dropship-builder' },
  { source: 'prompt-lab-copy', category: 'ai_chat', niche: 'prompt_lab', name: 'Prompt Lab — Engineering Studio', slug: 'prompt-lab-studio' },
  { source: 'prompt-showcase-by-team44-copy', category: 'ai_chat', niche: 'prompt_showcase', name: 'Prompt Showcase — Gallery', slug: 'prompt-showcase-gallery' },
  { source: 'social-media-post-scheduler-copy', category: 'social', niche: 'scheduler', name: 'Social Post Scheduler', slug: 'social-post-scheduler' },
];