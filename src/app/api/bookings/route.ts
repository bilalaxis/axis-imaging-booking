import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { voyagerClient } from '@/lib/voyager-client'
import { bookingSchema } from '@/lib/validations/booking'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const validatedData = bookingSchema.parse(body)

        // Start a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Find or create patient
            let patient = await tx.patient.findFirst({
                where: {
                    email: validatedData.patientDetails.email,
                },
            })

            if (!patient) {
                patient = await tx.patient.create({
                    data: {
                        firstName: validatedData.patientDetails.firstName,
                        lastName: validatedData.patientDetails.lastName,
                        email: validatedData.patientDetails.email,
                        mobile: validatedData.patientDetails.mobile,
                        dateOfBirth: validatedData.patientDetails.dateOfBirth,
                        title: validatedData.patientDetails.title,
                    },
                })
            } else {
                // Update patient details if they exist
                patient = await tx.patient.update({
                    where: { id: patient.id },
                    data: {
                        firstName: validatedData.patientDetails.firstName,
                        lastName: validatedData.patientDetails.lastName,
                        mobile: validatedData.patientDetails.mobile,
                        dateOfBirth: validatedData.patientDetails.dateOfBirth,
                        title: validatedData.patientDetails.title,
                    },
                })
            }

            // 2. Parse the scheduled datetime
            const scheduledDatetime = validatedData.scheduledDatetime

            // 3. Get service and body part details
            const service = await tx.service.findUnique({
                where: { id: validatedData.serviceId },
                include: { bodyParts: true }
            })

            if (!service) {
                throw new Error('Service not found')
            }

            const bodyPart = await tx.bodyPart.findUnique({
                where: { id: validatedData.bodyPartId }
            })

            if (!bodyPart) {
                throw new Error('Body part not found')
            }

            // 4. Create appointment in our database
            const appointment = await tx.appointment.create({
                data: {
                    patientId: patient.id,
                    serviceId: validatedData.serviceId,
                    bodyPartId: validatedData.bodyPartId,
                    scheduledDatetime,
                    status: 'pending',
                    notes: validatedData.notes || '',
                    referralUrl: validatedData.referralUrl || null,
                },
                include: {
                    patient: true,
                    service: true,
                    bodyPart: true,
                },
            })

            // 5. Create appointment in Voyager
            let voyagerResult
            try {
                voyagerResult = await voyagerClient.createAppointment({
                    id: appointment.id,
                    patientId: patient.id,
                    serviceId: validatedData.serviceId,
                    scheduledDatetime: appointment.scheduledDatetime,
                    duration: service.durationMinutes,
                    notes: validatedData.notes || '',
                    patient: {
                        id: patient.id,
                        firstName: patient.firstName,
                        lastName: patient.lastName,
                        dateOfBirth: patient.dateOfBirth,
                        email: patient.email ?? ""
                    },
                    service: {
                        name: service.name
                    },
                    bodyPart: {
                        name: bodyPart.name
                    }
                })

                // Update appointment with Voyager ID if successful
                if (voyagerResult.success && voyagerResult.voyagerId) {
                    await tx.appointment.update({
                        where: { id: appointment.id },
                        data: {
                            voyagerAppointmentId: voyagerResult.voyagerId,
                            status: 'confirmed' // Mark as confirmed if Voyager accepted it
                        }
                    })
                }

            } catch (voyagerError) {
                console.error('Failed to create appointment in Voyager:', voyagerError)
                // Don't fail the entire booking if Voyager is down
                // The appointment will remain 'pending' and can be manually processed
            }

            return appointment
        })

        return NextResponse.json({
            success: true,
            appointment: {
                id: result.id,
                scheduledDatetime: result.scheduledDatetime,
                status: result.status,
                voyagerAppointmentId: result.voyagerAppointmentId,
            },
        })

    } catch (error) {
        console.error('Booking creation error:', error)

        if (error instanceof Error) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to create booking' },
            { status: 500 }
        )
    }
} 