const asyncHandler = require('express-async-handler');
const Resident = require('../models/residentModel');
const { logActivity } = require('../utils/activityLogger');

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

module.exports = {
  getResidentRoster,
  updateResidentStatus,
  deleteResidentAdmin
};
