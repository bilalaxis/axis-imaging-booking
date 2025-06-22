import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { bookingSchema } from '@/lib/validations/booking'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Validate the request body
        const validatedData = bookingSchema.parse(body)

        // Check if the selected time slot is still available
        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                serviceId: validatedData.serviceId,
                scheduledDatetime: validatedData.scheduledDatetime,
                status: {
                    in: ['pending', 'confirmed']
                }
            }
        })

        if (existingAppointment) {
            return NextResponse.json(
                { error: 'This time slot is no longer available' },
                { status: 409 }
            )
        }

        // Create the appointment
        const appointment = await prisma.appointment.create({
            data: {
                firstName: validatedData.patientDetails.firstName,
                lastName: validatedData.patientDetails.lastName,
                dateOfBirth: validatedData.patientDetails.dateOfBirth,
                email: validatedData.patientDetails.email,
                mobile: validatedData.patientDetails.mobile,
                serviceId: validatedData.serviceId,
                bodyPartId: validatedData.bodyPartId,
                scheduledDatetime: validatedData.scheduledDatetime,
                referralUrl: validatedData.referralUrl,
                notes: validatedData.notes,
                status: 'pending'
            },
            include: {
                service: true,
                bodyPart: true
            }
        })

        // TODO: Queue HL7 message for Voyager RIS
        // This will be implemented in the next phase

        return NextResponse.json({
            success: true,
            appointment: {
                id: appointment.id,
                scheduledDatetime: appointment.scheduledDatetime,
                service: appointment.service.name,
                bodyPart: appointment.bodyPart.name,
                status: appointment.status
            }
        }, { status: 201 })

    } catch (error) {
        console.error('Error creating booking:', error)

        if (error instanceof Error && 'issues' in error) {
            return NextResponse.json(
                { error: 'Validation failed', details: error },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to create booking' },
            { status: 500 }
        )
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const email = searchParams.get('email')
        const mobile = searchParams.get('mobile')

        if (!email && !mobile) {
            return NextResponse.json(
                { error: 'Email or mobile number is required' },
                { status: 400 }
            )
        }

        const whereCondition = email
            ? { email: email }
            : { mobile: mobile }

        const appointments = await prisma.appointment.findMany({
            where: whereCondition,
            include: {
                service: true,
                bodyPart: true
            },
            orderBy: {
                scheduledDatetime: 'desc'
            }
        })

        return NextResponse.json(appointments)
    } catch (error) {
        console.error('Error fetching appointments:', error)
        return NextResponse.json(
            { error: 'Failed to fetch appointments' },
            { status: 500 }
        )
    }
}