import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal, inject, computed, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { VideoHero } from '../../shared/video-hero/video-hero';
import { FeaturedCaseStudySectionComponent } from '../../shared/sections/featured-case-study/featured-case-study';
import { SeoMetaService } from '../../app/services/seo-meta.service';

interface StructuredOfferSection {
  id: string;
  title: string;
  body?: string;
  bullets?: string[];
  image?: {
    src: string;
    alt: string;
    caption?: string;
  };
}

interface StructuredOfferContent {
  title: string;
  summary: string;
  duration?: string;      // e.g., "4 Weeks"
  delivery?: string;      // e.g., "Remote or Hybrid"
  pricing?: string;       // e.g., "Custom"
  category?: string;      // e.g., "Data&AI"
  sections: StructuredOfferSection[];
}

const STRUCTURED_OFFER_CONTENT: Record<string, StructuredOfferContent> = {
  'sql-server-migration-to-azure': {
    title: 'SQL Server Migration to Azure',
    summary: 'Oakwood’s SQL Server Migration Service provides a focused, end-to-end engagement for migrating SQL Server databases to Azure SQL Managed Instance or Azure SQL Database. It helps organizations modernize data environments, reduce licensing costs, and unlock Azure-native scalability, security, and analytics.',
    duration: '4 Weeks',
    delivery: 'Remote or Hybrid',
    pricing: 'Custom',
    category: 'data-and-ai',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        body: 'Oakwood’s SQL Server Migration Service delivers a focused, end-to-end engagement for moving SQL Server databases to Azure SQL Managed Instance or Azure SQL Database. The offer modernizes your data platform, reduces licensing overhead, and enables Azure-native performance, security, and analytics outcomes.'
      },
      {
        id: 'what-you-will-gain',
        title: 'What You Will Gain',
        bullets: [
          'Reduce costs by moving off legacy SQL infrastructure.',
          'Improve scalability, high availability, and disaster recovery.',
          'Simplify management with Azure-native services.',
          'Ensure compliance with enterprise-grade security and governance.'
        ]
      },
      {
        id: 'what-is-included',
        title: 'What Is Included',
        body: 'Delivery approach and scope include assessment, migration, validation, and optimization to ensure measurable value.',
        bullets: [
          'Assessment & Planning: Evaluate workloads, schemas, and build a migration plan.',
          'Migration & Validation: Execute migration and validate performance, security, and compliance.',
          'Optimization & Enablement: Apply indexing and tuning, then provide documentation and training.',
          'Deliverables: Migration of targeted SQL Server databases to Azure SQL.',
          'Deliverables: Performance validation and optimization report.',
          'Deliverables: Training and documentation for IT teams (if applicable).'
        ]
      },
      {
        id: 'engagement-timeline',
        title: 'Engagement Timeline',
        body: '4–6 Weeks'
      },
      {
        id: 'who-this-offer-is-for',
        title: 'Who This Offer Is For',
        bullets: [
          'Organizations looking to modernize SQL Server workloads.',
          'Companies wanting to reduce licensing costs and improve scalability.',
          'Teams that need Azure-native security, compliance, and analytics capabilities.'
        ]
      },
      {
        id: 'prerequisites',
        title: 'Prerequisites',
        bullets: [
          'Existing SQL Server databases ready for migration.',
          'Access to Azure subscription and resources.',
          'Stakeholder availability for planning and validation.'
        ]
      }
    ]
  },

  'microsoft-fabric-poc': {


    title: 'Microsoft fabric POC',
    summary: 'Stand up a production-ready Microsoft Fabric environment that consolidates data from multiple systems and enables unified business insights with a scalable, cost-effective architecture.',
    duration: '4 Weeks',
    delivery: 'Remote or Hybrid',
    pricing: 'Custom',
    category: 'data-and-ai',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        body: 'This Microsoft Fabric PoC delivers a production-oriented foundation that unifies data from priority sources and prepares your organization for enterprise analytics and BI expansion.'
      },
      {
        id: 'what-you-will-gain',
        title: 'What You Will Gain',
        bullets: [
          'Modernization of legacy systems.',
          'Production platform for unified business insights.',
          'Scalable architecture.',
          'Cost-effective solution.'
        ]
      },
      {
        id: 'what-is-included',
        title: 'What Is Included',
        body: 'The PoC includes implementation and practical deliverables for immediate analytics readiness.',
        bullets: [
          'Production implemented Fabric workspace.',
          'Two data sources transformed and ready for BI.',
          'Roadmap for scaling Fabric adoption.'
        ]
      },
      {
        id: 'engagement-timeline',
        title: 'Engagement Timeline',
        body: 'Week 1: Discovery & Design. Weeks 2–3: Build & Integration. Week 4: Testing & Roadmap. Overall: 4–6 Weeks.'
      },
      {
        id: 'who-this-offer-is-for',
        title: 'Who This Offer Is For',
        bullets: [
          'Organizations looking to consolidate data for analytics.',
          'Teams wanting quick insights from multiple data sources.',
          'Businesses planning to modernize legacy systems and adopt Microsoft Fabric.'
        ]
      },
      {
        id: 'prerequisites',
        title: 'Prerequisites',
        bullets: [
          'Client has an existing Azure tenant with storage setup.',
          'Volume/complexity of data may impact schedule and budget.',
          'Client provides data and business rules for simple ETL.'
        ]
      }
    ]
  },
  'data-readiness-assessment-for-ai': {


    title: 'Data readiness assessment for AI',
    summary: 'Assess whether your current data environment can effectively support AI initiatives and receive a practical roadmap to close readiness gaps.',
    duration: '4 Weeks',
    delivery: 'Remote or Hybrid',
    pricing: '$20,000',
    category: 'data-and-ai',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        body: 'This engagement evaluates your data infrastructure, governance, and accessibility to determine AI readiness and define a clear path forward for implementation.'
      },
      {
        id: 'what-you-will-gain',
        title: 'What You Will Gain',
        bullets: [
          'AI Readiness: Understand if your data infrastructure can support AI solutions.',
          'Actionable Roadmap: Prioritized plan to address gaps in data quality, accessibility, and governance.',
          'Strategic Insights: Align your data strategy with AI goals and future initiatives.',
          'Cost Savings: Avoid unnecessary investments by targeting the exact improvements needed.'
        ]
      },
      {
        id: 'what-is-included',
        title: 'What Is Included',
        body: 'Comprehensive assessment outputs and recommendations designed to improve AI readiness quickly and clearly.',
        bullets: [
          'Detailed report on current data environment and AI-readiness alignment.',
          'Gap analysis highlighting areas needing improvement.',
          'Tailored roadmap with prioritized recommendations.',
          'Suggested best practices for data management and governance.'
        ]
      },
      {
        id: 'engagement-timeline',
        title: 'Engagement Timeline',
        body: 'Week 1: Discovery and stakeholder interviews. Weeks 2–3: Analysis and gap identification. Week 4: Recommendations and roadmap delivery. Overall Duration: 4 Weeks.'
      },
      {
        id: 'who-this-offer-is-for',
        title: 'Who This Offer Is For',
        bullets: [
          'Organizations of all sizes (SMCs to enterprises) aiming to leverage AI effectively.',
          'Teams looking to assess their data readiness for AI adoption.',
          'Businesses seeking a clear roadmap to optimize data infrastructure for AI initiatives.'
        ]
      },
      {
        id: 'prerequisites',
        title: 'Prerequisites',
        bullets: [
          'Access to current data sources, integrations, and governance documentation.',
          'Stakeholder availability for interviews.',
          'Existing Azure environment (recommended) for practical alignment with services like Synapse Analytics, Azure Machine Learning, and Azure OpenAI.'
        ]
      }
    ]
  },
  'unified-data-estate-migration': {

    title: 'Unified data estate migration',
    summary: 'Consolidate siloed data into a unified, scalable platform using Azure Synapse or Microsoft Fabric to enable analytics and AI at enterprise scale.',
    duration: '12–16 Weeks',
    delivery: 'Remote or Hybrid',
    pricing: '$160,000 (Estimate)',
    category: 'data-and-ai',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        body: 'This engagement modernizes fragmented data environments into a governed, secure, and cloud-scale estate optimized for enterprise analytics and future AI adoption.'
      },
      {
        id: 'what-you-will-gain',
        title: 'What You Will Gain',
        bullets: [
          'Enterprise-Grade Data Estate: Unified, scalable data platform for analytics and AI.',
          'Improved Governance & Security: Compliant and secure data environment.',
          'Cost Savings: Retire legacy data platforms efficiently.',
          'Future-Ready Foundation: Enables cloud-scale analytics and AI adoption.'
        ]
      },
      {
        id: 'what-is-included',
        title: 'What Is Included',
        body: 'The engagement includes platform consolidation, governance setup, and enablement assets for sustained adoption.',
        bullets: [
          'Consolidated data estate in Azure Synapse or Microsoft Fabric.',
          'Governance framework using Microsoft Purview.',
          'Documentation, training for IT/analytics teams, and adoption roadmap.'
        ]
      },
      {
        id: 'engagement-timeline',
        title: 'Engagement Timeline',
        body: 'Phase 1 – Assessment & Planning: Review current environment, map data sources (up to 6), design target architecture, develop migration strategy. Phase 2 – Migration & Validation: Migrate and consolidate data, configure Microsoft Purview, validate performance, accessibility, and security. Phase 3 – Optimization & Enablement: Optimize for performance and cost, train teams, deliver roadmap for advanced analytics/AI. Overall Duration: 12–16 Weeks.'
      },
      {
        id: 'who-this-offer-is-for',
        title: 'Who This Offer Is For',
        bullets: [
          'Organizations with siloed data looking to modernize their data platforms.',
          'Enterprises aiming to consolidate multiple data sources for analytics and AI.',
          'Teams seeking governance, compliance, and cloud-scale readiness.'
        ]
      },
      {
        id: 'prerequisites',
        title: 'Prerequisites',
        bullets: [
          'Access to existing data sources and associated documentation.',
          'Volume and complexity of data may impact schedule and budget.',
          'Oakwood will set up an Azure tenant to support the data warehouse.'
        ]
      }
    ]

  },


  'ai-agent-in-a-day-workshop': {

    title: 'AI Agent in a Day Workshop',
    summary: 'Rapidly prototype and deploy a practical AI agent in a focused one-day workshop using Microsoft Copilot Studio and Power Platform.',
    duration: '1 Day (Onsite or Virtual)',
    delivery: 'Remote or Hybrid',
    pricing: '$8,000',
    category: 'application-innovation',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        body: 'This one-day engagement helps your team quickly explore business use cases, co-build a working AI agent, and define a practical plan for scaling AI-driven automation.'
      },
      {
        id: 'what-you-will-gain',
        title: 'What You Will Gain',
        bullets: [
          'Rapid AI Exposure: Hands-on experience with Microsoft Copilot Studio and Power Platform.',
          'Tangible Prototype: Functional AI agent built in a single day.',
          'Clear Roadmap: Recommendations for scaling low-code AI agents across your organization.',
          'Team Empowerment: Business and IT stakeholders co-innovate and explore AI-driven automation.'
        ]
      },
      {
        id: 'what-is-included',
        title: 'What Is Included',
        body: 'Workshop outputs include a working prototype and practical next steps for implementation and governance.',
        bullets: [
          'Functional AI agent prototype tailored to a chosen use case.',
          'Workshop summary with prioritized use cases for future development.',
          'Roadmap for expanding and governing AI agents at scale.'
        ]
      },
      {
        id: 'engagement-timeline',
        title: 'Engagement Timeline',
        body: 'Morning Session – Discovery & Ideation: Identify high-value scenarios, review data sources, integrations, and governance. Afternoon Session – Build & Deploy: Guided build of AI agent, connect to at least one enterprise dataset, demo and iterate. Wrap-Up & Roadmap: Showcase prototype, provide recommendations for scaling and governance. Overall Duration: 1 Day (Onsite or Virtual).'
      },
      {
        id: 'who-this-offer-is-for',
        title: 'Who This Offer Is For',
        bullets: [
          'Organizations looking to rapidly explore AI agents for business processes.',
          'Teams wanting a hands-on, low-code experience with Copilot Studio.',
          'Stakeholders aiming to identify high-value automation opportunities and create quick prototypes.'
        ]
      },
      {
        id: 'prerequisites',
        title: 'Prerequisites',
        bullets: [
          'Access to at least one enterprise dataset or system for real-world workflow integration.',
          'Stakeholder availability for the full-day workshop.',
          'Existing Microsoft environment with Power Platform and Copilot Studio (recommended).'
        ]
      }
    ]

  },
  'ai-application-modernization-assessment': {

    title: 'AI Application Modernization Assessment',
    summary: 'Evaluate your applications for AI integration opportunities and define practical modernization paths aligned to business outcomes.',
    duration: '6 Weeks',
    delivery: 'Remote or Hybrid',
    pricing: '$30,000',
    category: 'application-innovation',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        body: 'This engagement evaluates your application portfolio to identify where AI can deliver the most impact, assess technical and data readiness, and produce a prioritized modernization roadmap.'
      },
      {
        id: 'what-you-will-gain',
        title: 'What You Will Gain',
        bullets: [
          'Informed Decision-Making: Clear understanding of where AI integration can deliver the most impact.',
          'Strategic Insights: Expert analysis on application portfolio readiness, technical feasibility, and potential ROI.',
          'Risk Mitigation: Early identification of challenges for smoother AI adoption.',
          'Tailored Roadmap: Detailed, actionable plan aligning AI opportunities with business objectives.',
          'Foundation for Innovation: Modernized application portfolio supporting long-term growth and competitiveness.'
        ]
      },
      {
        id: 'what-is-included',
        title: 'What Is Included',
        body: 'Assessment outputs include clear findings, readiness analysis, and a practical implementation direction.',
        bullets: [
          'Comprehensive assessment report outlining AI integration opportunities across applications.',
          'Gap analysis detailing technical and data readiness for AI.',
          'Prioritized modernization roadmap with actionable recommendations.',
          'High-level implementation plan covering architecture updates, data alignment, and AI feature integration.'
        ]
      },
      {
        id: 'engagement-timeline',
        title: 'Engagement Timeline',
        body: 'Weeks 1–2 – Discovery: Workshops and stakeholder interviews to understand current applications and business goals. Weeks 3–4 – Analysis: Application portfolio review and AI opportunity assessment. Weeks 5–6 – Recommendation: Roadmap creation and delivery of prioritized modernization recommendations. Overall Duration: 6 Weeks.'
      },
      {
        id: 'who-this-offer-is-for',
        title: 'Who This Offer Is For',
        bullets: [
          'Organizations with legacy applications seeking modernization through AI.',
          'Teams looking to evaluate application portfolio readiness for AI integration.',
          'SMCs and enterprises aiming to streamline workflows, enhance performance, and gain a competitive edge with AI.'
        ]
      },
      {
        id: 'prerequisites',
        title: 'Prerequisites',
        bullets: [
          'Access to current application portfolio details, architecture, integrations, and data dependencies.',
          'Availability of key stakeholders for workshops and interviews.',
          'Existing Azure environment recommended for AI feasibility alignment.'
        ]
      }
    ]

  },
  'copilot-extensibility-workshop': {

    title: 'Copilot extensibility workshop',
    summary: 'Learn how to extend Microsoft Copilot beyond standard functionality through a focused workshop that aligns business priorities with practical extensibility options.',
    duration: '1–2 Days',
    delivery: 'Remote or Hybrid',
    pricing: '$30,000',
    category: 'application-innovation',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        body: 'This workshop helps your team identify high-value Copilot extensibility opportunities, align them to business processes, and define a clear path from concepts to proof of concept or implementation.'
      },
      {
        id: 'what-you-will-gain',
        title: 'What You Will Gain',
        bullets: [
          'Clarity on Extensibility: Clear understanding of how Microsoft Copilot can be extended beyond standard functionality.',
          'Business–Technology Alignment: Alignment between priority business processes and available extensibility options.',
          'Reduced Risk: Ideas grounded in proven Microsoft patterns, security, and governance best practices.',
          'Actionable Roadmap: Defined next steps to move from concept to proof of concept or implementation.'
        ]
      },
      {
        id: 'what-is-included',
        title: 'What Is Included',
        body: 'The workshop includes facilitated sessions and documented outputs to support decision-making and next-step planning.',
        bullets: [
          'Facilitated Copilot Extensibility Workshop sessions.',
          'Documented and prioritized extensibility use cases.',
          'High-level architecture and integration guidance.',
          'Recommended roadmap outlining next steps.'
        ]
      },
      {
        id: 'engagement-timeline',
        title: 'Engagement Timeline',
        body: 'Discovery & Context Setting: Review Copilot usage, adoption goals, priority processes, and integration needs. Extensibility Concepts & Demonstrations: Overview of plugins, connectors, APIs, Power Platform; real-world demos; governance and security discussion. Use Case Definition & Roadmap: Prioritize use cases, outline technical approaches, define next steps. Overall Duration: Typically 1–2 Days (depending on scope and number of use cases).'
      },
      {
        id: 'who-this-offer-is-for',
        title: 'Who This Offer Is For',
        bullets: [
          'Organizations already using Microsoft Copilot and seeking deeper value.',
          'Teams looking to integrate Copilot with internal systems, data, and workflows.',
          'Business and IT leaders exploring advanced Copilot capabilities before committing to implementation.'
        ]
      },
      {
        id: 'prerequisites',
        title: 'Prerequisites',
        bullets: [
          'Microsoft Copilot licenses in place.',
          'Access to relevant stakeholders, systems, and documentation.',
          'Understanding that this workshop focuses on ideation and planning (full implementation scoped separately).'
        ]
      }
    ]

  },
  'custom-copilot-development': {

    title: 'Custom Copilot Development',
    summary: 'Build and validate a department-specific custom Copilot using a prototype-first approach before full-scale enterprise rollout.',
    duration: '8 Weeks',
    delivery: 'Remote or Hybrid',
    pricing: '$90,000',
    category: 'application-innovation',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        body: 'This engagement delivers a functional custom Copilot prototype for a specific department or use case, validates outcomes in a controlled pilot, and defines a roadmap for secure enterprise scaling.'
      },
      {
        id: 'what-you-will-gain',
        title: 'What You Will Gain',
        bullets: [
          'Rapid Validation: Confirm the value of a department-specific custom Copilot before full-scale investment.',
          'Hands-On AI Integration: Practical experience with Azure OpenAI and Microsoft Graph connectors.',
          'Reduced Risk: Prototype-first approach to validate outcomes in a controlled environment.',
          'Enterprise Roadmap: Clear path for scaling Copilot securely and strategically across the organization.'
        ]
      },
      {
        id: 'what-is-included',
        title: 'What Is Included',
        body: 'The engagement includes prototype delivery, enterprise data integration, and validation outputs to guide scale-up decisions.',
        bullets: [
          'Functional custom Copilot prototype tailored to a specific department or use case.',
          'Integration with one or more enterprise data sources via Microsoft Graph connectors.',
          'Defined success metrics and validation report.',
          'Roadmap for scaling Copilot deployment and governance.'
        ]
      },
      {
        id: 'engagement-timeline',
        title: 'Engagement Timeline',
        body: 'Weeks 1–2 – Ideation & Scoping: Stakeholder workshops, use case definition, data and integration assessment, success metric alignment. Weeks 3–6 – Build & Deploy PoC: Develop prototype, integrate enterprise data, configure prompts, workflows, and security controls. Weeks 7–8 – Testing & Roadmap: Pilot with selected business unit (e.g., Sales, HR, Legal), gather feedback, validate outcomes, deliver scaling roadmap. Overall Duration: 8 Weeks.'
      },
      {
        id: 'who-this-offer-is-for',
        title: 'Who This Offer Is For',
        bullets: [
          'Organizations seeking to extend Microsoft 365 with department-specific AI capabilities.',
          'Teams looking to validate custom Copilot use cases before enterprise rollout.',
          'Business units (Sales, HR, Legal, etc.) aiming to enhance productivity with AI-driven workflows.'
        ]
      },
      {
        id: 'prerequisites',
        title: 'Prerequisites',
        bullets: [
          'Microsoft 365 environment with appropriate licensing.',
          'Access to relevant enterprise data sources and systems.',
          'Stakeholder participation for workshops, pilot testing, and validation.',
          'Alignment on defined success metrics for PoC evaluation.'
        ]
      }
    ]

  },

  'application-migration-to-azure': {

    title: 'Application migration to Azure',
    summary: 'Seamlessly migrate your applications to Azure with a structured, low-risk approach focused on performance, security, and cost efficiency.',
    duration: '8 Weeks',
    delivery: 'Remote or Hybrid',
    pricing: '$100,000',
    category: 'cloud-and-infrastructure',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        body: 'This engagement migrates agreed-upon applications to Azure using a phased plan that prioritizes business continuity, security, compliance, and post-migration optimization.'
      },
      {
        id: 'what-you-will-gain',
        title: 'What You Will Gain',
        bullets: [
          'Lower Infrastructure Costs: Reduce on-premises and legacy operational expenses.',
          'Improved Scalability & Performance: Leverage Azure-native services for elastic, high-performing workloads.',
          'Secure & Compliant Migration: Align workloads with Azure security and compliance best practices.',
          'Low-Risk Transition: Structured migration approach backed by proven Azure expertise.'
        ]
      },
      {
        id: 'what-is-included',
        title: 'What Is Included',
        body: 'Scope includes migration execution, validation, optimization, and enablement deliverables for IT handover.',
        bullets: [
          'Migration of agreed-upon applications to Azure (IaaS, PaaS, or containerized environments).',
          'Performance, compliance, and integration validation testing.',
          'Post-migration optimization for cost and performance.',
          'Documentation and knowledge transfer for IT teams.'
        ]
      },
      {
        id: 'engagement-timeline',
        title: 'Engagement Timeline',
        body: 'Discovery & Planning: Assess applications, dependencies, infrastructure; define migration plan, timelines, and risk mitigation strategy. Migration Execution: Migrate workloads to Azure, validate integrations, security, and performance. Optimization & Handover: Tune workloads for cost efficiency and performance; deliver training and documentation. Overall Duration: 8–10 Weeks.'
      },
      {
        id: 'who-this-offer-is-for',
        title: 'Who This Offer Is For',
        bullets: [
          'Organizations migrating applications from on-premises or other cloud platforms to Azure.',
          'Enterprises seeking infrastructure modernization and cost optimization.',
          'IT teams looking for a structured, secure cloud migration approach.'
        ]
      },
      {
        id: 'prerequisites',
        title: 'Prerequisites',
        bullets: [
          'Access to application architecture, infrastructure documentation, and dependencies.',
          'Stakeholder and IT team availability during migration planning and validation.',
          'Azure subscription in place (or agreement to provision one as part of engagement).'
        ]
      }
    ]

  }
  ,
  'semisol-security-essentials-poc': {

    title: 'Semisol security essentials POC',
    summary: 'Validate Microsoft Sentinel as a cloud-native SIEM/SOAR foundation with a production-ready proof of concept focused on visibility, detection, and response.',
    duration: '4–6 Weeks',
    delivery: 'Remote or Hybrid',
    pricing: '$20000',
    category: 'cloud-and-infrastructure',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        body: 'This engagement establishes a production-ready Microsoft Sentinel foundation, connects priority security data sources, and validates analytics and automation to accelerate SOC readiness.'
      },
      {
        id: 'what-you-will-gain',
        title: 'What You Will Gain',
        bullets: [
          'Centralized Security Visibility: Unified view across security signals, logs, and threat intelligence.',
          'Faster Threat Detection & Response: Built-in analytics, automation, and playbooks to accelerate incident handling.',
          'Reduced SIEM Complexity: Modern, cloud-native alternative to traditional SIEM platforms.',
          'SOC Readiness Roadmap: Clear path toward operationalizing a scalable, Microsoft-based Security Operations Center (SOC).'
        ]
      },
      {
        id: 'what-is-included',
        title: 'What Is Included',
        body: 'Scope includes Sentinel deployment, priority source onboarding, detection enablement, and initial automation setup.',
        bullets: [
          'Production-ready Microsoft Sentinel workspace deployment.',
          'Ingestion and normalization of 3–5 priority data sources (e.g., Microsoft Defender, Entra ID, Microsoft 365, Azure resources, or selected third-party logs).',
          'Enabled analytics rules, dashboards, alerting, and workbooks.',
          'Basic automation and playbooks for incident response.',
          'High-level SOC and Sentinel optimization roadmap.'
        ]
      },
      {
        id: 'engagement-timeline',
        title: 'Engagement Timeline',
        body: 'Week 1 – Discovery & Design: Review current security tooling and logging, define threat scenarios and compliance requirements, establish PoC scope and success criteria. Weeks 2–3 – Build & Integration: Deploy Sentinel workspace, connect priority data sources, configure analytics rules and automation. Week 4 – Validation & Roadmap: Validate detections and workflows, review dashboards and alerts, deliver scaling roadmap. Overall Duration: 4–6 Weeks.'
      },
      {
        id: 'who-this-offer-is-for',
        title: 'Who This Offer Is For',
        bullets: [
          'Organizations evaluating Microsoft Sentinel as a cloud-native SIEM/SOAR solution.',
          'Security teams seeking centralized log visibility and improved incident response.',
          'Enterprises looking to modernize or replace legacy SIEM platforms.'
        ]
      },
      {
        id: 'prerequisites',
        title: 'Prerequisites',
        bullets: [
          'Existing Azure tenant with appropriate permissions.',
          'Defined priority data sources and access to logging systems.',
          'Understanding that log ingestion costs are separate from engagement fees.',
          'Advanced SOAR workflows, custom detections, or extensive third-party integrations scoped separately.'
        ]
      }
    ]

  },

  'teams-voice-in-a-box': {

    title: 'Teams voice in a box',
    summary: 'Rapidly deploy Microsoft Teams Phone with a structured approach to modernize legacy voice systems and enable unified communications.',
    duration: '4–6 Weeks',
    delivery: 'Remote or Hybrid',
    pricing: '$20000',
    category: 'cloud-and-infrastructure',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        body: 'This engagement implements a production-ready Microsoft Teams Voice foundation, configures core calling capabilities, and supports a low-risk rollout for pilot or initial users.'
      },
      {
        id: 'what-you-will-gain',
        title: 'What You Will Gain',
        bullets: [
          'Modern Cloud-Based Voice Platform: Replace or modernize legacy PBX systems with Microsoft Teams Phone.',
          'Unified Communications Experience: Native integration within Microsoft Teams for chat, meetings, and calling.',
          'Reduced Infrastructure Dependency: Eliminate on-premises telephony hardware and maintenance overhead.',
          'Scalable Foundation: Architecture designed to support future growth and advanced voice capabilities.'
        ]
      },
      {
        id: 'what-is-included',
        title: 'What Is Included',
        body: 'Scope includes core Teams Phone setup, calling configuration, and enablement for pilot deployment and scale planning.',
        bullets: [
          'Production-ready Microsoft Teams Voice configuration.',
          'Setup of calling plans, Operator Connect, or Direct Routing (as applicable).',
          'Configured auto attendants, call queues, and emergency calling policies.',
          'Phone number assignment and voice policy configuration for pilot or initial users.',
          'Knowledge transfer and recommended roadmap for scaling.'
        ]
      },
      {
        id: 'engagement-timeline',
        title: 'Engagement Timeline',
        body: 'Week 1 – Discovery & Design: Review current voice environment, confirm licensing and tenant readiness, define scope and migration plan. Weeks 2–3 – Build & Configuration: Configure Teams Phone, calling setup, auto attendants, call queues, emergency policies, and assign pilot users. Week 4 – Testing, Training & Go-Live: Validate call scenarios, test quality and failover, provide enablement guidance, support production cutover. Overall Duration: 4–6 Weeks.'
      },
      {
        id: 'who-this-offer-is-for',
        title: 'Who This Offer Is For',
        bullets: [
          'Organizations replacing legacy PBX or on-premises telephony systems.',
          'Businesses seeking a unified communications solution within Microsoft 365.',
          'IT teams looking for a structured, low-risk transition to cloud-based voice.'
        ]
      },
      {
        id: 'prerequisites',
        title: 'Prerequisites',
        bullets: [
          'Existing Microsoft 365 tenant.',
          'Microsoft Teams Phone and calling service licenses purchased separately.',
          'Defined scope and user count for initial deployment.',
          'Complex integrations or advanced Direct Routing scenarios scoped separately.'
        ]
      }
    ]

  },

  'vmware-migrations': {

    title: 'VMware migrations',
    summary: 'Transition from VMware to Azure with expert guidance and proven methodologies.',
    duration: '4–6 Weeks',
    delivery: 'Remote or Hybrid',
    pricing: '$20000',
    category: 'cloud-and-infrastructure',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        body: 'This engagement implements a production-ready Microsoft Teams Voice foundation, configures core calling capabilities, and supports a low-risk rollout for pilot or initial users.'
      },
      {
        id: 'what-you-will-gain',
        title: 'What You Will Gain',
        bullets: [
          'Modern Cloud-Based Voice Platform: Replace or modernize legacy PBX systems with Microsoft Teams Phone.',
          'Unified Communications Experience: Native integration within Microsoft Teams for chat, meetings, and calling.',
          'Reduced Infrastructure Dependency: Eliminate on-premises telephony hardware and maintenance overhead.',
          'Scalable Foundation: Architecture designed to support future growth and advanced voice capabilities.'
        ]
      },
      {
        id: 'what-is-included',
        title: 'What Is Included',
        body: 'Scope includes core Teams Phone setup, calling configuration, and enablement for pilot deployment and scale planning.',
        bullets: [
          'Production-ready Microsoft Teams Voice configuration.',
          'Setup of calling plans, Operator Connect, or Direct Routing (as applicable).',
          'Configured auto attendants, call queues, and emergency calling policies.',
          'Phone number assignment and voice policy configuration for pilot or initial users.',
          'Knowledge transfer and recommended roadmap for scaling.'
        ]
      },
      {
        id: 'engagement-timeline',
        title: 'Engagement Timeline',
        body: 'Week 1 – Discovery & Design: Review current voice environment, confirm licensing and tenant readiness, define scope and migration plan. Weeks 2–3 – Build & Configuration: Configure Teams Phone, calling setup, auto attendants, call queues, emergency policies, and assign pilot users. Week 4 – Testing, Training & Go-Live: Validate call scenarios, test quality and failover, provide enablement guidance, support production cutover. Overall Duration: 4–6 Weeks.'
      },
      {
        id: 'who-this-offer-is-for',
        title: 'Who This Offer Is For',
        bullets: [
          'Organizations replacing legacy PBX or on-premises telephony systems.',
          'Businesses seeking a unified communications solution within Microsoft 365.',
          'IT teams looking for a structured, low-risk transition to cloud-based voice.'
        ]
      },
      {
        id: 'prerequisites',
        title: 'Prerequisites',
        bullets: [
          'Existing Microsoft 365 tenant.',
          'Microsoft Teams Phone and calling service licenses purchased separately.',
          'Defined scope and user count for initial deployment.',
          'Complex integrations or advanced Direct Routing scenarios scoped separately.'
        ]
      }
    ]

  },

  'azure-hpc-core-poc': {

    title: 'Azure HPC core POC',
    summary: 'Assess your current HPC environment and validate feasibility, performance, and cost considerations for Azure HPC adoption.',
    duration: '3–5 Weeks',
    delivery: 'Remote or Hybrid',
    pricing: '$20000',
    category: 'high-performance-computing',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        body: 'This engagement evaluates your current HPC landscape and maps it to Azure HPC capabilities to support informed decisions before a proof of concept or full migration.'
      },
      {
        id: 'what-you-will-gain',
        title: 'What You Will Gain',
        bullets: [
          'Migration Clarity: Clear understanding of how your current HPC environment aligns with Azure HPC capabilities.',
          'Performance Insights: Visibility into expected scalability, burst capacity, and performance potential.',
          'Cost Transparency: High-level cost comparison and optimization opportunities in Azure.',
          'Reduced Risk: Informed decision-making before committing to a PoC or full migration.'
        ]
      },
      {
        id: 'what-is-included',
        title: 'What Is Included',
        body: 'Scope includes technical assessment, feasibility analysis, and executive-ready guidance for next steps.',
        bullets: [
          'Comprehensive assessment of compute, storage, networking, and HPC software components.',
          'Workload and job scheduling analysis with performance evaluation.',
          'Azure compatibility and feasibility analysis.',
          'High-level cost comparison and optimization insights.',
          'Executive-ready presentation and roadmap outlining next steps toward Azure HPC adoption.'
        ]
      },
      {
        id: 'engagement-timeline',
        title: 'Engagement Timeline',
        body: 'Discovery & Objectives: Stakeholder interviews, define success criteria, establish scope. Current State Analysis: Review HPC infrastructure, workloads, performance patterns, and operational costs. Azure Feasibility & Analysis: Assess compatibility, scalability, architectural considerations, and benchmark expectations. Security, Compliance & Cost Review: Evaluate Azure security posture, certifications, and pricing considerations. Overall Duration: Typically 3–5 Weeks. Timeline and scope may vary based on the size and complexity of the HPC environment.'
      },
      {
        id: 'who-this-offer-is-for',
        title: 'Who This Offer Is For',
        bullets: [
          'Organizations operating on-premises or hybrid HPC environments evaluating cloud migration.',
          'Research institutions, engineering firms, or enterprises with compute-intensive workloads.',
          'IT and infrastructure teams seeking clarity before initiating an Azure HPC proof of concept.'
        ]
      },
      {
        id: 'prerequisites',
        title: 'Prerequisites',
        bullets: [
          'Access to relevant HPC infrastructure documentation and technical stakeholders.',
          'Understanding that this engagement focuses on assessment and planning (not workload migration).',
          'Detailed performance testing or benchmarking may require a follow-on PoC.',
          'Final scope dependent on environment size and complexity.'
        ]
      }
    ]

  },
  'azure-hpc-migration-assessment': {

    title: 'Azure HPC migration assessment',
    summary: 'Comprehensive assessment to evaluate migration feasibility, performance potential, and cost considerations for moving HPC workloads to Azure.',
    duration: '3–5 Weeks',
    delivery: 'Remote or Hybrid',
    pricing: '$20000',
    category: 'high-performance-computing',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        body: 'This engagement assesses your current HPC environment and maps technical, operational, and financial requirements to Azure HPC capabilities before a proof of concept or full migration.'
      },
      {
        id: 'what-you-will-gain',
        title: 'What You Will Gain',
        bullets: [
          'Migration Clarity: Understand how your current HPC environment aligns with Azure HPC capabilities.',
          'Performance Insights: Assess scalability, burst capacity, and expected performance in Azure.',
          'Cost Transparency: Evaluate cost considerations and potential optimization opportunities.',
          'Reduced Risk: Make informed decisions before committing to a proof of concept or full migration.'
        ]
      },
      {
        id: 'what-is-included',
        title: 'What Is Included',
        body: 'Scope includes technical and operational assessment, feasibility validation, and executive-ready recommendations for next steps.',
        bullets: [
          'Comprehensive review of HPC infrastructure: compute, storage, networking, and software.',
          'Analysis of workloads, applications, job scheduling, and performance patterns.',
          'Feasibility assessment of application and data compatibility with Azure HPC.',
          'Security, compliance, and high-level cost analysis.',
          'Executive-ready report summarizing findings, insights, and recommended next steps.',
          'High-level roadmap for Azure HPC adoption.'
        ]
      },
      {
        id: 'engagement-timeline',
        title: 'Engagement Timeline',
        body: 'Discovery & Objectives: Stakeholder interviews, define success criteria, establish scope. Current State Analysis: Review HPC infrastructure, workloads, performance patterns, and costs. Azure HPC Feasibility & Analysis: Evaluate application compatibility, architectural considerations, and performance potential. Security, Compliance & Cost Review: Assess Azure security, compliance, and pricing benefits. Overall Duration: Typically 3–5 Weeks. Timeline and scope may vary based on the size and complexity of the HPC environment.'
      },
      {
        id: 'who-this-offer-is-for',
        title: 'Who This Offer Is For',
        bullets: [
          'Organizations with on-premises or hybrid HPC environments considering migration to Azure.',
          'Teams needing clarity on feasibility, performance, and costs before committing to PoC or full migration.',
          'IT and infrastructure leaders planning large-scale HPC cloud adoption.'
        ]
      },
      {
        id: 'prerequisites',
        title: 'Prerequisites',
        bullets: [
          'Access to infrastructure documentation and relevant stakeholders.',
          'Understanding that this engagement focuses on assessment and planning, not workload migration.',
          'Detailed performance testing may require a follow-on proof of concept.',
          'Final scope and duration depend on the environment’s size and complexity.'
        ]
      }
    ]

  },

  'azure-hpc-max-poc': {

    title: 'Azure HPC MAX PoC',
    summary: 'Deploy and validate an enterprise-scale Azure HPC environment for complex, compute-intensive workloads with advanced networking and storage architectures.',
    duration: '12 Weeks + 2 Weeks Optimization Support',
    delivery: 'Remote or Hybrid',
    pricing: '$20000',
    category: 'high-performance-computing',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        body: 'This engagement establishes a high-performance Azure HPC foundation using advanced compute, networking, and storage to validate production readiness for large-scale workloads.'
      },
      {
        id: 'what-you-will-gain',
        title: 'What You Will Gain',
        bullets: [
          'Enterprise-Scale HPC: Highly scalable environment for complex, compute-intensive workloads.',
          'Advanced Networking & Storage: Access to Infiniband or ExpressRoute and high-throughput storage solutions like Weka.io or Hammerspace.',
          'Performance at Peak Load: Optimized for AI/ML, simulations, and other high-priority HPC tasks.',
          'Cloud Efficiency & Cost Control: Leverage Azure on-demand resources with built-in security, reducing infrastructure maintenance.'
        ]
      },
      {
        id: 'what-is-included',
        title: 'What Is Included',
        body: 'Scope includes end-to-end deployment, validation, and optimization support for enterprise HPC workloads on Azure.',
        bullets: [
          'Comprehensive Azure CycleCloud and advanced Slurm deployment for high-performance workloads.',
          'High-throughput storage via Weka.io or Hammerspace.',
          'High-speed connectivity using Infiniband or ExpressRoute.',
          'Extensive performance testing across large-scale HPC workloads.',
          'Detailed report including performance metrics, cost analysis, and production-readiness recommendations.',
          'Additional 2-week post-deployment optimization support.'
        ]
      },
      {
        id: 'engagement-timeline',
        title: 'Engagement Timeline',
        body: 'Assessment: Review HPC requirements and target performance. Design: Architect large-scale Azure HPC environment with specialized storage, compute, and networking. Deployment: Configure CycleCloud, Slurm, and integrate advanced networking and storage solutions. Testing: Conduct extensive performance validation of complex workloads. Review & Reporting: Deliver detailed performance, cost analysis, and recommendations. Overall Duration: 12 Weeks + 2 Weeks Optimization Support.'
      },
      {
        id: 'who-this-offer-is-for',
        title: 'Who This Offer Is For',
        bullets: [
          'Organizations with high-complexity, large-scale HPC workloads.',
          'Teams running AI/ML applications, simulations, or other compute-intensive tasks.',
          'Enterprises requiring ultra-low latency networking and high-throughput storage in the cloud.'
        ]
      },
      {
        id: 'prerequisites',
        title: 'Prerequisites',
        bullets: [
          'Azure subscription with sufficient HPC compute capacity.',
          'Clearly defined large-scale workloads for testing.',
          'Understanding that job execution volume will be limited during the PoC.',
          'Agreement to evaluate production deployment or decommissioning at conclusion.'
        ]
      }
    ]

  },

  'azure-hpc-pro-poc': {

    title: 'Azure HPC PRO PoC',
    summary: 'Deploy and validate a balanced Azure HPC environment for moderate workloads with container support, Slurm scheduling, and cost-effective scalability.',
    duration: '8 Weeks + 2 Weeks Optimization Support',
    delivery: 'Remote or Hybrid',
    pricing: '$20000',
    category: 'high-performance-computing',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        body: 'This engagement delivers a mid-scale Azure HPC foundation designed for moderate workloads, combining CycleCloud, Slurm, AKS, and balanced storage for practical performance validation.'
      },
      {
        id: 'what-you-will-gain',
        title: 'What You Will Gain',
        bullets: [
          'Mid-Scale HPC Experience: Understand the potential of Azure HPC for moderate workloads.',
          'Flexible Workload Management: Containerized workloads via AKS and Slurm job scheduling.',
          'Cost-Effective Scalability: Balanced compute and mid-tier storage with Azure Premium SSD or NetApp Files.',
          'Optimized Performance: Insights from testing moderate HPC workloads and performance metrics.'
        ]
      },
      {
        id: 'what-is-included',
        title: 'What Is Included',
        body: 'Scope includes deployment, workload testing, and production-readiness guidance for mid-scale HPC use cases.',
        bullets: [
          'Customized CycleCloud deployment with mid-tier compute resources.',
          'Slurm integration for job scheduling.',
          'AKS configuration for containerized workloads.',
          'Mid-tier storage setup using Azure Premium SSD or NetApp Files.',
          'Testing and analysis of moderate HPC workloads.',
          'Detailed report on performance, scalability, and production readiness.'
        ]
      },
      {
        id: 'engagement-timeline',
        title: 'Engagement Timeline',
        body: 'Assessment: Identify core performance requirements for moderate workloads. Design: Architect balanced HPC environment with compute, storage, and container support. Deployment: Configure CycleCloud, Slurm, AKS, and mid-tier storage. Testing: Execute moderate HPC workloads and analyze scalability. Review & Reporting: Deliver findings, recommendations, and next steps. Overall Duration: 8 Weeks + 2 Weeks Optimization Support.'
      },
      {
        id: 'who-this-offer-is-for',
        title: 'Who This Offer Is For',
        bullets: [
          'Organizations with moderate computational demands.',
          'Teams seeking containerized workloads and mid-tier storage solutions.',
          'Enterprises looking for reliable, cost-effective HPC performance without MAX-level complexity.'
        ]
      },
      {
        id: 'prerequisites',
        title: 'Prerequisites',
        bullets: [
          'Access to existing HPC infrastructure documentation and stakeholders.',
          'Defined moderate-scale workloads for testing.',
          'Understanding that job execution volume will be limited during the PoC.',
          'Agreement to evaluate production deployment or decommissioning at conclusion.'
        ]
      }
    ]

  },

};

