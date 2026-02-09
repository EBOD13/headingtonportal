// backend/controllers/residentController.js
const asyncHandler = require('express-async-handler');
const Resident = require('../models/residentModel');
const bcrypt = require('bcryptjs');
const { logActivity } = require('../utils/activityLogger');


// ================================
// GET: all residents
// ================================
const getResidents = asyncHandler(async (req, res) => {
  const residents = await Resident.find().lean();
  res.status(200).json(residents);
});

// ================================
// GET: guests for a host (by hostId) + stats
// ================================
const getGuestsByHost = asyncHandler(async (req, res) => {
  const { hostId } = req.params;

  try {
    console.log('[getGuestsByHost] hostId:', hostId);

    const resident = await Resident.findById(hostId)
      .populate({
        path: 'guests',
      })
      .lean();

    if (!resident) {
      console.log('[getGuestsByHost] Resident not found for id:', hostId);
      return res.status(404).json({ message: 'Resident not found' });
    }

    const rawGuests = resident.guests || [];

    // Normalize each guest into a shape that works nicely for the UI
    const guests = rawGuests.map((guest) => ({
      id: guest._id,
      name: guest.name,
      flagged: !!guest.flagged,
      isCheckedIn: !!guest.isCheckedIn,
      checkIn: guest.checkIn || null,
      checkout: guest.checkout || null,
      visitCount: guest.visitCount || 1,
      lastVisit: guest.lastVisit || guest.checkout || guest.checkIn || null,
    }));

    // --- Stats ----
    const totalVisitors = guests.length;
    const flaggedVisitors = guests.filter((g) => g.flagged).length;
    const totalVisits = guests.reduce(
      (sum, g) => sum + (g.visitCount || 1),
      0
    );

    console.log('[getGuestsByHost] guests length:', guests.length);
    console.log('[getGuestsByHost] stats:', {
      totalVisitors,
      totalVisits,
      flaggedVisitors,
    });

    return res.status(200).json({
      guests,
      stats: {
        totalVisitors,
        totalVisits,
        flaggedVisitors,
      },
    });
  } catch (error) {
    console.error('Error retrieving guests:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ================================
// POST: register new resident
// ================================
// POST: register new resident
const registerResident = asyncHandler(async (req, res) => {
  const {
    name,
    roomNumber,
    email,
    phoneNumber,
    studentID,
    semester,
    year,
    active,
  } = req.body;

  if (!name || !roomNumber || !email || !phoneNumber || !studentID) {
    res.status(400);
    throw new Error('All fields are required');
  }

  const residentExist = await Resident.findOne({ email });

  if (residentExist) {
    res.status(401);
    throw new Error('Resident already in database');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedID = await bcrypt.hash(studentID, salt);

  const resident = await Resident.create({
    name,
    roomNumber,
    email,
    phoneNumber,
    studentID: hashedID,
    flagged: false,
    guests: [],
    // new fields
    semester: semester || undefined,
    year: year ? Number(year) : undefined,
    active: typeof active === 'boolean' ? active : true,
  });

  if (resident) {
    res.status(201).json({
      _id: resident._id,
      name: resident.name,
      roomNumber: resident.roomNumber,
      email: resident.email,
      phoneNumber: resident.phoneNumber,
      semester: resident.semester,
      year: resident.year,
      active: resident.active,
    });

    await logActivity({
      actorId: req.clerk?._id,
      action: 'resident_created',
      targetType: 'resident',
      targetId: resident._id,
      description: `Resident registered: ${resident.name} (${resident.roomNumber})`,
      metadata: { email: resident.email },
    });
  } else {
    res.status(400);
    throw new Error('Failed to register resident');
  }
});

// ================================
// PUT: update resident
// ================================
const updateResident = asyncHandler(async (req, res) => {
  const resident = await Resident.findById(req.params.id);
  if (!resident) {
    res.status(400);
    throw new Error('No resident found');
  }

  const updatedResident = await Resident.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  await logActivity({
  actorId: req.clerk?._id,
  action: 'resident_updated',
  targetType: 'resident',
  targetId: updatedResident._id,
  description: `Resident updated: ${updatedResident.name} (${updatedResident.roomNumber})`,
  metadata: { changes: req.body }
});


  res.status(200).json(updatedResident);
});

// ================================
// DELETE: delete resident
// ================================
const deleteResident = asyncHandler(async (req, res) => {
  const resident = await Resident.findById(req.params.id);
  if (!resident) {
    res.status(400);
    throw new Error('Resident not found');
  }

  await Resident.findByIdAndDelete(req.params.id);
  res.status(200).json({ id: req.params.id });
  await logActivity({
  actorId: req.clerk?._id,
  action: 'resident_deleted',
  targetType: 'resident',
  targetId: req.params.id,
  description: `Resident deleted: ${resident.name} (${resident.roomNumber})`
});
});

// ================================
// GET: resident(s) by roomNumber
// ================================
const getResidentByRoom = asyncHandler(async (req, res) => {
  const roomRaw = req.params.room;
  const room = roomRaw ? roomRaw.trim().toUpperCase() : '';

  console.log('[getResidentByRoom] raw room param:', roomRaw);
  console.log('[getResidentByRoom] normalized room:', room);

  try {
    const residents = await Resident.find({ roomNumber: room }).lean();

    console.log(
      `[getResidentByRoom] Found ${residents.length} resident(s) for room ${room}`
    );

    if (residents.length > 0) {
      return res.status(200).json(residents);
    }
    res
      .status(404)
      .json({ message: 'No residents found for the specified room number' });
  } catch (error) {
    console.error('Error fetching residents by room:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ================================
// GET: stats for dashboard
// ================================
//
// /api/residents/stats
// Returns:
//   { total, flagged, northWing, southWing }
const getResidentStats = asyncHandler(async (req, res) => {
  const total = await Resident.countDocuments({});
  const flagged = await Resident.countDocuments({ flagged: true });

  // Very simple wing split by room prefix
  const northWing = await Resident.countDocuments({
    roomNumber: { $regex: /^N/i },
  });
  const southWing = await Resident.countDocuments({
    roomNumber: { $regex: /^S/i },
  });

  const stats = { total, flagged, northWing, southWing };

  res.status(200).json(stats);
});

// ================================
// GET: search residents (name / email / room)
// ================================
//
// /api/residents/search?query=smith
// /api/residents/search?room=S222
// /api/residents/search?name=John
const searchResidents = asyncHandler(async (req, res) => {
  const { query, name, email, room } = req.query;

  const filter = {};

  if (room) {
    filter.roomNumber = room.trim().toUpperCase();
  }

  if (name) {
    filter.name = { $regex: name.trim(), $options: 'i' };
  }

  if (email) {
    filter.email = { $regex: email.trim(), $options: 'i' };
  }

  if (query && !name && !email && !room) {
    // generic text search across name/email/roomNumber
    const q = query.trim();
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { roomNumber: { $regex: q, $options: 'i' } },
    ];
  }

  try {
    const residents = await Resident.find(filter).lean();
    res.status(200).json(residents);
  } catch (err) {
    console.error('Error in searchResidents:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ================================
// Exports
// ================================
module.exports = {
  registerResident,
  getResidents,
  updateResident,
  deleteResident,
  getResidentByRoom,
  getGuestsByHost,
  getResidentStats,
  searchResidents,
};
