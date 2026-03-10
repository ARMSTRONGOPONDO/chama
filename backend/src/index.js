require("dotenv/config");
const app = require("./app");
const { prisma } = require("./lib/prismaClient");
const bcrypt = require("bcrypt");

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  try {
    console.log("Checking for initial admin user...");
    const adminEmail = "unityinactioncbo@gmail.com";
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    await prisma.member.upsert({
      where: { memberNumber: "ADMIN001" },
      update: { 
        role: "ADMIN",
        email: adminEmail,
        password: hashedPassword
      },
      create: {
        memberNumber: "ADMIN001",
        accountNumber: "00000001",
        name: "STEVEN CHAMA ADMIN",
        email: adminEmail,
        password: hashedPassword,
        phone: "0000000000",
        nationalId: "00000000",
        dateJoined: new Date(),
        role: "ADMIN"
      }
    });
    console.log(`System ready. Admin user: ${adminEmail} (Default Pass: admin123)`);
  } catch (error) {
    console.error("Bootstrap error:", error);
  }
}

app.listen(PORT, async () => {
  console.log(`Chama API listening on port ${PORT}`);
  await bootstrap();
});
