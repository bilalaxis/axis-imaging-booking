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

    // Find the specific services to add body parts to
    const xrayService = services.find(s => s.code === 'XR')
    const ctService = services.find(s => s.code === 'CT')
    const mriService = services.find(s => s.code === 'MRI')
    const ultrasoundService = services.find(s => s.code === 'US')

    if (!xrayService || !ctService || !mriService || !ultrasoundService) {
        throw new Error('Could not find all required services in the seed data.')
    }

    // --- Body Part Seeding ---

    // X-Ray Body Parts from I-MED list
    const xrayBodyPartNames = [
        "Abdomen", "Ankle (bilateral)", "Ankle (left)", "Ankle (right)", "Arm (left)", "Arm (right)",
        "Chest", "Chest & ribs", "Chest ILO", "Chest ILO QLD Coal", "Elbow (left)", "Elbow (right)",
        "Femur (left)", "Femur (right)", "Foot (bilateral)", "Foot (left)", "Foot (right)",
        "Hand (left)", "Hand (right)", "Head", "Hip (bilateral)", "Hip (left)", "Hip (right)",
        "Knee (bilateral)", "Knee (left)", "Knee (right)", "Long leg (left)", "Long leg (right)",
        "Lower leg (left)", "Lower leg (right)", "Pelvis", "Shoulder (bilateral)", "Shoulder (right)", "Shoulder (left)",
        "Spine (cervical)", "Spine (full)", "Spine (lumbar)", "Spine (thoracic)",
        "Wrist (left)", "Wrist (right)"
    ];

    await prisma.bodyPart.createMany({
        data: xrayBodyPartNames.map(name => ({
            name,
            serviceId: xrayService.id,
            preparationText: "No specific preparation required, but please remove any jewelry or metal objects from the area being scanned.",
        }))
    });

    // CT Scan Body Parts from I-MED list
    const ctBodyPartNames = [
        "Abdomen & pelvis", "Ankle/s", "Calcium Score", "Cardiac Angiogram", "Chest",
        "Chest & abdomen & pelvis", "Chest ILO +HRCT", "Colonography", "Elbow/s", "Facial bones",
        "Feet (one or both)", "Hand(s) / finger(s)", "Head", "Hip/s", "Knee/s", "Lower Abdomen",
        "Lung cancer screening", "Pelvis", "Renal study - kidneys, urinary tract, bladder (KUB)",
        "Shoulder/s", "Sinuses", "Soft tissue neck / thyroid", "SPECT", "Spine (cervical)",
        "Spine (lumbosacral / lumbar)", "Spine (sacro-coccyx)", "Spine (thoracic)", "Wrist/s"
    ];

    await prisma.bodyPart.createMany({
        data: ctBodyPartNames.map(name => ({
            name,
            serviceId: ctService.id,
            preparationText: "Preparation can vary. Please consult with our staff when booking.",
        }))
    });

    // MRI body parts (existing)
    await prisma.bodyPart.createMany({
        data: [
            { name: 'Brain', serviceId: mriService.id, preparationText: 'Remove all metal objects. No food restrictions. Inform staff of any implants.' },
            { name: 'Spine', serviceId: mriService.id, preparationText: 'Remove all metal objects. No food restrictions. Inform staff of any implants.' },
            { name: 'Joints', serviceId: mriService.id, preparationText: 'Remove all metal objects. No food restrictions. Inform staff of any implants.' }
        ]
    })

    // Ultrasound body parts from I-MED list
    const ultrasoundBodyPartNames = [
        "Ankle (bilateral)", "Ankle (left)", "Ankle (right)", "Arm veins / arteries (bilateral)",
        "Arm veins / arteries (left)", "Arm veins / arteries (right)", "Breast (left)", "Breast (right)",
        "Buttock / thigh", "Carotid artery (neck)", "Deep vein thrombosis (DVT) (arm/s)",
        "Deep vein thrombosis (DVT) (leg/s)", "Elbow (left)", "Elbow (right)", "Foot (bilateral)",
        "Foot (left)", "Foot (right)", "Hand / wrist (left)", "Hand / wrist (right)", "Head",
        "Hip / groin (bilateral)", "Hip / groin (left)", "Hip / groin (right)", "Knee (bilateral)",
        "Knee (left)", "Knee (right)", "Leg veins / arteries (bilateral)", "Leg veins / arteries (left)",
        "Leg veins / arteries (right)", "Lower leg (left)", "Lower leg (right)", "Neck",
        "Pregnancy 12-16 weeks", "Pregnancy 17-22 weeks", "Pregnancy 17-22 weeks (twins or more)",
        "Pregnancy <12 weeks", "Pregnancy >22 weeks", "Pregnancy Nuchal / NT Scan",
        "Shoulder (bilateral)", "Shoulder (left)", "Shoulder (right)", "Testes"
    ];

    await prisma.bodyPart.createMany({
        data: ultrasoundBodyPartNames.map(name => ({
            name,
            serviceId: ultrasoundService.id,
            preparationText: "Preparation instructions vary by exam. Please confirm requirements when booking.",
        }))
    });

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