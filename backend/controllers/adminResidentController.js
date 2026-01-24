const asyncHandler = require('express-async-handler');
const Resident = require('../models/residentModel');
const { logActivity } = require('../utils/activityLogger');
const bcrypt = require('bcryptjs'); 

// GET /api/admin/residents
// Query: search, wing, active, semester, year
const getResidentRoster = asyncHandler(async (req, res) => {
  const { search, wing, active, semester, year } = req.query;
  const filter = {};

  if (wing) filter.wing = wing; // 'North' | 'South'

  if (active !== undefined) {
    filter.active = active === 'true';
  }

  if (semester) filter.semester = semester;
  if (year) filter.year = parseInt(year, 10);

  if (search) {
    const q = search.trim();
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { roomNumber: { $regex: q, $options: 'i' } },
      { studentID: { $regex: q, $options: 'i' } }
    ];
  }

  const residents = await Resident.find(filter)
    .sort({ active: -1, roomNumber: 1 })
    .lean();

  res.status(200).json({ count: residents.length, residents });
});

// PUT /api/admin/residents/:id/status
// Body: { active: boolean }
const updateResidentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { active, reason } = req.body;

  const resident = await Resident.findById(id);
  if (!resident) {
    return res.status(404).json({ message: 'Resident not found' });
  }

  resident.active = !!active;
  await resident.save();

  await logActivity({
    actorId: req.clerk._id,
    action: 'resident_status_changed',
    targetType: 'resident',
    targetId: resident._id,
    description: `Resident status set to ${resident.active ? 'active' : 'inactive'}${reason ? `: ${reason}` : ''}`,
    metadata: { active: resident.active, reason }
  });

  res.status(200).json({
    message: 'Resident status updated',
    resident
  });
});

// DELETE /api/admin/residents/:id
// (Thin wrapper over existing deleteResident but with activity)
const deleteResidentAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const resident = await Resident.findById(id);
  if (!resident) {
    return res.status(404).json({ message: 'Resident not found' });
  }

  await Resident.findByIdAndDelete(id);

  await logActivity({
    actorId: req.clerk._id,
    action: 'resident_deleted',
    targetType: 'resident',
    targetId: id,
    description: `Resident ${resident.name} (${resident.roomNumber}) deleted`
  });

  res.status(200).json({ message: 'Resident deleted', id });
});

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

const createResidentAdmin = asyncHandler(async (req, res) => {
  const {
    name,
    roomNumber,
    email,
    phoneNumber,
    studentID,
    semester,
    year,
    active,
  } = req.body || {};

  if (!name || !roomNumber || !email || !phoneNumber || !studentID) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const existing = await Resident.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(409).json({ message: 'A resident with this email already exists' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedID = await bcrypt.hash(String(studentID), salt);

  const resident = await Resident.create({
    name: String(name).trim(),
    roomNumber: String(roomNumber).trim().toUpperCase(),
    email: String(email).trim().toLowerCase(),
    phoneNumber: String(phoneNumber).trim(),
    studentID: hashedID,

    // optional fields
    semester: semester || undefined,
    year: typeof year === 'number' ? year : year ? parseInt(year, 10) : undefined,
    active: typeof active === 'boolean' ? active : true,
    flagged: false,
    guests: [],
  });

  await logActivity({
    actorId: req.clerk?._id,
    action: 'resident_created_admin',
    targetType: 'resident',
    targetId: resident._id,
    description: `Resident created by admin: ${resident.name} (${resident.roomNumber})`,
    metadata: { email: resident.email, semester: resident.semester, year: resident.year, active: resident.active },
  });

  // return the resident (lean-ish shape)
  res.status(201).json({
    message: 'Resident created',
    resident: {
      _id: resident._id,
      name: resident.name,
      roomNumber: resident.roomNumber,
      email: resident.email,
      phoneNumber: resident.phoneNumber,
      active: resident.active,
      semester: resident.semester,
      year: resident.year,
      wing: resident.wing,
      createdAt: resident.createdAt,
      updatedAt: resident.updatedAt,
    },
  });
});

module.exports = {
  getResidentRoster,
  updateResidentStatus,
  deleteResidentAdmin,
  createResidentAdmin,
  registerResident,
};
