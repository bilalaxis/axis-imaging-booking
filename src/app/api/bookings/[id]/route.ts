import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function GET(
    request: Request,
    context: RouteParams
) {
    try {
        const { id } = await context.params

        const appointment = await prisma.appointment.findUnique({
            where: { id: id },
            include: {
                service: true,
                bodyPart: true
            }
        })

        if (!appointment) {
            return NextResponse.json(
                { error: 'Appointment not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(appointment)
    } catch (error) {
        console.error('Error fetching appointment:', error)
        return NextResponse.json(
            { error: 'Failed to fetch appointment' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: Request,
    context: RouteParams
) {
    try {
        const { id } = await context.params
        const body = await request.json()

        const appointment = await prisma.appointment.update({
            where: { id: id },
            data: {
                status: body.status,
                notes: body.notes,
                // Add other updatable fields as needed
            },
            include: {
                service: true,
                bodyPart: true
            }
        })

        return NextResponse.json(appointment)
    } catch (error) {
        console.error('Error updating appointment:', error)
        return NextResponse.json(
            { error: 'Failed to update appointment' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    context: RouteParams
) {
    try {
        const { id } = await context.params

        await prisma.appointment.update({
            where: { id: id },
            data: { status: 'cancelled' }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error cancelling appointment:', error)
        return NextResponse.json(
            { error: 'Failed to cancel appointment' },
            { status: 500 }
        )
    }
}