import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Clean up existing data to ensure a fresh seed
    await prisma.appointment.deleteMany()
    await prisma.availabilitySlot.deleteMany()
    await prisma.patient.deleteMany()
    await prisma.bodyPart.deleteMany()
    await prisma.service.deleteMany()
    console.log('✅ Cleared existing data')

    // Create Services
    const ctService = await prisma.service.create({
        data: {
            name: 'CT Scan',
            code: 'CT',
            category: 'CT',
            durationMinutes: 30,
            description: 'A computed tomography (CT) scan combines a series of X-ray images taken from different angles around your body and uses computer processing to create cross-sectional images (slices) of the bones, blood vessels and soft tissues inside your body.',
        },
    })

    const xrayService = await prisma.service.create({
        data: {
            name: 'X-Ray',
            code: 'XRAY',
            category: 'XRAY',
            durationMinutes: 15,
            description: 'An X-ray is a quick, painless test that produces images of the structures inside your body — particularly your bones.',
        },
    })

    const dexaService = await prisma.service.create({
        data: {
            name: 'DEXA Scan',
            code: 'DXA',
            category: 'bone_density',
            description: 'Dual-energy X-ray absorptiometry for bone density measurement',
            durationMinutes: 20,
            active: true,
        },
    })

    const ultrasoundService = await prisma.service.create({
        data: {
            name: 'Ultrasound',
            code: 'US',
            category: 'ultrasound',
            description: 'Medical imaging using high-frequency sound waves',
            durationMinutes: 30,
            active: true,
        },
    })

    console.log('✅ Created services')

    // Create Body Parts for CT Scan
    await prisma.bodyPart.createMany({
        data: [
            {
                name: 'Abdomen & Pelvis',
                serviceId: ctService.id,
                preparationText: 'Please ensure you fast for two hours prior to your procedure. Drink 1 litre of water, 1 hour prior to your appointment time. You do not need to hold your bladder and can continue with medication as normal.',
            },
            { name: 'Chest', serviceId: ctService.id, preparationText: 'No special preparation required.' },
            { name: 'Ankle/s', serviceId: xrayService.id, preparationText: 'No special preparation required.' },
            { name: 'Knee', serviceId: xrayService.id, preparationText: 'No special preparation required.' },
        ],
    })

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
                name: bodyPart.name,
                serviceId: xrayService.id,
                preparationText: bodyPart.preparationText,
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
                name: bodyPart.name,
                serviceId: dexaService.id,
                preparationText: bodyPart.preparationText,
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
                name: bodyPart.name,
                serviceId: ultrasoundService.id,
                preparationText: bodyPart.preparationText,
                active: true,
            },
        })
    }

    console.log('✅ Created body parts')

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