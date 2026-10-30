import { z } from "zod";

export const customerTypeSchema = z.enum(["REGULAR", "VIP", "CORPORATE"]);
export type CustomerTypeDto = z.infer<typeof customerTypeSchema>;

export const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  phone: z.string().optional().nullable().or(z.literal("")),
  email: z.string().email("Invalid email format").optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  birthday: z.coerce.date().optional().nullable(),
  anniversary: z.coerce.date().optional().nullable(),
  customerType: customerTypeSchema.default("REGULAR").optional().nullable(),
  allergies: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  whatsappOptIn: z.boolean().default(true).optional(),
  marketingOptOut: z.boolean().default(false).optional(),
});
export type CustomerDto = z.infer<typeof customerSchema>;
