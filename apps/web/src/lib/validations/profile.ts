import { z } from "zod";

export const ONBOARDING_STEPS = [
  {
    id: 1,
    title: "Organization Info",
    description: "Name & URL handle",
  },
  {
    id: 2,
    title: "Branding",
    description: "Description & bio",
  },
  {
    id: 3,
    title: "Finish",
    description: "Referral & setup",
  },
] as const;

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username cannot exceed 30 characters")
  .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores");

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  username: usernameSchema,
  avatarUrl: z.string().url("Invalid URL").optional().nullable(),
  phone: z.string().optional().nullable(),
});
