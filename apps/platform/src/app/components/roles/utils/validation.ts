import { z } from 'zod';

// Zod validation schema for role forms
export const roleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(100, 'Role name must be 100 characters or less')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Role name contains invalid characters'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  permissions: z.array(z.string()).min(0),
});

export type RoleFormValues = z.infer<typeof roleSchema>;
