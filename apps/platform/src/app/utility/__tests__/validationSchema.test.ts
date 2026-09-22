import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from '../validationSchema';

describe('loginSchema', () => {
  it('validates correct login data', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing email', () => {
    const result = loginSchema.safeParse({
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  const validData = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    country: 'IN',
    phone_country_code: '+91',
    phone: '1234567890',
    password: 'StrongPass1!',
    confirm_password: 'StrongPass1!',
  };

  it('validates correct registration data', () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({
      ...validData,
      confirm_password: 'DifferentPass1!',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short first name', () => {
    const result = registerSchema.safeParse({
      ...validData,
      first_name: 'J',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      ...validData,
      email: 'not-valid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects weak password', () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: 'weak',
      confirm_password: 'weak',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric phone', () => {
    const result = registerSchema.safeParse({
      ...validData,
      phone: 'abc-def-ghij',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short phone number', () => {
    const result = registerSchema.safeParse({
      ...validData,
      phone: '12345',
    });
    expect(result.success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('validates correct email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'bad' });
    expect(result.success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('validates matching strong passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'NewPass123!',
      confirm_password: 'NewPass123!',
    });
    expect(result.success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'NewPass123!',
      confirm_password: 'Different123!',
    });
    expect(result.success).toBe(false);
  });

  it('rejects weak password', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'weak',
      confirm_password: 'weak',
    });
    expect(result.success).toBe(false);
  });
});
