// Fetches the PR diff and all review comments for a given PR number
// Outputs: feedback/pr-context.json

import { Octokit } from '@octokit/rest';
import fs from 'fs/promises';

const octokit = new Octokit({ auth: process.env.GH_TOKEN });
const prNumber = parseInt(process.env.PR_NUMBER);

const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');

console.log(`Fetching PR #${prNumber} from ${owner}/${repo}...`);

const { data: pr } = await octokit.pulls.get({ owner, repo, pull_number: prNumber });
const { data: diff } = await octokit.pulls.get({ owner, repo, pull_number: prNumber, mediaType: { format: 'diff' } });
const { data: reviewComments } = await octokit.pulls.listReviewComments({ owner, repo, pull_number: prNumber });
const { data: issueComments } = await octokit.issues.listComments({ owner, repo, issue_number: prNumber });

let bugManifest = {};
try {
  const manifestRaw = await fs.readFile('exercises/review-mode/latest-bug-manifest.json', 'utf8');
  bugManifest = JSON.parse(manifestRaw);
} catch {
  console.warn('No bug manifest found.');
}

await fs.mkdir('feedback', { recursive: true });
await fs.writeFile('feedback/pr-context.json', JSON.stringify({
  pr_number: prNumber,
  title: pr.title,
  diff,
  review_comments: reviewComments.map(c => ({ path: c.path, line: c.line, body: c.body })),
  issue_comments: issueComments.map(c => ({ body: c.body })),
  bug_manifest: bugManifest,
}, null, 2));

console.log('PR context fetched.');
