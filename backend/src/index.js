require("dotenv/config");
const app = require("./app");
const { prisma } = require("./lib/prismaClient");

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  try {
    console.log("Checking for initial admin user...");
    const adminEmail = "unityinactioncbo@gmail.com";
    
    await prisma.member.upsert({
      where: { memberNumber: "ADMIN001" },
      update: { 
        role: "ADMIN",
        email: adminEmail 
      },
      create: {
        memberNumber: "ADMIN001",
        name: "STEVEN CHAMA ADMIN",
        email: adminEmail,
        phone: "0000000000",
        nationalId: "00000000",
        dateJoined: new Date(),
        role: "ADMIN"
      }
    });
    console.log(`System ready. Admin user: ${adminEmail}`);
  } catch (error) {
    console.error("Bootstrap error:", error);
  }
}

app.listen(PORT, async () => {
  console.log(`Chama API listening on port ${PORT}`);
  await bootstrap();
});
