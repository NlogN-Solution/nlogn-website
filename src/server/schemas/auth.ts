import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(200),
  password: z.string().min(1, "Enter your password.").max(200),
});

/**
 * Twelve characters rather than eight, and no composition rules. Length is what
 * actually resists a modern cracker; forced symbols mostly produce `Passw0rd!`.
 */
export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(200, "That is longer than we can store.");

export const createUserSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(200),
  name: z.string().trim().min(2, "Give them a name.").max(120),
  password: passwordSchema,
  role: z.enum(["SUPER_ADMIN", "CONTENT_MANAGER", "MARKETING_MANAGER", "VIEWER"]),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  role: z.enum(["SUPER_ADMIN", "CONTENT_MANAGER", "MARKETING_MANAGER", "VIEWER"]).optional(),
  isActive: z.boolean().optional(),
  password: passwordSchema.optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword: passwordSchema,
});
