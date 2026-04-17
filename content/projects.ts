export type Project = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  description: string;
  highlights: string[];
  techStack: string[];
  links?: { label: string; href: string }[];
  accent?: string;
};

export const projects: Project[] = [
  {
    id: "openclaw",
    title: "OpenClaw Workflow Lab",
    subtitle: "Agentic workflow experiments",
    category: "AI · Automation",
    description:
      "A growing set of agentic workflow experiments focused on turning recurring research and execution tasks into structured, repeatable automations. Where I explore how agents should actually fit into real work.",
    highlights: [
      "Reusable workflow primitives instead of one-off prompts.",
      "Tool-calling patterns that stay readable at 50+ steps.",
      "Eval harness for catching silent regressions.",
    ],
    techStack: ["TypeScript", "Claude Agent SDK", "MCP", "LangGraph"],
    accent: "from-blue-500/20 to-cyan-500/10",
  },
  {
    id: "spec-to-dag",
    title: "Spec-to-DAG Pipeline",
    subtitle: "Airflow orchestration automation",
    category: "Data · Orchestration",
    description:
      "An automated pipeline that turns ingestion specifications into Airflow-ready orchestration artifacts. Built at BMO — replaces hand-authored DAGs with a consistent, reviewable generation step.",
    highlights: [
      "Standardized DAG setup across the team.",
      "Spec → validated artifact in under a minute.",
      "Shifted pipeline work from authoring to reviewing.",
    ],
    techStack: ["Python", "Airflow", "Jinja", "YAML"],
    accent: "from-emerald-500/20 to-teal-500/10",
  },
  {
    id: "ops-reporting",
    title: "Operational Reporting System",
    subtitle: "Incident & change consolidation",
    category: "Data Platform",
    description:
      "A reporting workflow that centralized incident, problem, and change data into Tableau, giving three teams at Interac a reliable view of operational health with far less manual work.",
    highlights: [
      "80% reduction in manual reporting across three teams.",
      "Unified schema spanning three source systems.",
      "Single source of truth for ops health.",
    ],
    techStack: ["Tableau", "Power Automate", "Power Query", "SQL"],
    accent: "from-amber-500/20 to-orange-500/10",
  },
  {
    id: "retrieval-sandbox",
    title: "Experimental Retrieval Sandbox",
    subtitle: "RAG pattern playground",
    category: "Experimental",
    description:
      "A lightweight space for testing RAG patterns, context retrieval, and tool-connected AI behavior before ideas graduate to more durable systems. Where I break things on purpose.",
    highlights: [
      "Side-by-side evals across retrieval strategies.",
      "Fast iteration loop: change → eval → decide.",
      "Notes that turn into the next production choice.",
    ],
    techStack: ["Python", "Embeddings", "Chroma", "Claude"],
    accent: "from-purple-500/20 to-pink-500/10",
  },
];
