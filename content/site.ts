export const profile = {
  name: "Sebastian Tsang",
  shortName: "Sebastian",
  headline: "Data systems, automation, and practical AI tooling.",
  intro:
    "Computer Science student at the University of Guelph. Previously at Interac and BMO, incoming at EY.",
  email: "sebrtsang@gmail.com",
  linkedin: "https://www.linkedin.com/in/sebtsang/",
  github: "https://github.com/sebtsang",
  x: "https://x.com/sebrtsang",
  instagram: "https://www.instagram.com/sebtsang_/",
  photo: "/images/hero-portrait.jpg",
  photoAlt:
    "Portrait of Sebastian Tsang standing in an architectural outdoor space.",
};

export const socialLinks = [
  { href: profile.linkedin, label: "LinkedIn", icon: "linkedin" as const },
  { href: profile.instagram, label: "Instagram", icon: "instagram" as const },
  { href: profile.x, label: "X", icon: "x" as const },
  { href: profile.github, label: "GitHub", icon: "github" as const },
  { href: `mailto:${profile.email}`, label: "Email", icon: "mail" as const },
];

export type ExperienceEntry = {
  company: string;
  role: string;
  period: string;
  logo: string;
  logoAlt: string;
  highlights: string[];
};

export const experience: ExperienceEntry[] = [
  {
    company: "EY",
    role: "Incoming AI & Data Consultant Intern",
    period: "May 2026 – Sep 2026",
    logo: "/logos/ey.svg",
    logoAlt: "EY logo",
    highlights: [
      "Incoming on the AI & Data team, focused on applied AI and data delivery problems.",
      "A natural next step from the workflow, orchestration, and tooling work I've been leaning into.",
    ],
  },
  {
    company: "BMO",
    role: "Data & AI Developer Intern",
    period: "Jan 2026 – Apr 2026",
    logo: "/logos/bmo.svg",
    logoAlt: "BMO logo",
    highlights: [
      "Built a spec-to-DAG pipeline that turned ingestion requirements into Airflow-ready orchestration artifacts.",
      "Pushed pipeline setup toward a more repeatable, standardized workflow instead of manual DAG authoring.",
    ],
  },
  {
    company: "Interac",
    role: "Data Engineering Intern",
    period: "May 2025 – Aug 2025",
    logo: "/logos/interac.svg",
    logoAlt: "Interac logo",
    highlights: [
      "Built an Oracle DW package that aggregated production data into daily dimension tables and improved root cause analysis by 40%.",
      "Integrated SonarQube into GitHub Actions and introduced a Python Jira CLI to reduce manual quality and sprint overhead.",
    ],
  },
  {
    company: "Interac",
    role: "Data Analyst, IT Operations",
    period: "Sep 2024 – Apr 2025",
    logo: "/logos/interac.svg",
    logoAlt: "Interac logo",
    highlights: [
      "Consolidated incident, problem, and change data into a centralized Tableau dashboard, cutting manual reporting by 80% across three teams.",
      "Automated e-Transfer customer journey reporting from scheduled Splunk queries into Tableau and reduced repeated reporting work by more than 50%.",
    ],
  },
  {
    company: "Spirit of Math",
    role: "Data Engineering Intern",
    period: "May 2024 – Aug 2024",
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
