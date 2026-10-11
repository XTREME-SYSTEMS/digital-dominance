/** Universal Strategic Minds AI service taxonomy, versioned and approval-first. */
export const CATALOG_VERSION = 'eden-service-catalog-v1.0.0';
export const SERVICE_CATALOG = Object.freeze({
  idea_sprint: { title:'Idea-to-Blueprint Sprint', family:'Consulting', hours:6, reusable:true, requiresDiscovery:false },
  website_funnel: { title:'Premium Website & Lead Funnel', family:'Software', hours:18, reusable:true, requiresDiscovery:false },
  app_mvp: { title:'Custom App & SaaS MVP', family:'Software', hours:48, reusable:true, requiresDiscovery:false },
  client_portal: { title:'Customer & Business Portal', family:'Software', hours:38, reusable:true, requiresDiscovery:false },
  ecommerce: { title:'Ecommerce & Storefront', family:'Software', hours:32, reusable:true, requiresDiscovery:false },
  ai_agent: { title:'AI Assistant or Business Agent', family:'AI Agents', hours:28, reusable:true, requiresDiscovery:false },
  voice_assistant: { title:'Voice AI & Virtual Receptionist', family:'AI Agents', hours:36, reusable:true, requiresDiscovery:true },
  workflow_automation: { title:'Workflow & Operations Automation', family:'Automation', hours:18, reusable:true, requiresDiscovery:false },
  data_dashboard: { title:'Data Analytics & Dashboard', family:'Intelligence', hours:22, reusable:true, requiresDiscovery:false },
  data_pipeline: { title:'Data Integration & Intelligence Pipeline', family:'Intelligence', hours:30, reusable:true, requiresDiscovery:false },
  market_research: { title:'Market Research & Opportunity Intelligence', family:'Intelligence', hours:12, reusable:true, requiresDiscovery:false },
  ai_consulting: { title:'AI Strategy & Implementation Consulting', family:'Consulting', hours:8, reusable:false, requiresDiscovery:false },
  training: { title:'AI Training & Team Enablement', family:'Consulting', hours:9, reusable:true, requiresDiscovery:false },
  content_system: { title:'Content & Creative AI System', family:'Creative', hours:16, reusable:true, requiresDiscovery:false },
  growth_engine: { title:'SEO, Lead Attribution & Growth System', family:'Growth', hours:26, reusable:true, requiresDiscovery:false },
  enterprise_platform: { title:'Enterprise AI Operating System', family:'Software', hours:120, reusable:false, requiresDiscovery:true },
  custom: { title:'Something Entirely New', family:'Custom', hours:30, reusable:false, requiresDiscovery:true }
});
export const FEATURE_HOURS = Object.freeze({
  user_accounts:16, payments:24, bookings:10, dashboards:14,
  crm:14, ai_chat:18, voice:24, search:9, analytics:12,
  admin_portal:16, mobile_pwa:12, integrations:0,
  external_data:16, multitenant:28, upload_files:8,
  scheduling:10, notifications:8, maps:10
});
export const RESTRICTED_REVIEW = Object.freeze(['health','legal','financial','children','biometrics','employment','government','surveillance','personal_data']);
