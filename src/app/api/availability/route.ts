// src/app/api/availability/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { voyagerClient } from '@/lib/voyager-client'
import { addDays, format, parseISO } from 'date-fns'

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

        // Get service details for duration
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            select: { id: true, name: true, durationMinutes: true }
        })

        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 })
        }

        try {
            // Fetch real-time availability from Voyager
            const voyagerAvailability = await voyagerClient.getAvailability(
                serviceId,
                dateFrom,
                dateTo
            )

            // Transform Voyager response to match our frontend expectations
            const availability = voyagerAvailability.map(day => ({
                date: day.date,
                slots: day.slots
                    .filter(slot => slot.available)
                    .map(slot => ({
                        time: slot.startTime.substring(11, 16), // Extract HH:MM from ISO string
                        available: slot.available
                    }))
            })).filter(day => day.slots.length > 0)

            return NextResponse.json({
                service: { durationMinutes: service.durationMinutes },
                availability
            })

        } catch (voyagerError) {
            console.error('Voyager integration failed, falling back to local availability:', voyagerError)

            // Fallback to local availability if Voyager is unavailable
            const fromDate = parseISO(dateFrom)
            const toDate = parseISO(dateTo)

            // Get local availability slots as fallback
            const localSlots = await prisma.availabilitySlot.findMany({
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

            // Get existing appointments to check conflicts
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

            // Filter out booked slots and past slots
            const availableSlots = localSlots.filter(slot => {
                const isBooked = bookedTimes.has(slot.startTime.toISOString())
                const isPast = slot.startTime < now
                return !isBooked && !isPast
            })

            // Group by date
            const groupedSlots: Record<string, { time: string; available: boolean }[]> = {}

            for (const slot of availableSlots) {
                const dateStr = format(slot.startTime, 'yyyy-MM-dd')
                const timeStr = format(slot.startTime, 'HH:mm')

                if (!groupedSlots[dateStr]) {
                    groupedSlots[dateStr] = []
                }

                groupedSlots[dateStr].push({
                    time: timeStr,
                    available: true,
                })
            }

            const availability = Object.entries(groupedSlots).map(([date, slots]) => ({
                date,
                slots,
            })).sort((a, b) => a.date.localeCompare(b.date))

            return NextResponse.json({
                service: { durationMinutes: service.durationMinutes },
                availability
            })
        }

    } catch (error) {
        console.error('Error fetching availability:', error)
        return NextResponse.json(
            { error: 'Failed to fetch availability' },
            { status: 500 }
        )
    }
}