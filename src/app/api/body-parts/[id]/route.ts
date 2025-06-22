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
            include: {
                service: true
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
        console.error('Error fetching body part:', error)
        return NextResponse.json(
            { error: 'Failed to fetch body part' },
            { status: 500 }
        )
    }
}