// src/app/api/availability/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { addDays, format, isBefore, startOfDay, parseISO } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const serviceId = searchParams.get('service_id')
        const dateFrom = searchParams.get('date_from') || format(new Date(), 'yyyy-MM-dd')
        const dateTo = searchParams.get('date_to') || format(addDays(new Date(), 30), 'yyyy-MM-dd')

        if (!serviceId) {
            return NextResponse.json(
                { error: 'Service ID is required' },
                { status: 400 }
            )
        }

        const fromDate = startOfDay(parseISO(dateFrom))
        const toDate = startOfDay(addDays(parseISO(dateTo), 1))

        // 1. Fetch all available slots for the service within the date range
        const potentialSlots = await prisma.availabilitySlot.findMany({
            where: {
                serviceId: serviceId,
                isAvailable: true,
                startTime: {
                    gte: fromDate,
                    lt: toDate,
                },
            },
            orderBy: {
                startTime: 'asc',
            },
        })

        // 2. Fetch all existing confirmed/pending appointments for conflict checking
        const existingAppointments = await prisma.appointment.findMany({
            where: {
                serviceId: serviceId,
                status: { in: ['pending', 'confirmed'] },
                scheduledDatetime: {
                    gte: fromDate,
                    lt: toDate,
                },
            },
            select: {
                scheduledDatetime: true,
            },
        })

        const bookedTimes = new Set(
            existingAppointments.map(appt => appt.scheduledDatetime.toISOString())
        )

        const now = new Date()

        // 3. Filter out booked slots and past slots
        const availableSlots = potentialSlots.filter(slot => {
            const isBooked = bookedTimes.has(slot.startTime.toISOString())
            const isPast = isBefore(slot.startTime, now)
            return !isBooked && !isPast
        })

        // 4. Group available slots by date for the frontend
        const groupedSlots: Record<string, { time: string; available: boolean }[]> = {}

        const timeZone = 'Australia/Melbourne' // Or your specific clinic's timezone

        for (const slot of availableSlots) {
            const localTime = toZonedTime(slot.startTime, timeZone)
            const dateStr = format(localTime, 'yyyy-MM-dd')
            const timeStr = format(localTime, 'HH:mm')

            if (!groupedSlots[dateStr]) {
                groupedSlots[dateStr] = []
            }

            groupedSlots[dateStr].push({
                time: timeStr,
                available: true, // All slots here are available by definition
            })
        }

        // 5. Convert the grouped object into an array for the response
        const responseData = Object.entries(groupedSlots).map(([date, slots]) => ({
            date,
            slots,
        })).sort((a, b) => a.date.localeCompare(b.date));

        return NextResponse.json({
            availability: responseData,
        })
    } catch (error) {
        console.error('Error fetching availability:', error)
        return NextResponse.json(
            { error: 'Failed to fetch availability' },
            { status: 500 }
        )
    }
}