import * as z from 'zod';

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

export const registerSchema = z.object({
  organization_name: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be less than 100 characters'),
  first_name: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  last_name: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
