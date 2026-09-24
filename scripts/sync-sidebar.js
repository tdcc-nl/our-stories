const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const pagesDir = path.join(repoRoot, 'pages');
const sidebarPath = path.join(repoRoot, '_data', 'sidebars', 'main.yml');

function readFrontMatterTitle(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) {
    return null;
  }

  const titleMatch = match[1].match(/^title:\s*(.+)\s*$/m);
  return titleMatch ? titleMatch[1].trim() : null;
}

function toUrl(fileName) {
  return '/' + fileName.replace(/\.md$/i, '');
}

function parseSidebarItems(content) {
  const lines = content.split(/\r?\n/);
  const items = [];
  let current = null;

  for (const line of lines) {
    const titleMatch = line.match(/^\s*-\s*title:\s*(.+)\s*$/);
    if (titleMatch) {
      current = { title: titleMatch[1].trim(), url: null };
      items.push(current);
      continue;
    }

    const urlMatch = line.match(/^\s*url:\s*(.+)\s*$/);
    if (urlMatch && current) {
      current.url = urlMatch[1].trim();
    }
  }

  return items;
}

function main() {
  const sidebar = fs.readFileSync(sidebarPath, 'utf8');
  const existingItems = parseSidebarItems(sidebar);
  const existingUrls = new Set(existingItems.map(item => item.url).filter(Boolean));

  const pageFiles = fs.readdirSync(pagesDir).filter(file => file.toLowerCase().endsWith('.md'));
  const additions = [];

  for (const file of pageFiles) {
    const filePath = path.join(pagesDir, file);
    const title = readFrontMatterTitle(filePath);
    if (!title) {
      continue;
    }

    const url = toUrl(file);
    if (existingUrls.has(url)) {
      continue;
    }

    additions.push({ title, url });
    existingUrls.add(url);
  }

  if (additions.length === 0) {
    return;
  }

  const lines = sidebar.trimEnd().split(/\r?\n/);
  const insertAt = lines.length;
  const newLines = additions.map(item => `  - title: ${item.title}\n    url: ${item.url}`);
  const updated = `${lines.join('\n')}\n${newLines.join('\n')}\n`;

  fs.writeFileSync(sidebarPath, updated, 'utf8');
}

main();
