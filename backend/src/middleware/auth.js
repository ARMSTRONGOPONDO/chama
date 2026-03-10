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

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }
    const userRole = req.user.role;
    const requiredRoles = Array.isArray(roles) ? roles : [roles];

    if (!requiredRoles.includes(userRole)) {
      return res.status(403).json({ error: "Forbidden: Insufficient role." });
    }
    next();
  };
}

module.exports = { attachMember, requireRole };
