import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const bodyParts = await prisma.bodyPart.findMany({
            where: {
                serviceId: params.id,
                active: true
            },
            orderBy: { name: 'asc' }
        })

        return NextResponse.json(bodyParts)
    } catch (error) {
        console.error('Error fetching body parts:', error)
        return NextResponse.json(
            { error: 'Failed to fetch body parts' },
            { status: 500 }
        )
    }
}