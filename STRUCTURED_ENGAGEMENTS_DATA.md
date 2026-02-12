# Structured Engagements Data Structure

Based on the screenshots, here's the data structure for all 4 tabs:

## Tab 1: Data and AI

```typescript
{
  category: "Data and AI",
  offers: [
    {
      title: "Sql server migration to Azure",
      description: "Modernize SQL Server workloads with a structured move to Azure SQL services, improving performance, scalability and long-term cost efficiency for your data estate.",
      icon: "database", // or svgIcon: "<svg>...</svg>"
      borderColor: "blue",
      category: "Data and AI",
      link: "/structured-engagement/sql-server-migration-to-azure",
      linkText: "View offer"
    },
    {
      title: "Unified data estate migration",
      description: "Consolidate cloud data into a connected cloud architecture using Azure Synapse or Fabric, creating a modern foundation for BI and advanced analytics.",
      icon: "table",
      borderColor: "orange",
      category: "Data and AI",
      link: "/structured-engagement/unified-data-estate-migration",
      linkText: "View offer"
    },
    {
      title: "Microsoft fabric POC",
      description: "Stand up a working Fabric environment that connects your data sources and shows your team how to adopt OneLake, semantic models, and capabilities with hands-on guidance.",
      icon: "chart-simple",
      borderColor: "green",
      category: "Data and AI",
      link: "/structured-engagement/microsoft-fabric-poc",
      linkText: "View offer"
    },
    {
      title: "Data readiness assessment for AI",
      description: "Understand whether your data is clean, governed and governed well enough to power ML/AI effectively and get a roadmap to improve quality, structure, and readiness.",
      icon: "brain",
      borderColor: "purple",
      category: "Data and AI",
      link: "/structured-engagement/data-readiness-assessment-ai",
      linkText: "View offer"
    }
  ]
}
```

## Tab 2: Cloud and Infrastructure

```typescript
{
  category: "Cloud and Infrastructure",
  offers: [
    {
      title: "Application migration to Azure",
      description: "Move applications to Microsoft Azure with a guided approach that improves resilience, reduces risk, and builds a strong foundation for future modernization.",
      icon: "cloud-arrow-up",
      borderColor: "blue",
      category: "Cloud and Infrastructure",
      link: "/structured-engagement/application-migration-azure",
      linkText: "View offer"
    },
    {
      title: "Vmware migrations",
      description: "Transition VMware workloads to Azure using a proven discovery, planning, and execution framework that simplifies complexity and delivers a stable cloud environment.",
      icon: "server",
      borderColor: "orange",
      category: "Cloud and Infrastructure",
      link: "/structured-engagement/vmware-migrations",
      linkText: "View offer"
    },
    {
      title: "Microsoft sentinel security essentials POC",
      description: "Evaluate Microsoft Sentinel in your environment with a structured POC that tests log-based SIEM and SOAR can improve threat detection and operational response.",
      icon: "shield-halved",
      borderColor: "green",
      category: "Cloud and Infrastructure",
      link: "/structured-engagement/microsoft-sentinel-poc",
      linkText: "View offer"
    },
    {
      title: "Teams voice in a box",
      description: "Test Microsoft Teams as a complete telephony solution through a focused proof of concept that explores calling, configuration, user experience, and cost.",
      icon: "phone",
      borderColor: "purple",
      category: "Cloud and Infrastructure",
      link: "/structured-engagement/teams-voice-box",
      linkText: "View offer"
    }
  ]
}
```

## Tab 3: Application Innovation

