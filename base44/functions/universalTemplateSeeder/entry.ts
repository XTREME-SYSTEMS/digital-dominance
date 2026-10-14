import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const mode = body.mode || 'seed';

    if (mode === 'seed') {
      return await seedTemplates(base44);
    } else if (mode === 'list') {
      return await listTemplates(base44, body);
    } else if (mode === 'stats') {
      return await getStats(base44);
    } else {
      return Response.json({ error: 'Unknown mode: ' + mode }, { status: 400 });
    }
  } catch (error) {
    console.error('Universal template seeder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function seedTemplates(base44) {
  // All universal template definitions — 85 templates across 17 categories
  const templates = [
    // E-COMMERCE
    { name: 'E-Commerce Store — Modern Grid', slug: 'ecom-modern-grid', category: 'ecommerce', niche: 'ecommerce', description: 'Clean product grid with instant search, cart drawer, and one-page checkout' },
    { name: 'E-Commerce Store — Luxury Boutique', slug: 'ecom-luxury-boutique', category: 'ecommerce', niche: 'ecommerce', description: 'Editorial-style product showcase with large imagery and story-driven product pages' },
    { name: 'E-Commerce Store — Dropshipping Minimal', slug: 'ecom-dropship-minimal', category: 'ecommerce', niche: 'dropshipping', description: 'Fast-loading single-product focus with social proof and urgency timers' },
    { name: 'E-Commerce Store — Marketplace Multi-Vendor', slug: 'ecom-marketplace', category: 'ecommerce', niche: 'marketplace', description: 'Multi-vendor marketplace with vendor profiles, product comparison, and reviews' },
    { name: 'E-Commerce Store — Subscription Box', slug: 'ecom-subscription', category: 'ecommerce', niche: 'ecommerce', description: 'Subscription-focused with plan picker, delivery schedule, and unboxing gallery' },

    // SaaS
    { name: 'SaaS — Dashboard Analytics', slug: 'saas-dashboard', category: 'saas', niche: 'saas', description: 'Data-rich dashboard with charts, KPIs, and real-time metrics' },
    { name: 'SaaS — Project Management', slug: 'saas-project-mgmt', category: 'saas', niche: 'saas', description: 'Kanban boards, task lists, team collaboration, and timeline views' },
    { name: 'SaaS — CRM Pipeline', slug: 'saas-crm', category: 'saas', niche: 'saas', description: 'Sales pipeline with deal stages, contact management, and activity tracking' },
    { name: 'SaaS — Marketing Landing', slug: 'saas-marketing', category: 'saas', niche: 'saas', description: 'High-converting SaaS marketing page with feature comparison and pricing' },
    { name: 'SaaS — API Documentation', slug: 'saas-api-docs', category: 'saas', niche: 'saas', description: 'Clean API docs with code examples, interactive playground, and search' },

    // AI CHAT & TOOLS
    { name: 'AI Chat — Conversational Assistant', slug: 'ai-chat-assistant', category: 'ai_chat', niche: 'ai_chat', description: 'Full-screen chat interface with streaming responses and tool calling' },
    { name: 'AI Chat — Prompt Lab Studio', slug: 'ai-prompt-lab', category: 'ai_chat', niche: 'prompt_lab', description: 'Prompt engineering workspace with versioning, testing, and sharing' },
    { name: 'AI Chat — Prompt Showcase Gallery', slug: 'ai-prompt-showcase', category: 'ai_chat', niche: 'prompt_showcase', description: 'Curated prompt gallery with categories, ratings, and one-click copy' },
    { name: 'AI Chat — Multi-Model Router', slug: 'ai-multi-model', category: 'ai_chat', niche: 'ai_tool', description: 'Multi-model AI router with model comparison, cost tracking, and fallback' },
    { name: 'AI Chat — Agent Builder', slug: 'ai-agent-builder', category: 'ai_chat', niche: 'ai_tool', description: 'Visual agent builder with tool configuration, memory, and deployment' },

    // PWA
    { name: 'PWA — Business App', slug: 'pwa-business', category: 'pwa', niche: 'pwa', description: 'Installable business app with offline support, push notifications, and bottom nav' },
    { name: 'PWA — E-Commerce App', slug: 'pwa-ecommerce', category: 'pwa', niche: 'pwa', description: 'Mobile shopping app with product browsing, cart, and one-tap checkout' },
    { name: 'PWA — Service Booking App', slug: 'pwa-booking', category: 'pwa', niche: 'pwa', description: 'Service booking app with calendar, reminders, and customer portal' },
    { name: 'PWA — Social Community App', slug: 'pwa-social', category: 'pwa', niche: 'pwa', description: 'Community app with feed, messaging, and member profiles' },
    { name: 'PWA — Content Media App', slug: 'pwa-media', category: 'pwa', niche: 'pwa', description: 'Media consumption app with articles, videos, and saved content' },

    // FUNNEL
    { name: 'Funnel — Lead Capture Squeeze', slug: 'funnel-lead-capture', category: 'funnel', niche: 'funnel', description: 'High-conversion squeeze page with opt-in form and instant delivery' },
    { name: 'Funnel — Webinar Registration', slug: 'funnel-webinar', category: 'funnel', niche: 'funnel', description: 'Webinar registration with countdown, speaker bios, and replay delivery' },
    { name: 'Funnel — Product Launch', slug: 'funnel-product-launch', category: 'funnel', niche: 'funnel', description: 'Multi-step product launch with video sales letter and order bump' },
    { name: 'Funnel — Local Lead Gen', slug: 'funnel-local-leads', category: 'funnel', niche: 'lead_gen', description: 'Local business lead funnel with quote form, map, and instant callback' },
    { name: 'Funnel — Tripwire Offer', slug: 'funnel-tripwire', category: 'funnel', niche: 'funnel', description: 'Low-ticket tripwire with upsell stack and one-click order' },

    // MARKETPLACE
    { name: 'Marketplace — Service Directory', slug: 'marketplace-services', category: 'marketplace', niche: 'marketplace', description: 'Service provider directory with search, reviews, and booking' },
    { name: 'Marketplace — Product Marketplace', slug: 'marketplace-products', category: 'marketplace', niche: 'marketplace', description: 'Multi-vendor product marketplace with vendor dashboards and payouts' },
    { name: 'Marketplace — Classifieds', slug: 'marketplace-classifieds', category: 'marketplace', niche: 'marketplace', description: 'Classified ads with categories, search, and messaging' },
    { name: 'Marketplace — Niche Directory', slug: 'marketplace-directory', category: 'marketplace', niche: 'marketplace', description: 'Niche industry directory with premium listings and lead forwarding' },
    { name: 'Marketplace — Comparison Platform', slug: 'marketplace-comparison', category: 'marketplace', niche: 'marketplace', description: 'Side-by-side comparison platform with filters and affiliate links' },

    // AGENCY
    { name: 'Agency — Digital Marketing', slug: 'agency-marketing', category: 'agency', niche: 'agency', description: 'Marketing agency site with services, case studies, and team showcase' },
    { name: 'Agency — Design Studio', slug: 'agency-design', category: 'agency', niche: 'design', description: 'Design studio portfolio with project gallery, process, and capabilities' },
    { name: 'Agency — Branding Studio', slug: 'agency-branding', category: 'agency', niche: 'branding', description: 'Branding agency with identity work, case studies, and brand guidelines' },
    { name: 'Agency — Dev Shop', slug: 'agency-dev', category: 'agency', niche: 'agency', description: 'Development agency with tech stack, project showcases, and process' },
    { name: 'Agency — Full-Service Creative', slug: 'agency-creative', category: 'agency', niche: 'agency', description: 'Full-service creative agency with immersive case studies and awards' },

    // SOCIAL
    { name: 'Social — Post Scheduler', slug: 'social-scheduler', category: 'social', niche: 'scheduler', description: 'Social media scheduler with calendar, multi-platform posting, and analytics' },
    { name: 'Social — Community Forum', slug: 'social-forum', category: 'social', niche: 'community', description: 'Community forum with threads, voting, and member profiles' },
    { name: 'Social — Feed Aggregator', slug: 'social-feed', category: 'social', niche: 'social', description: 'Multi-platform social feed aggregator with unified inbox' },
    { name: 'Social — Creator Platform', slug: 'social-creator', category: 'social', niche: 'social', description: 'Creator platform with content tools, monetization, and audience analytics' },
    { name: 'Social — Event Community', slug: 'social-events', category: 'social', niche: 'social', description: 'Event community with RSVPs, discussions, and attendee networking' },

    // PORTFOLIO
    { name: 'Portfolio — Photographer', slug: 'portfolio-photographer', category: 'portfolio', niche: 'photography', description: 'Photographer portfolio with full-screen galleries and client proofing' },
    { name: 'Portfolio — Designer', slug: 'portfolio-designer', category: 'portfolio', niche: 'creative', description: 'Designer portfolio with case studies, process, and capabilities' },
    { name: 'Portfolio — Developer', slug: 'portfolio-developer', category: 'portfolio', niche: 'creative', description: 'Developer portfolio with projects, blog, and tech stack showcase' },
    { name: 'Portfolio — Artist', slug: 'portfolio-artist', category: 'portfolio', niche: 'art', description: 'Artist portfolio with collection galleries and exhibition history' },
    { name: 'Portfolio — Studio', slug: 'portfolio-studio', category: 'portfolio', niche: 'creative', description: 'Studio portfolio with immersive project showcases and team' },

    // BOOKING
    { name: 'Booking — Service Appointment', slug: 'booking-service', category: 'booking', niche: 'booking', description: 'Service booking with calendar, staff selection, and payment' },
    { name: 'Booking — Restaurant Reservation', slug: 'booking-restaurant', category: 'booking', niche: 'reservation', description: 'Restaurant reservation with table selection, waitlist, and menu' },
    { name: 'Booking — Class & Event', slug: 'booking-events', category: 'booking', niche: 'calendar', description: 'Class and event booking with capacity, tickets, and reminders' },
    { name: 'Booking — Rental & Property', slug: 'booking-rental', category: 'booking', niche: 'booking', description: 'Property rental booking with availability calendar and pricing' },
    { name: 'Booking — Multi-Service', slug: 'booking-multi', category: 'booking', niche: 'appointment', description: 'Multi-service booking with provider directory and package deals' },

    // CONTENT GENERATOR
    { name: 'Content Gen — Blog Writer', slug: 'content-blog-writer', category: 'content_generator', niche: 'content_gen', description: 'AI blog writer with SEO optimization, topic research, and scheduling' },
    { name: 'Content Gen — SEO Content Factory', slug: 'content-seo-factory', category: 'content_generator', niche: 'seo_content', description: 'Programmatic SEO content factory with bulk generation and indexing' },
    { name: 'Content Gen — Social Content', slug: 'content-social', category: 'content_generator', niche: 'content_gen', description: 'Social media content generator with captions, hashtags, and scheduling' },
    { name: 'Content Gen — Email Sequence', slug: 'content-email', category: 'content_generator', niche: 'content_gen', description: 'Email sequence generator with templates, personalization, and automation' },
    { name: 'Content Gen — Video Script', slug: 'content-video-script', category: 'content_generator', niche: 'content_gen', description: 'Video script generator with storyboard, B-roll suggestions, and CTAs' },

    // BRANDING GENERATOR
    { name: 'Branding — Identity Generator', slug: 'branding-identity', category: 'branding_generator', niche: 'branding', description: 'Complete brand identity generator with colors, fonts, and guidelines' },
    { name: 'Branding — Brand Name Generator', slug: 'branding-name-gen', category: 'branding_generator', niche: 'brand_gen', description: 'AI brand name generator with domain check and trademark search' },
    { name: 'Branding — Style Guide Builder', slug: 'branding-style-guide', category: 'branding_generator', niche: 'identity', description: 'Automated style guide builder with color, type, and component specs' },
    { name: 'Branding — Brand Voice Generator', slug: 'branding-voice', category: 'branding_generator', niche: 'brand_gen', description: 'Brand voice and tone generator with copy guidelines and examples' },
    { name: 'Branding — Rebrand Studio', slug: 'branding-rebrand', category: 'branding_generator', niche: 'branding', description: 'Rebrand studio with before/after, migration checklist, and rollout plan' },

    // LOGO GENERATOR
    { name: 'Logo Gen — AI Logo Maker', slug: 'logo-ai-maker', category: 'logo_generator', niche: 'logo', description: 'AI logo maker with instant generation, variations, and file export' },
    { name: 'Logo Gen — Icon-Based Logos', slug: 'logo-icon', category: 'logo_generator', niche: 'logo_gen', description: 'Icon-focused logo generator with symbol library and color pairing' },
    { name: 'Logo Gen — Wordmark Generator', slug: 'logo-wordmark', category: 'logo_generator', niche: 'logo_gen', description: 'Typography-focused wordmark generator with font pairing and kerning' },
    { name: 'Logo Gen — Emblem & Badge', slug: 'logo-emblem', category: 'logo_generator', niche: 'brand_mark', description: 'Emblem and badge logo generator with vintage, modern, and minimal styles' },
    { name: 'Logo Gen — Animated Logo', slug: 'logo-animated', category: 'logo_generator', niche: 'logo_gen', description: 'Animated logo generator with motion presets and web-ready exports' },

    // IMAGE GENERATOR
    { name: 'Image Gen — AI Art Studio', slug: 'image-ai-art', category: 'image_generator', niche: 'image_gen', description: 'AI art generation studio with prompt engineering and style transfer' },
    { name: 'Image Gen — Product Photography', slug: 'image-product', category: 'image_generator', niche: 'image_gen', description: 'AI product photography generator with background removal and scene placement' },
    { name: 'Image Gen — Social Graphics', slug: 'image-social-graphics', category: 'image_generator', niche: 'image_gen', description: 'Social media graphics generator with templates and brand kits' },
    { name: 'Image Gen — Hero Image Builder', slug: 'image-hero', category: 'image_generator', niche: 'image_gen', description: 'Website hero image generator with layout-aware composition' },
    { name: 'Image Gen — Batch Visual Factory', slug: 'image-batch', category: 'image_generator', niche: 'visual_gen', description: 'Batch visual generation factory for programmatic site imagery' },

    // APP PACK
    { name: 'App Pack — Contractor App', slug: 'app-pack-contractor', category: 'app_pack', niche: 'app_pack', description: 'Complete contractor app pack with booking, quotes, and customer portal' },
    { name: 'App Pack — Retail App', slug: 'app-pack-retail', category: 'app_pack', niche: 'app_pack', description: 'Retail app pack with products, loyalty, and push notifications' },
    { name: 'App Pack — Service App', slug: 'app-pack-service', category: 'app_pack', niche: 'app_pack', description: 'Service business app pack with scheduling, payments, and reviews' },
    { name: 'App Pack — Community App', slug: 'app-pack-community', category: 'app_pack', niche: 'app_pack', description: 'Community app pack with feed, messaging, and events' },
    { name: 'App Pack — Media App', slug: 'app-pack-media', category: 'app_pack', niche: 'app_pack', description: 'Media app pack with content streaming, saved items, and offline mode' },

    // WEB PACK
    { name: 'Web Pack — Business Launch', slug: 'web-pack-business', category: 'web_pack', niche: 'web_pack', description: 'Complete business website pack with home, about, services, and contact' },
    { name: 'Web Pack — E-Commerce Launch', slug: 'web-pack-ecom', category: 'web_pack', niche: 'web_pack', description: 'E-commerce launch pack with store, product pages, and checkout' },
    { name: 'Web Pack — SaaS Launch', slug: 'web-pack-saas', category: 'web_pack', niche: 'web_pack', description: 'SaaS launch pack with landing, pricing, docs, and dashboard' },
    { name: 'Web Pack — Portfolio Launch', slug: 'web-pack-portfolio', category: 'web_pack', niche: 'web_pack', description: 'Portfolio launch pack with gallery, case studies, and contact' },
    { name: 'Web Pack — Event Launch', slug: 'web-pack-event', category: 'web_pack', niche: 'web_pack', description: 'Event launch pack with schedule, speakers, registration, and sponsors' },

    // AI TOOL
    { name: 'AI Tool — Code Generator', slug: 'ai-tool-code', category: 'ai_tool', niche: 'ai_tool', description: 'AI code generator with multi-language support and project scaffolding' },
    { name: 'AI Tool — Data Analyzer', slug: 'ai-tool-data', category: 'ai_tool', niche: 'ai_tool', description: 'AI data analyzer with charts, insights, and export' },
    { name: 'AI Tool — Workflow Builder', slug: 'ai-tool-workflow', category: 'ai_tool', niche: 'ai_tool', description: 'Visual workflow builder with AI-assisted automation and triggers' },
    { name: 'AI Tool — Research Assistant', slug: 'ai-tool-research', category: 'ai_tool', niche: 'ai_tool', description: 'AI research assistant with web search, citations, and report generation' },
    { name: 'AI Tool — Universal Generator', slug: 'ai-tool-universal', category: 'ai_tool', niche: 'ai_tool', description: 'Universal generator factory with template engine and provisioning' },

    // UPLOADED TEMPLATES — universalized from user's uploads
    { name: 'Universal Generator Factory', slug: 'universal-generator-factory', category: 'ai_tool', niche: 'ai_tool', description: 'Full generator factory system with template engine, AI consulting generators, provisioning, and validation mesh', tags: ['uploaded', 'universal-generator'] },
    { name: 'DropFy — Dropshipping Store', slug: 'dropfy-dropshipping', category: 'ecommerce', niche: 'dropshipping', description: 'Complete dropshipping store template with product grid, cart, and conversion-optimized checkout', tags: ['uploaded', 'dropshipping'] },
    { name: 'Glidron — Product Showcase', slug: 'glidron-product', category: 'ecommerce', niche: 'ecommerce', description: 'Product showcase e-commerce template with immersive product pages and gallery', tags: ['uploaded', 'ecommerce'] },
    { name: 'Local Leads Pro — Lead Funnel', slug: 'local-leads-pro', category: 'funnel', niche: 'lead_gen', description: 'Local lead generation funnel with quote forms, legal compliance, and instant callback', tags: ['uploaded', 'lead-gen'] },
    { name: 'Margin — Digital Agency', slug: 'margin-agency', category: 'agency', niche: 'agency', description: 'Full-service digital agency template with case studies, team, services, and portfolio', tags: ['uploaded', 'agency'] },
    { name: 'Marketplace — Multi-Vendor Platform', slug: 'marketplace-multi-vendor', category: 'marketplace', niche: 'marketplace', description: 'Multi-vendor marketplace platform with vendor dashboards, product listings, and transactions', tags: ['uploaded', 'marketplace'] },
    { name: 'Organic Dropshipping — Page Builder', slug: 'organic-dropship-builder', category: 'ecommerce', niche: 'dropshipping', description: 'Dropshipping page builder with theme customization and product page builder', tags: ['uploaded', 'dropshipping'] },
    { name: 'Prompt Lab — Engineering Studio', slug: 'prompt-lab-studio', category: 'ai_chat', niche: 'prompt_lab', description: 'Prompt engineering studio with source input, language toggle, and animated loaders', tags: ['uploaded', 'prompt-lab'] },
    { name: 'Prompt Showcase — Gallery', slug: 'prompt-showcase-gallery', category: 'ai_chat', niche: 'prompt_showcase', description: 'Prompt showcase gallery with visual editing, categorization, and sharing', tags: ['uploaded', 'prompt-showcase'] },
    { name: 'Social Post Scheduler', slug: 'social-post-scheduler', category: 'social', niche: 'scheduler', description: 'Social media post scheduler with calendar view, multi-platform support, and analytics', tags: ['uploaded', 'social'] },
  ];

  // Use upsert to avoid duplicates — key on slug
  const records = templates.map(t => ({
    name: t.name,
    slug: t.slug,
    category: t.category,
    niche: t.niche,
    description: t.description,
    is_active: true,
    is_default: true,
    status: 'active',
    version: '1.0',
    tags: t.tags || ['universal'],
    sort_order: 0,
  }));

  const result = await base44.asServiceRole.entities.TemplateLibrary.upsert(records, { key: 'slug' });

  return Response.json({
    ok: true,
    data: {
      totalSeeded: records.length,
      created: result.created,
      updated: result.updated,
      categories: [...new Set(templates.map(t => t.category))],
    }
  });
}

async function listTemplates(base44, body) {
  const category = body.category;
  const query = { is_active: true };
  if (category && category !== 'all') {
    query.category = category;
  }
  const result = await base44.entities.TemplateLibrary.filter(query, { sort: 'sort_order', limit: 100, fields: ['name', 'slug', 'category', 'niche', 'description', 'preview_image_url'] });
  return Response.json({ ok: true, data: { templates: result.items || [] } });
}

async function getStats(base44) {
  const [allTemplates, activeTemplates] = await Promise.all([
    base44.entities.TemplateLibrary.count({ is_active: true }),
    base44.entities.TemplateLibrary.filter({}, { limit: 200, fields: ['category', 'niche'] }),
  ]);

  const byCategory = {};
  (activeTemplates.items || []).forEach(t => {
    const cat = t.category || 'unknown';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  });

  return Response.json({
    ok: true,
    data: {
      total: allTemplates,
      byCategory,
    }
  });
}