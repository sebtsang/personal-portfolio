export const profile = {
  name: "Sebastian Tsang",
  headline: "From data systems to practical AI tooling.",
  intro:
    "I started in data engineering and internal systems, which is probably why I care more about useful AI than flashy demos. I’m interested in workflows, retrieval, automation, and the kind of tooling that holds up after the demo ends.",
  email: "sebrtsang@gmail.com",
  linkedin: "https://www.linkedin.com/in/sebtsang/",
  github: "https://github.com/sebtsang",
  photo: "/images/hero-portrait.jpg",
  photoAlt: "Portrait of Sebastian Tsang standing in an architectural outdoor space.",
};

export const navItems = [
  { href: "#experience", label: "Work" },
  { href: "#now", label: "Focus" },
  { href: "#public", label: "Writing" },
  { href: "#work", label: "Projects" },
  { href: "#contact", label: "Contact" },
];

export const socialLinks = [
  { href: "https://www.linkedin.com/in/sebtsang/", label: "LinkedIn", icon: "linkedin" as const },
  { href: "https://www.instagram.com/sebtsang_/", label: "Instagram", icon: "instagram" as const },
  { href: "https://x.com/sebrtsang", label: "X", icon: "x" as const },
  { href: "https://github.com/sebtsang", label: "GitHub", icon: "github" as const },
  { href: "mailto:sebrtsang@gmail.com", label: "Email", icon: "mail" as const },
];

export const experience = [
  {
    company: "EY",
    role: "Incoming AI & Data Consultant Intern",
    period: "May 2026 - Sep 2026",
    logo: "/logos/ey.jpeg",
    logoAlt: "EY logo",
    highlights: [
      "Incoming on the AI & Data team, focused on applied AI and data delivery problems.",
      "A natural next step from the workflow, orchestration, and tooling work I’ve been leaning into.",
    ],
  },
  {
    company: "BMO",
    role: "Data & AI Developer Intern",
    period: "Jan 2026 - Apr 2026",
    logo: "/logos/bmo.png",
    logoAlt: "BMO logo",
    highlights: [
      "Built a spec-to-DAG pipeline that turned ingestion requirements into Airflow-ready orchestration artifacts.",
      "Pushed pipeline setup toward a more repeatable, standardized workflow instead of manual DAG authoring.",
    ],
  },
  {
    company: "Interac",
    role: "Data Engineering Intern",
    period: "May 2025 - Aug 2025",
    logo: "/logos/interac.png",
    logoAlt: "Interac logo",
    highlights: [
      "Built an Oracle DW package that aggregated production data into daily dimension tables and improved root cause analysis by 40%.",
      "Integrated SonarQube into GitHub Actions and introduced a Python Jira CLI to reduce manual quality and sprint overhead.",
    ],
  },
  {
    company: "Interac",
    role: "Data Analyst, IT Operations",
    period: "Sep 2024 - Apr 2025",
    logo: "/logos/interac.png",
    logoAlt: "Interac logo",
    highlights: [
      "Consolidated incident, problem, and change data into a centralized Tableau dashboard, cutting manual reporting by 80% across three teams.",
      "Automated e-Transfer customer journey reporting from scheduled Splunk queries into Tableau and reduced repeated reporting work by more than 50%.",
    ],
  },
  {
    company: "Spirit of Math",
    role: "Data Engineering Intern",
    period: "May 2024 - Aug 2024",
    logo: "/logos/spirit-of-math.jpeg",
    logoAlt: "Spirit of Math logo",
    highlights: [
      "Built ETL pipelines in Microsoft Fabric for a finance ERP integration project.",
      "Designed a medallion-style lakehouse and added SQL validation procedures with logging to make ingestion more reliable.",
    ],
  },
];

export const currentFocus = [
  {
    title: "OpenClaw workflows",
    description:
      "Designing agentic workflows that turn multi-step research and execution tasks into reusable systems instead of fragile prompts.",
  },
  {
    title: "MCP servers",
    description:
      "Exploring tool-connected AI environments and how model context can be grounded in real interfaces, resources, and developer workflows.",
  },
  {
    title: "RAG pipelines",
    description:
      "Learning how retrieval improves reliability, controllability, and usefulness when AI systems need to answer from specific knowledge.",
  },
  {
    title: "AI automation systems",
    description:
      "Pushing beyond demos toward automations that reduce repeated work, structure information, and support real decisions.",
  },
];

export const publicWriting = [
  "AI workflows and practical experiments",
  "Lessons from internships in data engineering and AI-adjacent systems",
  "Systems, tooling, and the tradeoffs behind internal infrastructure",
];

export const selectedWork = [
  {
    title: "OpenClaw Workflow Lab",
    category: "AI workflow / automation",
    description:
      "A growing set of agentic workflow experiments focused on turning recurring research and execution tasks into structured, repeatable automations.",
    meta: "OpenClaw · agents · automation",
  },
  {
    title: "Spec-to-DAG Pipeline",
    category: "Data / orchestration system",
    description:
      "An automated pipeline that converts ingestion requirements into Airflow-ready orchestration artifacts, reducing manual DAG setup and improving consistency.",
    meta: "Airflow · orchestration · data platforms",
  },
  {
    title: "Operational Reporting System",
    category: "Internal data platform",
    description:
      "A reporting workflow that centralized incident, problem, and change data into Tableau, giving teams a more reliable view of operational health with far less manual work.",
    meta: "Tableau · Power Automate · Power Query",
  },
  {
    title: "Experimental Retrieval Sandbox",
    category: "Experimental build",
    description:
      "A lightweight space for testing RAG patterns, context retrieval, and tool-connected AI behaviour before turning ideas into more durable systems.",
    meta: "RAG · embeddings · experimentation",
  },
];
