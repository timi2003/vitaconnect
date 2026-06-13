// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database…");

  // ── Demo Patient ────────────────────────────────────────────────────────
  const patientPw = await bcrypt.hash("patient123", 12);
  const patient = await prisma.user.upsert({
    where: { email: "patient@vitaconnect.health" },
    update: {},
    create: {
      email:        "patient@vitaconnect.health",
      name:         "Alex Johnson",
      passwordHash: patientPw,
      role:         "PATIENT",
      phone:        "+1-555-0100",
      dateOfBirth:  new Date("1990-03-15"),
      gender:       "MALE",
      bloodType:    "O_POSITIVE",
      height:       178,
      weight:       73.2,
      isVerified:   true,
      patientProfile: {
        create: {
          insuranceProvider: "BlueCross",
          insurancePolicyNo: "BC-8829-AJ",
        },
      },
    },
  });

  // ── Demo Doctors ────────────────────────────────────────────────────────
  const doctorPw = await bcrypt.hash("doctor123", 12);

  const doctors = [
    {
      email: "sarah.chen@vitaconnect.health",
      name: "Dr. Sarah Chen",
      specializations: ["Cardiology"],
      licenseNumber: "MD-CA-12345",
      experience: 14,
      fee: 75,
      rating: 4.9,
      bio: "Board-certified cardiologist with 14 years experience. Specializes in heart disease prevention and management.",
    },
    {
      email: "marcus.williams@vitaconnect.health",
      name: "Dr. Marcus Williams",
      specializations: ["General Practice", "Family Medicine"],
      licenseNumber: "MD-NY-67890",
      experience: 9,
      fee: 45,
      rating: 4.8,
      bio: "General practitioner focused on preventive care and chronic disease management.",
    },
    {
      email: "priya.patel@vitaconnect.health",
      name: "Dr. Priya Patel",
      specializations: ["Endocrinology"],
      licenseNumber: "MD-TX-11111",
      experience: 11,
      fee: 90,
      rating: 4.9,
      bio: "Endocrinologist specializing in diabetes, thyroid disorders, and hormonal imbalances.",
    },
  ];

  for (const doc of doctors) {
    await prisma.user.upsert({
      where: { email: doc.email },
      update: {},
      create: {
        email:        doc.email,
        name:         doc.name,
        passwordHash: doctorPw,
        role:         "DOCTOR",
        isVerified:   true,
        doctorProfile: {
          create: {
            licenseNumber:    doc.licenseNumber,
            specializations:  doc.specializations,
            experience:       doc.experience,
            consultationFee:  doc.fee,
            rating:           doc.rating,
            totalReviews:     Math.floor(Math.random() * 300) + 50,
            totalConsultations: Math.floor(Math.random() * 500) + 100,
            bio:              doc.bio,
            availableFor:     ["VIDEO", "AUDIO", "CHAT"],
            languages:        ["English"],
            isAvailableNow:   true,
            availabilitySlots: {
              createMany: {
                data: [1,2,3,4,5].map((day) => ({
                  dayOfWeek: day,
                  startTime: "09:00",
                  endTime: "17:00",
                  slotDuration: 30,
                })),
              },
            },
          },
        },
      },
    });
  }

  // ── Sample health metrics for patient ───────────────────────────────────
  const now = new Date();
  const metrics = [];

  for (let i = 0; i < 30; i++) {
    const t = new Date(now.getTime() - i * 86400000);

    metrics.push(
      { userId: patient.id, type: "HEART_RATE", value: 68 + Math.random() * 10, unit: "bpm",    source: "HEALTH_CONNECT", recordedAt: t },
      { userId: patient.id, type: "STEPS",      value: Math.round(5000 + Math.random() * 8000), unit: "steps", source: "HEALTH_CONNECT", recordedAt: t },
      { userId: patient.id, type: "WEIGHT",     value: 73 + (Math.random() - 0.5), unit: "kg",  source: "HEALTH_CONNECT", recordedAt: t },
    );
  }

  await prisma.healthMetric.createMany({ data: metrics as never[], skipDuplicates: true });

  console.log("✅ Seed complete");
  console.log("   Patient: patient@vitaconnect.health / patient123");
  console.log("   Doctor:  sarah.chen@vitaconnect.health / doctor123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
