import { z } from 'zod'

export const patientDetailsSchema = z.object({
    title: z.string().optional(),
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    dateOfBirth: z.date({
        required_error: 'Date of birth is required',
    }),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    mobile: z.string().min(10, 'Mobile number must be at least 10 digits').max(20).optional().or(z.literal('')),
    notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
})

export const bookingSchema = z.object({
    serviceId: z.string().uuid('Invalid service ID'),
    bodyPartId: z.string().uuid('Invalid body part ID').optional(),
    scheduledDatetime: z.date({
        required_error: 'Please select a date and time',
    }),
    patientDetails: patientDetailsSchema,
    referralUrl: z.string().url().optional(),
    notes: z.string().max(1000).optional(),
})

export type PatientDetailsForm = z.infer<typeof patientDetailsSchema>
export type BookingForm = z.infer<typeof bookingSchema>