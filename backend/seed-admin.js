const { prisma } = require("./src/lib/prismaClient");

async function seed() {
  try {
    console.log("Seeding admin user...");
    const admin = await prisma.member.upsert({
      where: { memberNumber: "ADMIN001" },
      update: { 
        role: "ADMIN",
        email: "unityinactioncbo@gmail.com" 
      },
      create: {
        memberNumber: "ADMIN001",
        name: "System Admin",
        email: "unityinactioncbo@gmail.com",
        phone: "0000000000",
        nationalId: "00000000",
        dateJoined: new Date(),
        role: "ADMIN"
      }
    });
    console.log("\nSUCCESS!");
    console.log("=========================================");
    console.log("ADMIN LOGIN EMAIL: " + admin.email);
    console.log("=========================================");
    console.log("You can now login using this email.");
  } catch (e) {
    console.error("Error seeding admin:", e);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
