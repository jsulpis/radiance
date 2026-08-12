import { readFile } from "node:fs/promises";

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const issueNumber = process.env.PR_NUMBER;
const prReportPath = process.env.PR_REPORT;
const baseReportPath = process.env.BASE_REPORT;

if (!token || !repository || !issueNumber || !prReportPath || !baseReportPath) {
  throw new Error("GITHUB_TOKEN, GITHUB_REPOSITORY, PR_NUMBER, PR_REPORT, and BASE_REPORT are required");
}

const [owner, repo] = repository.split("/");
const pr = JSON.parse(await readFile(prReportPath, "utf8"));
let base = null;

try {
  base = JSON.parse(await readFile(baseReportPath, "utf8"));
} catch {
  // The base report is optional when its main-branch cache is unavailable.
}

const format = (bytes: number) => `${(bytes / 1024).toFixed(2)} kB`;
const delta = (current: number, previous?: number) => {
  if (previous === undefined || previous === null) return "";
  const difference = current - previous;
  const sign = difference > 0 ? "+" : "";
  const percentage = previous === 0 ? "" : ` (${sign}${((difference / previous) * 100).toFixed(1)}%)`;
  return `${sign}${format(difference)}${percentage}`;
};
const row = (name: string, key: keyof typeof pr) =>
  `| ${name} | ${base ? format(base[key]) : ""} | ${format(pr[key])} | ${delta(pr[key], base?.[key])} |`;
const marker = "<!-- radiance-size-report -->";
const body = [
  marker,
  "## Bundle size",
  "",
  "| Bundle | Base | PR | Delta |",
  "| --- | ---: | ---: | ---: |",
  row("`lib/dist/index.js`", "libraryGzipBytes"),
  row("`glCanvas` consumer", "glCanvasGzipBytes"),
].join("\n");

const api = `https://api.github.com/repos/${owner}/${repo}`;
const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "X-GitHub-Api-Version": "2022-11-28",
};
const commentsResponse = await fetch(`${api}/issues/${issueNumber}/comments?per_page=100`, { headers });

if (!commentsResponse.ok) {
  throw new Error(`Unable to list comments: ${commentsResponse.status} ${await commentsResponse.text()}`);
}

const comments = await commentsResponse.json();
const existing = comments.find((comment: { body?: string }) => comment.body?.includes(marker));
const request = existing
  ? fetch(`${api}/issues/comments/${existing.id}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    })
  : fetch(`${api}/issues/${issueNumber}/comments`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });

const response = await request;
if (!response.ok) {
  throw new Error(`Unable to update comment: ${response.status} ${await response.text()}`);
}
