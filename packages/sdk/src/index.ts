import { z } from "zod";

export const publicBookingSummarySchema = z.object({
  workspaceSlug: z.string(),
  workspaceName: z.string(),
  timezone: z.string(),
  servicesCount: z.number(),
  staffCount: z.number()
});

export type PublicBookingSummary = z.infer<typeof publicBookingSummarySchema>;
