const { PrismaClient, Prisma } = require("../../generated/prisma");

const prisma = new PrismaClient();

module.exports = { prisma, Prisma };
