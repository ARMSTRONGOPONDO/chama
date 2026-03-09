const { PrismaClient, Prisma } = require("../../node_modules/.prisma/client");

const prisma = new PrismaClient();

module.exports = { prisma, Prisma };
