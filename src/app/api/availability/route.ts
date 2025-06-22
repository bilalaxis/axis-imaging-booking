import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { addDays, format, isAfter, isBefore, isToday, parse, startOfDay } from 'date-fns'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const serviceId = searchParams.get('service_id')
        const dateFrom = searchParams.get('date_from')
        const dateTo = searchParams.get('date_to')

        if (!serviceId) {
            return NextResponse.json(
                { error: 'Service ID is required' },
                { status: 400 }
            )
        }

        // Default to next 30 days if dates not provided
        const fromDate = dateFrom ? new Date(dateFrom) : new Date()
        const toDate = dateTo ? new Date(dateTo) : addDays(new Date(), 30)

        // Get service details
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            select: { durationMinutes: true }
        })

        if (!service) {
            return NextResponse.json(
                { error: 'Service not found' },
                { status: 404 }
            )
        }

        // Get availability slots for the service
        const availabilitySlots = await prisma.availabilitySlot.findMany({
            where: {
                serviceId: serviceId,
                isAvailable: true
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' }
            ]
        })

        // Get existing appointments to check conflicts
        const existingAppointments = await prisma.appointment.findMany({
            where: {
                serviceId: serviceId,
                scheduledDatetime: {
                    gte: startOfDay(fromDate),
                    lte: addDays(startOfDay(toDate), 1)
                },
                status: {
                    in: ['pending', 'confirmed']
                }
            },
            select: {
                scheduledDatetime: true
            }
        })

        // Generate available slots for the date range
        const availableSlots: { date: string; slots: { time: string; available: boolean }[] }[] = []

        for (let date = fromDate; isBefore(date, toDate) || format(date, 'yyyy-MM-dd') === format(toDate, 'yyyy-MM-dd'); date = addDays(date, 1)) {
            // Skip past dates (except today)
            if (isBefore(date, startOfDay(new Date())) && !isToday(date)) {
                continue
            }

            const dayOfWeek = date.getDay()
            const dateStr = format(date, 'yyyy-MM-dd')

            // Find slots for this day of week
            const daySlots = availabilitySlots.filter((slot: any) => slot.dayOfWeek === dayOfWeek)

            const slots = daySlots.map((slot: any) => {
                // Create full datetime for this slot
                const slotDateTime = new Date(`${dateStr}T${slot.startTime}`)

                // Check if slot is in the past (for today only)
                const isPastSlot = isToday(date) && isBefore(slotDateTime, new Date())

                // Check if slot conflicts with existing appointment
                const hasConflict = existingAppointments.some((appointment: any) => {
                    const appointmentTime = appointment.scheduledDatetime
                    return format(appointmentTime, 'yyyy-MM-dd HH:mm:ss') === format(slotDateTime, 'yyyy-MM-dd HH:mm:ss')
                })

                return {
                    time: slot.startTime,
                    available: !isPastSlot && !hasConflict
                }
            })

            if (slots.length > 0) {
                availableSlots.push({
                    date: dateStr,
                    slots
                })
            }
        }

        return NextResponse.json({
            service: { durationMinutes: service.durationMinutes },
            availability: availableSlots
        })
    } catch (error) {
        console.error('Error fetching availability:', error)
        return NextResponse.json(
            { error: 'Failed to fetch availability' },
            { status: 500 }
        )
    }
}