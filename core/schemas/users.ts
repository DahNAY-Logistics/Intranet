import { z } from 'zod'

import { roles } from '../constants.ts'

export const createUserSchema = z.object({
  name: z
    .string('Name must be a string')
    .trim()
    .min(1, 'Name is required'),

  email: z
    .string('Email must be a string')
    .trim()
    .toLowerCase()
    .check(z.email('Email must be valid')),

  role: z.enum([roles.user, roles.admin], 'Role must be either User or Admin'),

  employeeId: z
    .string('Employee ID must be a string')
    .trim()
    .min(1, 'Employee ID is required'),

  designationId: z
    .number('Designation is required')
    .int('Designation is required')
    .positive('Designation is required'),

  departmentId: z
    .number('Department is required')
    .int('Department is required')
    .positive('Department is required'),

  locationId: z
    .number('Location is required')
    .int('Location is required')
    .positive('Location is required'),

  dob: z.coerce.date('Date of birth is required'),

  joinedDate: z.coerce.date('Joined date is required'),

  reportedToId: z
    .string('Reported To must be a string')
    .trim()
    .nullable()
    .default(null),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export const updateUserSchema = createUserSchema
