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

        const service = await prisma.service.findUnique({
            where: {
                id: id,
                active: true
            },
            include: {
                bodyParts: {
                    where: { active: true },
                    orderBy: { name: 'asc' }
                }
            }
        })

        if (!service) {
            return NextResponse.json(
                { error: 'Service not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(service)
    } catch (error) {
        console.error('Error fetching service:', error)
        return NextResponse.json(
            { error: 'Failed to fetch service' },
            { status: 500 }
        )
    }
}