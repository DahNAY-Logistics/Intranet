import { z } from 'zod'

export const updateSettingsSchema = z.object({
  siteName: z
    .string('Site name must be a string')
    .trim()
    .min(1, 'Site name is required')
    .max(100, 'Site name cannot exceed 100 characters'),

  organizationName: z
    .string('Organization name must be a string')
    .trim()
    .min(1, 'Organization name is required')
    .max(100, 'Organization name cannot exceed 100 characters'),

  supportEmail: z
    .string('Support email must be a string')
    .trim()
    .toLowerCase()
    .check(z.email('Support email must be valid')),

  codeOfConductUrl: z
    .string('Code of Conduct URL must be a string')
    .trim()
    .check(z.url('Code of Conduct URL must be a valid URL'))
    .nullable(),

  privacyPolicyUrl: z
    .string('Privacy Policy URL must be a string')
    .trim()
    .check(z.url('Privacy Policy URL must be a valid URL'))
    .nullable(),

  maintenanceMode: z.boolean('Maintenance mode must be true or false'),
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
