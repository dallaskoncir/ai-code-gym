// TODO: Implement — calls Claude with feature-writer system prompt
// Inputs: process.env.TIER, process.env.TOPIC
// Outputs:
//   exercises/review-mode/latest-exercise.tsx  (the buggy component)
//   exercises/review-mode/latest-bug-manifest.json  (hidden, for critic agent)
//   exercises/review-mode/latest-pr-description.md  (PR body shown to reviewer)

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = await fs.readFile('agents/feature-writer/system-prompt.md', 'utf8');

const tier = process.env.TIER ?? '2';
const topic = process.env.TOPIC ?? 'react-hooks';

const userPrompt = `
Write a React + TypeScript component for a "${topic}" exercise at difficulty tier ${tier}.
The component should be realistic, roughly 60-120 lines, and contain the appropriate number and type of intentional bugs for tier ${tier}.
Include the hidden <!-- BUGS --> manifest at the end of your response.
`;

console.log(`Generating tier-${tier} ${topic} exercise...`);

const response = await client.messages.create({
  model: 'claude-sonnet-4-5',
  max_tokens: 4096,
  system: SYSTEM_PROMPT,
  messages: [{ role: 'user', content: userPrompt }],
});

const fullText = response.content[0].text;

// Split code from bug manifest
const [codePart, bugPart] = fullText.split('<!-- BUGS -->');

// Extract code block
const codeMatch = codePart.match(/```(?:tsx?)?\n([\s\S]*?)```/);
const code = codeMatch ? codeMatch[1] : codePart.trim();

await fs.mkdir('exercises/review-mode', { recursive: true });
await fs.writeFile('exercises/review-mode/latest-exercise.tsx', code);
await fs.writeFile('exercises/review-mode/latest-bug-manifest.json', JSON.stringify({ raw: bugPart?.trim() ?? '' }, null, 2));
await fs.writeFile(
  'exercises/review-mode/latest-pr-description.md',
  `## Review Exercise — Tier ${tier}: ${topic}\n\nReview the component in \`exercises/review-mode/latest-exercise.tsx\`.\n\nLeave your review comments directly on this PR. When done, trigger the **Evaluate My Review** workflow with this PR number to get feedback on your review.\n`
);

console.log('Exercise generated successfully.');
