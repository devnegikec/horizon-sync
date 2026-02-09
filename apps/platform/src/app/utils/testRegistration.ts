// Test function to verify registration API
// This can be called from browser console for debugging

export async function testRegistration() {
  const testData = {
    email: "test@example.com",
    first_name: "Test",
    last_name: "User",
    phone: "1234567890",
    password: "TestPass123!"
  };

  try {
    const response = await fetch('http://localhost:8000/api/v1/identity/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('Registration successful:', result);
    return result;
  } catch (error) {
    console.error('Registration test failed:', error);
    throw error;
  }
}

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testRegistration = testRegistration;
}