const { prisma } = require("../lib/prismaClient");

async function attachMember(req, _res, next) {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    return next();
  }

  const token = header.replace("Bearer ", "").trim();
  if (!token) {
    return next();
  }

  try {
    const member = await prisma.member.findUnique({ where: { id: token } });
    if (member) {
      req.user = member;
    }
  } catch (error) {
    console.warn("Unable to resolve member from token", error);
  }

  return next();
}

module.exports = { attachMember };
