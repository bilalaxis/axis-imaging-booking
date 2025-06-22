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

        const bodyParts = await prisma.bodyPart.findMany({
            where: {
                serviceId: id,
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