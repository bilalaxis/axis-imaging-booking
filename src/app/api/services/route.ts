import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
    try {
        const services = await prisma.service.findMany({
            where: { active: true },
            orderBy: { name: 'asc' },
        })

        return NextResponse.json(services)
    } catch (error) {
        console.error('Error fetching services:', error)
        return NextResponse.json(
            { error: 'Failed to fetch services' },
            { status: 500 }
        )
    }
}