@Component({
  selector: 'app-structured-offer',
  standalone: true,
  imports: [CommonModule, RouterLink, VideoHero, FormsModule, FeaturedCaseStudySectionComponent],
  templateUrl: './structured-offer.html',
  styleUrl: './structured-offer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StructuredOffer implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly seoMeta = inject(SeoMetaService);
  private readonly platformId = inject(PLATFORM_ID);
  private routeSubscription?: Subscription;
  private scrollListener?: () => void;

  readonly slug = signal<string | null>(null);
  readonly content = signal<StructuredOfferContent | null>(null);
  readonly error = signal<string | null>(null);
  readonly activeSection = signal<string>('overview');
  private readonly router = inject(Router);

  // Form properties
  readonly formModel = signal({
    fullName: '',
    email: '',
    message: ''
  });
  readonly submitted = signal(false);
  readonly showFormAnimation = signal(true);
  readonly validationErrors = signal<Record<string, boolean>>({
    fullName: false,
    email: false,
    message: false
  });
  readonly isSubmitting = signal(false);

  readonly heroVideoUrls = [
    'https://oakwoodsys.com/wp-content/uploads/2026/02/Services-Data-Ai.mp4'
  ];
  readonly heroCtaPrimary = {
    text: 'Contact Oakwood',
    link: '/contact-us',
    backgroundColor: '#2A7EBF'
  };

  readonly heroCtaSecondary = {
    text: 'Request Offer Details',
    link: '/contact-us'
  };

  readonly offerDetails = computed(() => {
    const data = this.content();
    if (!data) return [];
    return [
      { offer: 'Duration', offervalue: data.duration ?? 'TBD', icon: 'duration' },
      { offer: 'Delivery', offervalue: data.delivery ?? 'TBD', icon: 'delivery' },
      { offer: 'Pricing', offervalue: data.pricing ?? 'TBD', icon: 'pricing' },
      { offer: 'Category', offervalue: data.category ?? 'TBD', icon: 'category' }
    ];
  });

  ngOnInit() {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const slugParam = params.get('slug');
      this.slug.set(slugParam);
      this.loadContent();
    });

    if (isPlatformBrowser(this.platformId)) {
      this.scrollListener = () => this.updateActiveSection();
      window.addEventListener('scroll', this.scrollListener, { passive: true });
    }
  }

  ngOnDestroy() {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    if (isPlatformBrowser(this.platformId) && this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
    }
  }

  private loadContent() {
    this.error.set(null);
    this.activeSection.set('overview');
    const slugValue = this.slug();
    if (slugValue && STRUCTURED_OFFER_CONTENT[slugValue]) {
      const offer = STRUCTURED_OFFER_CONTENT[slugValue];
      this.content.set(offer);
      this.seoMeta.updateMeta({
        title: `${offer.title} | Oakwood Systems`,
        description: offer.summary,
        canonicalPath: `/structured-engagement/${slugValue}`,
      });
      return;
    }
    this.content.set(null);
    this.error.set('Offer not found.');
    this.router.navigate(['/404']);
    this.seoMeta.updateMeta({
      title: 'Structured Engagements | Oakwood Systems',
      description: 'Drive efficiency and innovation with tailored, strategic engagements designed to align technology solutions with your unique business goals.',
      canonicalPath: '/structured-engagement',
    });
  }

  onSubmit() {
    this.submitted.set(true);
    const form = this.formModel();
    const errors: Record<string, boolean> = {
      fullName: !form.fullName?.trim(),
      email: !form.email?.trim() || !this.isValidEmail(form.email),
      message: !form.message?.trim()
    };

    this.validationErrors.set(errors);

    // Check if there are any errors
    if (Object.values(errors).some(error => error)) {
      return;
    }

    this.isSubmitting.set(true);
    // TODO: Add your form submission logic here
    // For now, just simulate a submit
    setTimeout(() => {
      console.log('Form submitted:', this.formModel());
      this.resetForm();
      this.isSubmitting.set(false);
    }, 1500);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private resetForm() {
    this.formModel.set({
      fullName: '',
      email: '',
      message: ''
    });
    this.submitted.set(false);
    this.validationErrors.set({
      fullName: false,
      email: false,
      message: false
    });
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop = element.getBoundingClientRect().top + window.scrollY - 120; // 120px offset for navbar
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      this.activeSection.set(sectionId);
    }
  }

  private updateActiveSection() {
    const sections = ['overview', ...(this.content()?.sections.map(s => s.id) ?? [])];

    for (const sectionId of sections) {
      const element = document.getElementById(sectionId);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2) {
          this.activeSection.set(sectionId);
        }
      }
    }
  }

  /** Slugs para app-featured-case-study (from the current category or default to data-and-ai) */
  getSlugsForFeaturedSection(): string[] {

    // Default to data-and-ai for now
    return ['data-and-ai'];
  }
}


