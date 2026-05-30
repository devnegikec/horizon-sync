import * as z from 'zod';

import { describeExpectedLength, getCountry } from './countries';

const namePattern = /^[A-Za-z][A-Za-z' -]*[A-Za-z]$/;
const validatedName = (fieldName: string) => z.string()
  .trim()
  .min(2, `${fieldName} must be at least 2 characters`)
  .max(50, `${fieldName} cannot exceed 50 characters`)
  .regex(namePattern, `${fieldName} can contain only letters, spaces, hyphens, and apostrophes`);

// Work email validation - must be a valid email from a company domain (not free email providers)
// const workEmailValidation = z
//   .string()
//   .email('Please enter a valid email address')
//   .refine(
//     (email) => {
//       const freeEmailDomains = [
//         'gmail.com',
//         'yahoo.com',
//         'hotmail.com',
//         'outlook.com',
//         'aol.com',
//         'icloud.com',
//         'mail.com',
//         'protonmail.com',
//         'zoho.com',
//         'yandex.com',
//       ];
//       const domain = email.split('@')[1]?.toLowerCase();
//       return domain && !freeEmailDomains.includes(domain);
//     },
//     {
//       message: 'Please use your work email address, not a personal email',
//     }
//   );

export const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    first_name: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must be less than 50 characters'),
    last_name: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must be less than 50 characters'),
    country: z
      .string()
      .min(2, 'Please select your country'),
    phone_country_code: z
      .string()
      .regex(/^\+\d{1,4}$/, 'Invalid country dial code'),
    phone: z
      .string()
      .min(1, 'Contact number is required')
      .regex(/^\d+$/, 'Contact number must contain digits only'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  })
  .superRefine((data, ctx) => {
    // Country-specific phone-number length validation
    if (!data.country || !data.phone || !/^\d+$/.test(data.phone)) return;
    const country = getCountry(data.country);
    if (!country) return;
    const lens = Array.isArray(country.phoneLength) ? country.phoneLength : [country.phoneLength];
    if (!lens.includes(data.phone.length)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['phone'],
        message: `Enter a valid ${country.name} mobile number (${describeExpectedLength(country)}).`,
      });
    }
  });

export const loginSchema = z.object({
  // Differentiate "empty" vs "invalid format" with separate messages.
  email: z
    .string()
    .min(1, 'Email field is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password field is required')
    .min(8, 'Password is not valid'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });

export const acceptInvitationSchema = z
  .object({
    first_name: validatedName('First name'),
    last_name: validatedName('Last name'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type AcceptInvitationFormData = z.infer<typeof acceptInvitationSchema>;
