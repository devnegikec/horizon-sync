// Helper to check if DevTools should be enabled
export const isDevToolsEnabled = (): boolean => {
  return (
    process.env['NODE_ENV'] === 'development' &&
    typeof window !== 'undefined' &&
    !!(window as unknown as Record<string, unknown>).__REDUX_DEVTOOLS_EXTENSION__
  );
};

// DevTools connection info
export const getDevToolsInfo = () => {
  if (typeof window === 'undefined') {
    return { available: false, message: 'Not in browser environment' };
  }

  const hasExtension = !!(window as unknown as Record<string, unknown>).__REDUX_DEVTOOLS_EXTENSION__;
  
  return {
    available: hasExtension,
    message: hasExtension 
      ? 'Redux DevTools Extension detected' 
      : 'Redux DevTools Extension not found. Please install it from the Chrome Web Store.',
    installUrl: 'https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd',
  };
};