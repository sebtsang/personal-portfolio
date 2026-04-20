# Projects

Four projects currently on the site. Valid project IDs for the `showProject` tool: **openclaw**, **spec-to-dag**, **ops-reporting**, **retrieval-sandbox**.

## openclaw — OpenClaw Workflow Lab
Agentic workflow experiments. Seb's playground for turning recurring research + execution tasks into structured, repeatable automations instead of fragile prompts. Reusable workflow primitives, tool-calling patterns that stay readable at 50+ steps, eval harness for catching silent regressions. Stack: TypeScript, Claude Agent SDK, MCP, LangGraph.

## spec-to-dag — Spec-to-DAG Pipeline
Airflow orchestration automation, built at BMO. Turns ingestion specifications into Airflow-ready DAG artifacts. Standardized DAG setup across the team, spec → validated artifact in under a minute, shifted pipeline work from authoring to reviewing. Stack: Python, Airflow, Jinja, YAML.

## ops-reporting — Operational Reporting System
Incident + change consolidation, built at Interac. Centralized incident/problem/change data into Tableau across three teams. 80% reduction in manual reporting. Unified schema spanning three source systems, single source of truth for ops health. Stack: Tableau, Power Automate, Power Query, SQL.

## retrieval-sandbox — Experimental Retrieval Sandbox
Personal RAG playground. Side-by-side evals across retrieval strategies, fast iteration loop (change → eval → decide), notes that turn into the next production choice. Where Seb breaks things on purpose. Stack: Python, embeddings, Chroma, Claude.

---

When a user asks about projects or a specific project, CALL the tool (`showProjects` or `showProject({id: "..."})`). Don't list them in text.
