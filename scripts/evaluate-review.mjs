// Runs the review-critic agent against the fetched PR context
// Outputs: feedback/latest-evaluation.md

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = await fs.readFile('agents/review-critic/system-prompt.md', 'utf8');
const context = JSON.parse(await fs.readFile('feedback/pr-context.json', 'utf8'));

const userPrompt = `
Here is the context for the review exercise evaluation:

## PR Diff
\`\`\`diff
${context.diff}
\`\`\`

## Bug Manifest (hidden from original reviewer)
${context.bug_manifest?.raw ?? 'Not available'}

## Developer's Review Comments
${context.review_comments.map(c => `**${c.path}:${c.line}** — ${c.body}`).join('\n\n')}

${context.issue_comments.length ? '## General PR Comments\n' + context.issue_comments.map(c => c.body).join('\n\n') : ''}

Please evaluate the review using the rubric and return structured markdown feedback.
`;

console.log('Running review critic agent...');

const response = await client.messages.create({
  model: 'claude-sonnet-4-5',
  max_tokens: 2048,
  system: SYSTEM_PROMPT,
  messages: [{ role: 'user', content: userPrompt }],
});

const evaluation = response.content[0].text;

await fs.mkdir('feedback', { recursive: true });
await fs.writeFile('feedback/latest-evaluation.md', evaluation);

console.log('Evaluation complete.');
