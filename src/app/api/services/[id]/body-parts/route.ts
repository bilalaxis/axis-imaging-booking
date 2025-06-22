import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const serviceId = params.id

        if (!serviceId) {
            return NextResponse.json(
                { error: 'Service ID is required' },
                { status: 400 }
            )
        }

        const bodyParts = await prisma.bodyPart.findMany({
            where: {
                serviceId: serviceId,
                active: true
            },
            orderBy: { name: 'asc' }
        })

        return NextResponse.json(bodyParts)
    } catch (error) {
        console.error(`Error fetching body parts for service ${params.id}:`, error)
        return NextResponse.json(
            { error: 'Failed to fetch body parts' },
            { status: 500 }
        )
    }
}