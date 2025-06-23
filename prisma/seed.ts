import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Clean up existing data to ensure a fresh seed
    await prisma.appointment.deleteMany()
    await prisma.availabilitySlot.deleteMany()
    await prisma.bodyPart.deleteMany()
    await prisma.service.deleteMany()
    await prisma.patient.deleteMany()
    await prisma.hl7Message.deleteMany()
    console.log('✅ Cleared existing data')

    // Create services with realistic durations
    const services = await Promise.all([
        prisma.service.create({
            data: {
                name: 'X-Ray',
                code: 'XR',
                category: 'X-Ray',
                description: 'Standard X-Ray imaging',
                durationMinutes: 20, // Quick procedure
            },
        }),
        prisma.service.create({
            data: {
                name: 'CT Scan',
                code: 'CT',
                category: 'CT',
                description: 'Computed Tomography scan',
                durationMinutes: 45, // More complex, longer duration
            },
        }),
        prisma.service.create({
            data: {
                name: 'MRI',
                code: 'MRI',
                category: 'MRI',
                description: 'Magnetic Resonance Imaging',
                durationMinutes: 60, // Longest procedure
            },
        }),
        prisma.service.create({
            data: {
                name: 'Ultrasound',
                code: 'US',
                category: 'Ultrasound',
                description: 'Ultrasound imaging',
                durationMinutes: 30, // Medium duration
            },
        }),
    ])

    console.log('✅ Created services')

    // Create body parts for each service
    const bodyParts = await Promise.all([
        // X-Ray body parts
        prisma.bodyPart.create({
            data: {
                name: 'Chest',
                serviceId: services[0].id,
                preparationText: 'Remove all jewelry and metal objects. Wear loose clothing.',
            },
        }),
        prisma.bodyPart.create({
            data: {
                name: 'Spine',
                serviceId: services[0].id,
                preparationText: 'Remove all jewelry and metal objects. Wear loose clothing.',
            },
        }),
        prisma.bodyPart.create({
            data: {
                name: 'Extremities',
                serviceId: services[0].id,
                preparationText: 'Remove all jewelry and metal objects. Wear loose clothing.',
            },
        }),

        // CT Scan body parts
        prisma.bodyPart.create({
            data: {
                name: 'Chest',
                serviceId: services[1].id,
                preparationText: 'Fast for 4 hours before the scan. Remove all jewelry and metal objects.',
            },
        }),
        prisma.bodyPart.create({
            data: {
                name: 'Abdomen',
                serviceId: services[1].id,
                preparationText: 'Fast for 6 hours before the scan. Drink contrast material if prescribed.',
            },
        }),
        prisma.bodyPart.create({
            data: {
                name: 'Head',
                serviceId: services[1].id,
                preparationText: 'Remove all jewelry and metal objects. No special preparation required.',
            },
        }),

        // MRI body parts
        prisma.bodyPart.create({
            data: {
                name: 'Brain',
                serviceId: services[2].id,
                preparationText: 'Remove all metal objects. No food restrictions. Inform staff of any implants.',
            },
        }),
        prisma.bodyPart.create({
            data: {
                name: 'Spine',
                serviceId: services[2].id,
                preparationText: 'Remove all metal objects. No food restrictions. Inform staff of any implants.',
            },
        }),
        prisma.bodyPart.create({
            data: {
                name: 'Joints',
                serviceId: services[2].id,
                preparationText: 'Remove all metal objects. No food restrictions. Inform staff of any implants.',
            },
        }),

        // Ultrasound body parts
        prisma.bodyPart.create({
            data: {
                name: 'Abdomen',
                serviceId: services[3].id,
                preparationText: 'Fast for 6 hours before the scan. Drink plenty of water.',
            },
        }),
        prisma.bodyPart.create({
            data: {
                name: 'Pelvis',
                serviceId: services[3].id,
                preparationText: 'Drink plenty of water 1 hour before the scan. Have a full bladder.',
            },
        }),
        prisma.bodyPart.create({
            data: {
                name: 'Thyroid',
                serviceId: services[3].id,
                preparationText: 'No special preparation required.',
            },
        }),
    ])

    console.log('✅ Created body parts')

    // Create sample availability slots for the next 30 days
    const availabilitySlots = []
    const now = new Date()

    for (let day = 0; day < 30; day++) {
        const currentDate = new Date(now)
        currentDate.setDate(now.getDate() + day)

        // Skip weekends (Saturday = 6, Sunday = 0)
        const dayOfWeek = currentDate.getDay()
        if (dayOfWeek === 0 || dayOfWeek === 6) continue

        // Create slots from 9 AM to 5 PM with 30-minute intervals
        for (let hour = 9; hour < 17; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const startTime = new Date(currentDate)
                startTime.setHours(hour, minute, 0, 0)

                const endTime = new Date(startTime)
                endTime.setMinutes(startTime.getMinutes() + 30)

                // Create slots for each service
                for (const service of services) {
                    availabilitySlots.push({
                        serviceId: service.id,
                        startTime,
                        endTime,
                        isAvailable: true,
                    })
                }
            }
        }
    }

    await prisma.availabilitySlot.createMany({
        data: availabilitySlots,
    })

    console.log('✅ Created availability slots')
    console.log('✅ Database seeded successfully!')
}

main()
    .catch((e) => {
        console.error('❌ Seeding error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })