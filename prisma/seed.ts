import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Seeds one realistic business so the dashboard and webhooks have something to
// work against locally. Uses the Edison Twilio number from the environment.
async function main() {
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER || "+18775264170";

  const business = await prisma.business.upsert({
    where: { ownerEmail: "owner@rivera-comfort.test" },
    update: {},
    create: {
      name: "Rivera Comfort HVAC",
      ownerEmail: "owner@rivera-comfort.test",
      phoneNumber: "+12065550100",
      twilioNumber,
      businessType: "hvac",
      setupCompleted: true,
      avgTicketPrice: 300,
      conversationLimit: 300,
      plan: "standard",
      routingMode: "round_robin",
      businessHours: {
        mon: { open: "7:00 AM", close: "6:00 PM" },
        tue: { open: "7:00 AM", close: "6:00 PM" },
        wed: { open: "7:00 AM", close: "6:00 PM" },
        thu: { open: "7:00 AM", close: "6:00 PM" },
        fri: { open: "7:00 AM", close: "6:00 PM" },
        sat: { open: "8:00 AM", close: "2:00 PM" },
        sun: null,
      },
      aiToneSettings: { voice: "friendly" },
      workers: {
        create: [
          { name: "Theo Alvarez", phoneNumber: "+12065550111", keywords: ["drain", "leak"], routingOrder: 1 },
          { name: "Sam Okafor", phoneNumber: "+12065550112", keywords: ["furnace", "ac"], routingOrder: 2 },
        ],
      },
    },
  });

  console.log(`Seeded business ${business.name} (${business.id})`);
  console.log(`Edison number: ${business.twilioNumber}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
