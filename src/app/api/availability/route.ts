// src/app/api/availability/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { addDays, format, isBefore, isToday, startOfDay } from 'date-fns'

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
        const availableSlots: {
            date: string
            slots: { time: string; available: boolean }[]
        }[] = []

        let currentDate = fromDate
        while (isBefore(currentDate, toDate) || format(currentDate, 'yyyy-MM-dd') === format(toDate, 'yyyy-MM-dd')) {
            // Skip past dates (except today)
            if (isBefore(currentDate, startOfDay(new Date())) && !isToday(currentDate)) {
                currentDate = addDays(currentDate, 1)
                continue
            }

            const dayOfWeek = currentDate.getDay()
            const dateStr = format(currentDate, 'yyyy-MM-dd')

            // Find slots for this day of week
            const daySlots = availabilitySlots.filter((slot: { dayOfWeek: number }) => slot.dayOfWeek === dayOfWeek)

            const slots = daySlots.map((slot: {
                startTime: string | Date
                dayOfWeek: number
            }) => {
                // Convert the time to string format if it's a Date object
                const timeString = typeof slot.startTime === 'string'
                    ? slot.startTime
                    : slot.startTime.toTimeString().slice(0, 8)

                // Create full datetime for this slot
                const slotDateTime = new Date(`${dateStr}T${timeString}`)

                // Check if slot is in the past (for today only)
                const isPastSlot = isToday(currentDate) && isBefore(slotDateTime, new Date())

                // Check if slot conflicts with existing appointment
                const hasConflict = existingAppointments.some((appointment: { scheduledDatetime: Date }) => {
                    const appointmentTime = appointment.scheduledDatetime
                    return format(appointmentTime, 'yyyy-MM-dd HH:mm:ss') === format(slotDateTime, 'yyyy-MM-dd HH:mm:ss')
                })

                return {
                    time: timeString,
                    available: !isPastSlot && !hasConflict
                }
            })

            if (slots.length > 0) {
                availableSlots.push({
                    date: dateStr,
                    slots
                })
            }

            currentDate = addDays(currentDate, 1)
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