```typescript
{
  category: "Application Innovation",
  offers: [
    {
      title: "AI application modernization assessment",
      description: "Evaluate how AI and modern cloud services can enhance or modernize an existing application and get a prioritized, actionable roadmap for future development.",
      icon: "microchip",
      borderColor: "blue",
      category: "Application Innovation",
      link: "/structured-engagement/ai-application-modernization",
      linkText: "View offer"
    },
    {
      title: "Copilot extensibility workshop",
      description: "Learn how to extend Microsoft Copilot for M365 using Azure AI, Power Platform, and custom APIs, with practical guidance for connecting Copilot to your business data.",
      icon: "puzzle-piece",
      borderColor: "orange",
      category: "Application Innovation",
      link: "/structured-engagement/copilot-extensibility-workshop",
      linkText: "View offer"
    },
    {
      title: "Custom Copilot development",
      description: "Build tailored Copilot experiences that integrate business logic, domain knowledge, and data so tasks to create differentiated, context-specific AI experiences for your team.",
      icon: "code",
      borderColor: "green",
      category: "Application Innovation",
      link: "/structured-engagement/custom-copilot-development",
      linkText: "View offer"
    },
    {
      title: "AI agent in a day workshop",
      description: "Explore real-world use cases for AI agents and create an early prototype in a focused session that brings clarity to design, capability, and potential impact.",
      icon: "robot",
      borderColor: "purple",
      category: "Application Innovation",
      link: "/structured-engagement/ai-agent-workshop",
      linkText: "View offer"
    }
  ]
}
```

## Tab 4: High Performance Computing (HPC)

```typescript
{
  category: "High Performance Computing (HPC)",
  offers: [
    {
      title: "Azure HPC core POC",
      description: "A guided introduction to Azure HPC designed for lightweight workloads, helping teams experience cloud-based performance with validating early technical decisions.",
      icon: "layer-group",
      borderColor: "blue",
      category: "High Performance Computing (HPC)",
      link: "/structured-engagement/azure-hpc-core-poc",
      linkText: "View offer"
    },
    {
      title: "Copilot extensibility workshop",
      description: "A real-scal HPC proof of concept that introduces advanced scheduling, core configuration, and higher performance configurations for growing computational needs.",
      icon: "file-lines",
      borderColor: "orange",
      category: "High Performance Computing (HPC)",
      link: "/structured-engagement/copilot-extensibility-workshop-hpc",
      linkText: "View offer"
    },
    {
      title: "Azure HPC max POC",
      description: "A full scale Azure HPC proof of concept built for demanding workloads including virtualization, engineering, and AI to testing large-scale performance and efficiency.",
      icon: "chart-line",
      borderColor: "green",
      category: "High Performance Computing (HPC)",
      link: "/structured-engagement/azure-hpc-max-poc",
      linkText: "View offer"
    },
    {
      title: "Azure HPC migration assessment",
      description: "Evaluate your existing HPC environment and receive a tailored migration path that includes performance modeling, cost projections and a practical rollout timeline.",
      icon: "table-list",
      borderColor: "purple",
      category: "High Performance Computing (HPC)",
      link: "/structured-engagement/azure-hpc-migration-assessment",
      linkText: "View offer"
    }
  ]
}
```

## Complete Section Data Structure

```typescript
const structuredEngagementsSection: StructuredEngagementsSection = {
  label: "HOW WE GET STARTED",
  title: "Structured engagements",
  tabs: [
    "Data and AI",
    "Cloud and Infrastructure",
    "Application Innovation",
    "High Performance Computing (HPC)"
  ],
  activeTab: "Data and AI",
  offers: [
    // All offers from all 4 tabs combined with their category property set
    // The component will filter based on activeTab matching the category
  ],
  cta: {
    text: "View all offers",
    link: "/structured-engagement"
  }
};
```

## Icon Mapping (FontAwesome)

Based on the screenshots, here are the icon suggestions:
- Database/Server icon: `fa-database`
- Table/Grid icon: `fa-table`
- Chart icon: `fa-chart-simple`
- Brain/AI icon: `fa-brain`
- Cloud upload: `fa-cloud-arrow-up`
- Server: `fa-server`
- Shield: `fa-shield-halved`
- Phone: `fa-phone`
- Microchip: `fa-microchip`
- Puzzle: `fa-puzzle-piece`
- Code: `fa-code`
- Robot: `fa-robot`
- Layers: `fa-layer-group`
- Document: `fa-file-lines`
- Chart line: `fa-chart-line`
- List: `fa-table-list`

