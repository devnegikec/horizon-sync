async function prepare() {
  // Enable MSW in development mode
  if (process.env.NODE_ENV === 'local') {
    console.log('🔵 MSW: Starting Mock Service Worker in development mode');
    const { worker } = await import('./app/mocks');
    await worker.start({
      onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
    });
    console.log('🔵 MSW: Mock Service Worker is running');
  }
  return import('./bootstrap');
}

prepare().catch((err) => console.error(err));
