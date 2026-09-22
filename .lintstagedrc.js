const path = require('path');

// Quote a path so shell commands don't split on spaces (e.g. "advance stock notice/...").
const shellQuote = (file) => `"${file.replace(/"/g, '\\"')}"`;

module.exports = {
  '*.{js,ts,jsx,tsx,json,css,scss}': ['prettier --write'],
  '*.{js,ts,jsx,tsx}': (files) => {
    // Transform absolute paths to relative paths for Nx
    const relativeFiles = files.map((file) => path.relative(process.cwd(), file)).join(',');

    return [`eslint --fix ${files.map(shellQuote).join(' ')}`, `nx affected:test --files=${shellQuote(relativeFiles)}`];
  },
};
