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

        const bodyPart = await prisma.bodyPart.findUnique({
            where: {
                id: id,
                active: true
            },
            select: {
                id: true,
                name: true,
                preparationText: true,
                service: {
                    select: {
                        name: true,
                        durationMinutes: true
                    }
                }
            }
        })

        if (!bodyPart) {
            return NextResponse.json(
                { error: 'Body part not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(bodyPart)
    } catch (error) {
        console.error('Error fetching preparation info:', error)
        return NextResponse.json(
            { error: 'Failed to fetch preparation information' },
            { status: 500 }
        )
    }
}