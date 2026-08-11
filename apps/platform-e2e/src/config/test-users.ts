/**
 * Test user credentials for e2e tests.
 * Override via environment variables for CI:
 *   TEST_USER_EMAIL, TEST_USER_PASSWORD
 */
export const testUsers = {
  default: {
    email: process.env.TEST_USER_EMAIL || 'dnegi@gmail.com',
    password: process.env.TEST_USER_PASSWORD || 'Test@123',
  },
};
