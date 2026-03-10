const { prisma } = require("./src/lib/prismaClient");

async function fix() {
  try {
    const members = await prisma.member.findMany();
    console.log(`Fixing account numbers for ${members.length} members...`);

    for (const member of members) {
      // Generate unique 8-digit number
      // For existing ones, we can use a sequence or random
      const accNum = Math.floor(10000000 + Math.random() * 90000000).toString();
      
      await prisma.member.update({
        where: { id: member.id },
        data: { accountNumber: accNum }
      });
      console.log(`Updated ${member.name} with Acc: ${accNum}`);
    }

    console.log("Done!");
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
