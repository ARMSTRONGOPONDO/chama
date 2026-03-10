const { prisma } = require("./src/lib/prismaClient");

async function repair() {
  try {
    console.log("Using Database URL from environment...");
    console.log("Attempting to clear failed migration state on Render...");
    
    // Updated to the latest failed migration name
    const result = await prisma.$executeRawUnsafe(
      `DELETE FROM "_prisma_migrations" WHERE migration_name = '20260310140000_final_system_update' AND finished_at IS NULL`
    );
    
    console.log("Success! Failed migration record cleared.");
    console.log("You can now redeploy on Render.");
  } catch (e) {
    console.error("Error repairing DB:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

repair();
