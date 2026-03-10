const express = require('express')
const { prisma } = require('../lib/prismaClient')
const { requireRole, attachMember } = require('../middleware/auth'); // Import requireRole and attachMember

const router = express.Router()

// Create a new group
router.post('/', attachMember, requireRole("ADMIN"), async (req, res) => {
  const { name, description, memberIds } = req.body
  const createdById = req.user.id; // Get createdById from authenticated user
  try {
    const group = await prisma.group.create({
      data: {
        name,
        description,
        createdBy: {
          connect: { id: createdById },
        },
        members: {
          connect: memberIds?.map((id) => ({ id })) || [], // Handle case where memberIds is not provided
        },
      },
      include: {
        members: true,
      },
    })
    res.status(201).json(group)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to create group.' })
  }
})

// Get all groups
router.get('/', attachMember, async (req, res) => { // No specific role required for reading groups, just authentication via attachMember
  try {
    const groups = await prisma.group.findMany({
      include: {
        members: true,
        createdBy: {
          select: { id: true, name: true, memberNumber: true },
        },
      },
    })
    res.json(groups)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch groups.' })
  }
})

// Get a single group by id
router.get('/:id', attachMember, async (req, res) => {
  const { id } = req.params
  try {
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: true,
        createdBy: {
          select: { id: true, name: true, memberNumber: true },
        },
      },
    })
    if (!group) {
      return res.status(404).json({ error: 'Group not found.' })
    }
    res.json(group)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch group.' })
  }
})

// Update a group
router.put('/:id', attachMember, requireRole("ADMIN"), async (req, res) => {
  const { id } = req.params
  const { name, description, memberIds } = req.body
  try {
    const group = await prisma.group.update({
      where: { id },
      data: {
        name,
        description,
        members: {
          set: memberIds?.map((id) => ({ id })) || [],
        },
      },
      include: {
        members: true,
      },
    })
    res.json(group)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to update group.' })
  }
})

// Delete a group
router.delete('/:id', attachMember, requireRole("ADMIN"), async (req, res) => {
  const { id } = req.params
  try {
    await prisma.group.delete({
      where: { id },
    })
    res.status(204).send()
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to delete group.' })
  }
})

module.exports = router
