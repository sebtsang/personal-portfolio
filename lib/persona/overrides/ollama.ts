/**
 * Ollama-specific voice nudges. Model-neutral on purpose: LLM_MODEL
 * picks the Ollama model, and this text is shared by all of them.
 *
 * Symptom: open models sometimes ramble through tool indecision (we've
 * seen empty completions when tools are in the payload and the prompt is
 * short/casual — the no-tools retry path in lib/llm/ollama.ts compensates).
 *
 * Keep this subtractive — constrain the base voice, don't contradict it.
 */

export const override = `
# Extra for this runtime
You tend to over-explain when unsure. Don't.
If the reference material doesn't answer a question about Seb, say you don't know in one witty sentence. Never hallucinate project names, companies, or dates.
For short casual greetings ("hi", "sup", "yo"), do NOT call a tool. Just reply with one witty line.
`;
