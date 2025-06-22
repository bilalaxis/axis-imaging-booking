import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Clear existing data
    await prisma.hl7Message.deleteMany()
    await prisma.appointment.deleteMany()
    await prisma.availabilitySlot.deleteMany()
    await prisma.bodyPart.deleteMany()
    await prisma.service.deleteMany()

    // Create Services
    const ctService = await prisma.service.create({
        data: {
            name: 'CT Scan',
            code: 'CT',
            category: 'CT',
            description: 'Computed Tomography imaging using X-rays to create detailed cross-sectional images',
            durationMinutes: 30,
            active: true,
        },
    })

    const xrayService = await prisma.service.create({
        data: {
            name: 'X-Ray',
            code: 'XR',
            category: 'XRAY',
            description: 'Standard radiographic imaging using electromagnetic radiation',
            durationMinutes: 15,
            active: true,
        },
    })

    const dexaService = await prisma.service.create({
        data: {
            name: 'DEXA Scan',
            code: 'DXA',
            category: 'DEXA',
            description: 'Dual-energy X-ray absorptiometry for bone density measurement',
            durationMinutes: 20,
            active: true,
        },
    })

    const ultrasoundService = await prisma.service.create({
        data: {
            name: 'Ultrasound',
            code: 'US',
            category: 'ULTRASOUND',
            description: 'Medical imaging using high-frequency sound waves',
            durationMinutes: 30,
            active: true,
        },
    })

    // Create Body Parts for CT Scan
    const ctBodyParts = [
        {
            name: 'Abdomen & Pelvis',
            preparationText: `Please ensure you fast for two hours prior to your procedure.

Additional Requirements:
- Please arrive 15 minutes prior to your appointment time if you have any presence of kidney disease, diabetes or are taking Metformin, please bring copies of all your recent (within the last 3 months) blood test to your appointment.
- You do not need to hold your bladder and can continue with medication as normal.
- Drink 1 litre of water, 1 hour prior to your appointment time.`,
        },
        {
            name: 'Chest',
            preparationText: `No special preparation required.

Instructions:
- Please arrive 15 minutes prior to your appointment time.
- Wear comfortable clothing without metal fasteners.
- Remove all jewelry and metal objects from the chest area.`,
        },
        {
            name: 'Head',
            preparationText: `No special preparation required.

Instructions:
- Please arrive 15 minutes prior to your appointment time.
- Remove all jewelry, hairpins, and metal objects from the head and neck area.`,
        },
        {
            name: 'Spine',
            preparationText: `No special preparation required.

Instructions:
- Please arrive 15 minutes prior to your appointment time.
- Wear comfortable clothing without metal fasteners along the spine.`,
        },
        {
            name: 'Limbs',
            preparationText: `No special preparation required.

Instructions:
- Please arrive 15 minutes prior to your appointment time.
- Remove jewelry and metal objects from the area being scanned.`,
        },
    ]

    for (const bodyPart of ctBodyParts) {
        await prisma.bodyPart.create({
            data: {
                ...bodyPart,
                serviceId: ctService.id,
                active: true,
            },
        })
    }

    // Create Body Parts for X-Ray
    const xrayBodyParts = [
        {
            name: 'Chest',
            preparationText: `No special preparation required.

Instructions:
- Please arrive 15 minutes prior to your appointment time.
- Wear clothing without metal fasteners or remove upper garments as directed.`,
        },
        {
            name: 'Spine',
            preparationText: `No special preparation required.

Instructions:
- Please arrive 15 minutes prior to your appointment time.
- Wear comfortable clothing without metal objects along the spine.`,
        },
        {
            name: 'Pelvis',
            preparationText: `No special preparation required.

Instructions:
- Please arrive 15 minutes prior to your appointment time.
- Remove all metal objects from the pelvic area including belts and jewelry.`,
        },
        {
            name: 'Upper Limbs',
            preparationText: `No special preparation required.

Instructions:
- Please arrive 15 minutes prior to your appointment time.
- Remove jewelry and metal objects from the arm/hand being X-rayed.`,
        },
        {
            name: 'Lower Limbs',
            preparationText: `No special preparation required.

Instructions:
- Please arrive 15 minutes prior to your appointment time.
- Remove shoes and any metal objects from the leg/foot being X-rayed.`,
        },
    ]

    for (const bodyPart of xrayBodyParts) {
        await prisma.bodyPart.create({
            data: {
                ...bodyPart,
                serviceId: xrayService.id,
                active: true,
            },
        })
    }

    // Create Body Parts for DEXA Scan
    const dexaBodyParts = [
        {
            name: 'Spine',
            preparationText: `Special clothing requirements apply.

Instructions:
- Please arrive 15 minutes prior to your appointment time.
- Wear comfortable clothing without metal fasteners, zippers, or buttons along the spine.
- Remove all jewelry, glasses, and metal objects.
- Avoid calcium supplements 24 hours before the scan.`,
        },
        {
            name: 'Hip',
            preparationText: `Special clothing requirements apply.

Instructions:
- Please arrive 15 minutes prior to your appointment time.
- Wear comfortable clothing without metal fasteners around the hip area.
- Remove all jewelry and metal objects from the pelvic region.
- Avoid calcium supplements 24 hours before the scan.`,
        },
        {
            name: 'Forearm',
            preparationText: `Special clothing requirements apply.

Instructions:
- Please arrive 15 minutes prior to your appointment time.
- Wear short sleeves or clothing that can be rolled up easily.
- Remove all jewelry and watches from the arm being scanned.
- Avoid calcium supplements 24 hours before the scan.`,
        },
    ]

    for (const bodyPart of dexaBodyParts) {
        await prisma.bodyPart.create({
            data: {
                ...bodyPart,
                serviceId: dexaService.id,
                active: true,
            },
        })
    }

    // Create Body Parts for Ultrasound
    const ultrasoundBodyParts = [
        {
            name: 'Abdomen',
            preparationText: `Fasting required for this examination.

Preparation:
- Fast for 6 hours prior to your appointment (no food or drink except water).
- Take your regular medications with a small amount of water.
- Please arrive 15 minutes prior to your appointment time.`,
        },
        {
            name: 'Pelvis',
            preparationText: `Full bladder required for this examination.

Preparation:
- Drink 1 litre of water 1 hour before your appointment.
- Do not empty your bladder before the scan.
- Please arrive 15 minutes prior to your appointment time.`,
        },
        {
            name: 'Thyroid',
            preparationText: `No special preparation required.

Instructions:
- Please arrive 15 minutes prior to your appointment time.
- Wear clothing that allows easy access to the neck area.
- Remove all jewelry from the neck area.`,
        },
        {
            name: 'Carotid',
            preparationText: `No special preparation required.

Instructions:
- Please arrive 15 minutes prior to your appointment time.
- Wear clothing that allows easy access to the neck area.
- Remove all jewelry from the neck area.`,
        },
    ]

    for (const bodyPart of ultrasoundBodyParts) {
        await prisma.bodyPart.create({
            data: {
                ...bodyPart,
                serviceId: ultrasoundService.id,
                active: true,
            },
        })
    }

    // Create Availability Slots (Monday to Friday, 8 AM to 5 PM)
    const timeSlots = [
        { start: '08:00:00', end: '08:30:00' },
        { start: '08:30:00', end: '09:00:00' },
        { start: '09:00:00', end: '09:30:00' },
        { start: '09:30:00', end: '10:00:00' },
        { start: '10:00:00', end: '10:30:00' },
        { start: '10:30:00', end: '11:00:00' },
        { start: '11:00:00', end: '11:30:00' },
        { start: '11:30:00', end: '12:00:00' },
        { start: '13:00:00', end: '13:30:00' }, // Lunch break 12-1 PM
        { start: '13:30:00', end: '14:00:00' },
        { start: '14:00:00', end: '14:30:00' },
        { start: '14:30:00', end: '15:00:00' },
        { start: '15:00:00', end: '15:30:00' },
        { start: '15:30:00', end: '16:00:00' },
        { start: '16:00:00', end: '16:30:00' },
        { start: '16:30:00', end: '17:00:00' },
    ]

    const services = [ctService, xrayService, dexaService, ultrasoundService]

    // Create availability for Monday to Friday (1-5)
    for (const service of services) {
        for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
            for (const slot of timeSlots) {
                // X-Ray gets more frequent slots due to shorter duration
                if (service.category === 'XRAY') {
                    const xraySlots = [
                        { start: '08:00:00', end: '08:15:00' },
                        { start: '08:15:00', end: '08:30:00' },
                        { start: '08:30:00', end: '08:45:00' },
                        { start: '08:45:00', end: '09:00:00' },
                        // Add more 15-minute slots...
                    ]

                    for (const xraySlot of xraySlots) {
                        await prisma.availabilitySlot.create({
                            data: {
                                serviceId: service.id,
                                dayOfWeek,
                                startTime: xraySlot.start,
                                endTime: xraySlot.end,
                                isAvailable: true,
                            },
                        })
                    }
                } else {
                    await prisma.availabilitySlot.create({
                        data: {
                            serviceId: service.id,
                            dayOfWeek,
                            startTime: slot.start,
                            endTime: slot.end,
                            isAvailable: true,
                        },
                    })
                }
            }
        }
    }

    console.log('✅ Database seeded successfully!')
    console.log(`Created:`)
    console.log(`- ${services.length} services`)
    console.log(`- ${ctBodyParts.length + xrayBodyParts.length + dexaBodyParts.length + ultrasoundBodyParts.length} body parts`)
    console.log(`- Availability slots for weekdays`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })