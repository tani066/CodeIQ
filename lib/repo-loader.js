
import JSZip from 'jszip';

export async function downloadGithubRepo(url) {
  // Basic validation and cleanup
  let cleanUrl = url.trim();
  if (cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }

  // Handle format: https://github.com/user/repo
  const regex = /github\.com\/([^/]+)\/([^/]+)/;
  const match = cleanUrl.match(regex);

  if (!match) {
    throw new Error('Invalid GitHub URL. Must be like https://github.com/user/repo');
  }

  const [_, user, repo] = match;

  // Construct zipball URL
  const zipUrl = `https://api.github.com/repos/${user}/${repo}/zipball`;

  console.log(`Downloading repo from: ${zipUrl}`);

  const headers = {};
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(zipUrl, { headers });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("GitHub API Rate Limit Exceeded. Please add a GITHUB_TOKEN to your .env file.");
    }
    throw new Error(`Failed to download repository: ${response.status} ${response.statusText}`);
  }

  return await response.arrayBuffer();
}

const IGNORED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
  '.mp4', '.webm', '.mp3', '.wav', '.ogg',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip', '.tar', '.gz', '.7z', '.rar',
  '.exe', '.dll', '.so', '.dylib', '.bin',
  '.eot', '.ttf', '.woff', '.woff2',
  '.DS_Store'
]);

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.github',
  '.vscode',
  '.idea',
  'dist',
  'build',
  '.next',
  'coverage',
  '__pycache__'
]);

const IGNORED_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  'cargo.lock',
  'gemfile.lock',
  'composer.lock'
]);

export async function processProject(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  let allCode = '';

  // Get all file paths
  const files = Object.keys(zip.files);

  for (const filePath of files) {
    const file = zip.files[filePath];

    // 1. Skip directories
    if (file.dir) continue;

    // 2. Check strict ignore list (path segments)
    const parts = filePath.split('/');
    // Helper to check if any part of the path is in ignored dirs
    // Note: GitHub zipballs have a top-level folder e.g. "user-repo-sha/"
    // We generally want to ignore hidden dirs (starting with .) inside the project
    // but the top level folder itself isn't hidden usually.
    // We'll check if any part AFTER the first one matches ignored dirs, or just any part.
    // Actually safe to ignore any part matching ignored dirs (like .git, node_modules)

    const hasIgnoredDir = parts.some(part => IGNORED_DIRS.has(part));
    if (hasIgnoredDir) continue;

    // 3. Check filenames
    const filename = parts[parts.length - 1];
    if (IGNORED_FILES.has(filename)) continue;

    // 4. Check extensions
    // Get extension
    const dotIndex = filename.lastIndexOf('.');
    if (dotIndex !== -1) {
      const ext = filename.substring(dotIndex).toLowerCase();
      if (IGNORED_EXTENSIONS.has(ext)) continue;
    }

    // 5. Read content
    try {
      // Limit file size to avoid memory issues with huge unexpected text files
      // (Unlikely if we filter well, but safe)
      // JSZip doesn't give size easily without querying ? 
      // We'll just try to read as text.
      const content = await file.async('string');

      // Basic check for binary content that might have slipped through (null bytes)
      if (content.includes('\0')) continue;

      allCode += `\n--- FILE: ${filePath} ---\n${content}\n`;

      // Safety Break: Stop if we have too much data (e.g. 2MB) to prevent token overload
      if (allCode.length > 2000000) {
        allCode += `\n--- TRUNCATED: PROJECT TOO LARGE ---\n`;
        break;
      }

    } catch (err) {
      console.warn(`Failed to read file ${filePath}:`, err);
    }
  }

  return allCode;
}
