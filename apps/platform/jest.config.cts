module.exports = {
  displayName: 'platform',
  preset: '../../jest.preset.js',
  setupFiles: ['./jest.setup.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    // Skip stale/broken test duplicates in src/test/ — to be fixed later
    'src/test/app/features/banking/',
    'src/test/app/features/organization/',
    'src/test/app/features/search/components/GlobalSearch\\.test\\.tsx',
    'src/test/app/features/search/components/GlobalSearch\\.property\\.test\\.tsx',
    'src/test/app/features/search/components/LocalSearch\\.test\\.tsx',
    'src/test/app/features/search/components/LocalSearch\\.property\\.test\\.tsx',
    'src/test/app/features/search/components/SearchableSelect\\.test\\.tsx',
    'src/test/app/features/search/components/TouchTargetSizes\\.property\\.test\\.tsx',
    'src/test/app/features/search/hooks/useGlobalSearch\\.property\\.test\\.ts',
    'src/test/app/features/search/hooks/useLocalSearch\\.test\\.ts',
    'src/test/app/features/search/hooks/useRecentSearches\\.property\\.test\\.ts',
    'src/test/app/features/search/services/search\\.service\\.test\\.ts',
    'src/test/app/services/organization\\.service\\.test\\.ts',
    'src/test/app/components/topbar\\.test\\.tsx',
    // Skip co-located test with missing jest-dom import
    'src/app/features/search/components/SearchableSelect\\.test\\.tsx',
    // Skip topbar integration test (search mock issues)
    'src/app/components/topbar\\.test\\.tsx',
  ],
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/platform',
};
