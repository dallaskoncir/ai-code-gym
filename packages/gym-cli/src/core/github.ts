import { Octokit } from "@octokit/rest";

export interface GithubEnv {
  token: string;
  owner: string;
  repo: string;
}

function loadGithubEnv(): GithubEnv {
  const token = process.env.GYM_BOT_GH_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  if (!token || !owner || !repo) {
    throw new Error(
      "ai-code-gym: GYM_BOT_GH_TOKEN, GITHUB_OWNER, and GITHUB_REPO must all be set " +
        "(see packages/gym-cli/.env) to use the GitHub bot workflow.",
    );
  }
  return { token, owner, repo };
}

/** Fails fast on a missing/misconfigured .env, before a caller does anything hard to undo (like a git push). */
export function requireGithubEnv(): void {
  loadGithubEnv();
}

let client: Octokit | undefined;

function getClient(): Octokit {
  client ??= new Octokit({ auth: loadGithubEnv().token });
  return client;
}

export interface CreatedPR {
  number: number;
  url: string;
}

/** Opens a PR from `branch` onto the repo's default base ("main"), authored as the gym bot. */
export async function createPR(branch: string, title: string, body: string): Promise<CreatedPR> {
  const { owner, repo } = loadGithubEnv();
  const octokit = getClient();
  const { data } = await octokit.rest.pulls.create({
    owner,
    repo,
    head: branch,
    base: "main",
    title,
    body,
  });
  return { number: data.number, url: data.html_url };
}

/**
 * Returns the text of every comment on the PR — Conversation-tab comments, inline review
 * comments, and review summary bodies — since a reviewer following the bot's own PR
 * instructions ("leave your comments as PR review comments") produces the latter two,
 * not the former.
 */
export async function fetchPRComments(prNumber: number): Promise<string[]> {
  const { owner, repo } = loadGithubEnv();
  const octokit = getClient();

  const [issueComments, reviewComments, reviews] = await Promise.all([
    octokit.paginate(octokit.rest.issues.listComments, { owner, repo, issue_number: prNumber, per_page: 100 }),
    octokit.paginate(octokit.rest.pulls.listReviewComments, { owner, repo, pull_number: prNumber, per_page: 100 }),
    octokit.paginate(octokit.rest.pulls.listReviews, { owner, repo, pull_number: prNumber, per_page: 100 }),
  ]);

  return [...issueComments, ...reviewComments, ...reviews]
    .map((entry) => entry.body ?? "")
    .filter((body) => body.trim().length > 0);
}

export async function postPRComment(prNumber: number, body: string): Promise<void> {
  const { owner, repo } = loadGithubEnv();
  const octokit = getClient();
  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body,
  });
}
