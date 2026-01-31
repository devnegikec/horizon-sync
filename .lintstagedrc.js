const path = require('path');

module.exports = {
  '*.{js,ts,jsx,tsx,json,css,scss}': ['prettier --write'],
  '*.{js,ts,jsx,tsx}': (files) => {
    // Transform absolute paths to relative paths for Nx
    const relativeFiles = files.map((file) => path.relative(process.cwd(), file)).join(',');

    return [`eslint --fix ${files.join(' ')}`, `nx affected:test --files=${relativeFiles}`];
  },
};
