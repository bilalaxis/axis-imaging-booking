import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        if (!id) {
            return NextResponse.json(
                { error: 'Service ID is required' },
                { status: 400 }
            )
        }

        const bodyParts = await prisma.bodyPart.findMany({
            where: {
                serviceId: id,
                active: true
            },
            orderBy: { name: 'asc' }
        })

        return NextResponse.json(bodyParts)
    } catch (error) {
        console.error(`Error fetching body parts for service:`, error)
        return NextResponse.json(
            { error: 'Failed to fetch body parts' },
            { status: 500 }
        )
    }
}