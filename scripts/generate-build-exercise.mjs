// Calls Claude with spec-generator system prompt
// Outputs: exercises/build-mode/latest-spec.md

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = await fs.readFile('agents/spec-generator/system-prompt.md', 'utf8');

const tier = process.env.TIER ?? '2';
const topic = process.env.TOPIC ?? 'forms';

const userPrompt = `Generate a tier-${tier} React + TypeScript feature spec for the topic: "${topic}". Keep the scope to a 1-3 hour exercise.`;

console.log(`Generating tier-${tier} ${topic} build spec...`);

const response = await client.messages.create({
  model: 'claude-sonnet-4-5',
  max_tokens: 2048,
  system: SYSTEM_PROMPT,
  messages: [{ role: 'user', content: userPrompt }],
});

const spec = response.content[0].text;

await fs.mkdir('exercises/build-mode', { recursive: true });
const timestamp = new Date().toISOString().slice(0, 10);
await fs.writeFile(`exercises/build-mode/spec-${timestamp}-${topic}.md`, spec);
await fs.writeFile('exercises/build-mode/latest-spec.md', spec);

console.log('Build spec generated successfully.');
