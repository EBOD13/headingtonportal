// backend/controllers/guestController.js - COMPLETE FIXED VERSION
const Guest = require("../models/guestModel");
const Resident = require("../models/residentModel");
const asyncHandler = require("express-async-handler");

// @desc    Get all guests currently checked in
// @route   GET /api/guests/allguests
// @access  Private
const getCheckedInGuests = asyncHandler(async (req, res) => {
  try {
    const guests = await Guest.find({ isCheckedIn: true })
      .select('room name hostName contact checkIn')
      .sort({ checkIn: -1 }); // Sort by check-in time, newest first
    
    const checkedInGuestsCount = guests.length;
    const rooms = [...new Set(guests.map(guest => guest.room))]; // Unique room numbers
    
    res.status(200).json({ 
      success: true,
      rooms, 
      guests, 
      count: checkedInGuestsCount 
    });
  } catch (error) {
    console.error('Error fetching checked-in guests:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch checked-in guests',
      error: error.message 
    });
  }
});

// @desc    Register a new guest
// @route   POST /api/guests/register
// @access  Private
const registerGuest = asyncHandler(async (req, res) => {
  try {
    const { name, host, contact, studentAtOU, IDNumber, room } = req.body;

    console.log('Register guest request body:', req.body);

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Guest name is required' 
      });
    }
    
    if (!host) {
      return res.status(400).json({ 
        success: false, 
        message: 'Host ID is required' 
      });
    }
    
    if (!contact || !contact.toString().trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Contact number is required' 
      });
    }
    
    // studentAtOU should be a boolean (default to false if not provided)
    const studentAtOUBool = studentAtOU === true || studentAtOU === 'true' || studentAtOU === 'yes';
    
    // IDNumber is required if studentAtOU is true
    if (studentAtOUBool && (!IDNumber || !IDNumber.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID is required for OU students' 
      });
    }

    // Check if host exists
    const hostResident = await Resident.findById(host);
    if (!hostResident) {
      return res.status(404).json({ 
        success: false, 
        message: 'Host resident not found' 
      });
    }

    // Validate contact format (10 digits)
    const cleanContact = contact.toString().replace(/\D/g, '');
    if (cleanContact.length !== 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Contact must be 10 digits' 
      });
    }

    // Check if guest already exists with this contact
    const existingGuest = await Guest.findOne({ contact: cleanContact });
    if (existingGuest) {
      return res.status(409).json({ 
        success: false, 
        message: 'Guest with this contact number already exists' 
      });
    }

    // Check if guest already exists with this IDNumber (if provided)
    if (IDNumber && IDNumber.trim()) {
      const existingGuestByID = await Guest.findOne({ IDNumber: IDNumber.trim() });
      if (existingGuestByID) {
        return res.status(409).json({ 
          success: false, 
          message: 'Guest with this ID number already exists' 
        });
      }
    }

    // Validate room format (N/S followed by 3 digits)
    const roomRegex = /^[NS]\d{3}$/;
    const roomToUse = room || hostResident.roomNumber;
    if (!roomRegex.test(roomToUse.toUpperCase())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid room format. Use format like N101 or S222' 
      });
    }

    // Create guest
    const guest = await Guest.create({
      name: name.trim().toLowerCase(),
      host: host,
      hostName: hostResident.name,
      hostRoom: hostResident.roomNumber,
      contact: cleanContact,
      studentAtOU: studentAtOUBool,
      IDNumber: studentAtOUBool && IDNumber ? IDNumber.trim() : '',
      flagged: false,
      isCheckedIn: false, // New guests are not automatically checked in
      checkIn: Date.now(),
      room: roomToUse.toUpperCase(),
      wing: roomToUse.trim().charAt(0).toUpperCase() === 'S' ? 'South' : 'North'
    });

    // Add guest to resident's guest list
    if (!hostResident.guests) {
      hostResident.guests = [];
    }
    hostResident.guests.push(guest._id);
    await hostResident.save();

    res.status(201).json({ 
      success: true,
      message: "Guest registered successfully",
      guestId: guest._id,
      wing: guest.wing,
      guest: {
        id: guest._id,
        name: guest.name,
        contact: guest.contact,
        room: guest.room,
        wing: guest.wing,
        studentAtOU: guest.studentAtOU
      }
    });

  } catch (error) {
    console.error("Error registering guest:", error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Guest with similar details already exists'
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    // Handle cast errors (invalid ObjectId)
    if (error.name === 'CastError' && error.path === 'host') {
      return res.status(400).json({
        success: false,
        message: 'Invalid host ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during guest registration'
    });
  }
});

// @desc    Check in a guest
// @route   PUT /api/guests/checkin/:id
// @access  Private

const checkInGuest = asyncHandler(async (req, res) => {
  try {
    const { guestId } = req.params; // Use guestId to match route parameter
    
    // Validate guest ID
    if (!guestId) {
      console.log('ERROR: Guest ID is missing');
      return res.status(400).json({ 
        success: false,
        message: 'Guest ID is required' 
      });
    }

    const guest = await Guest.findById(guestId);
    
    if (!guest) {
      return res.status(404).json({ 
        success: false,
        message: `Guest not found with ID: ${guestId}` 
      });
    }
    
    if (guest.flagged) {
      console.log('ERROR: Guest is flagged');
      return res.status(403).json({
        success: false,
        message: "Visitation revoked for this guest"
      });
    }
    
    if (guest.isCheckedIn) {
      console.log('ERROR: Guest is already checked in');
      return res.status(400).json({
        success: false,
        message: "Guest is already checked in"
      });
    }

    guest.isCheckedIn = true;
    guest.checkIn = Date.now();
    guest.checkout = undefined; // Clear checkout time if exists
    
    const updatedGuest = await guest.save();
  
    res.status(200).json({
      success: true,
      message: "Guest checked in successfully",
      guest: {
        id: updatedGuest._id,
        name: updatedGuest.name,
        room: updatedGuest.room,
        checkIn: updatedGuest.checkIn,
        isCheckedIn: updatedGuest.isCheckedIn
      }
    });
    
  } catch (error) {
    console.error('Error checking in guest:', error);
    
    if (error.name === 'CastError') {
      console.log('ERROR: Invalid guest ID format');
      return res.status(400).json({
        success: false,
        message: 'Invalid guest ID format'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Internal server error during check-in' 
    });
  }
});

// @desc    Check out a guest
// @route   PUT /api/guests/checkout/:guestId
// @access  Private
const checkOutGuest = asyncHandler(async (req, res) => {
  try {
    const { guestId } = req.params;

    console.log('[checkOutGuest] req.params:', req.params);

    if (!guestId) {
      return res.status(400).json({
        success: false,
        message: 'Guest ID is required',
      });
    }

    const guest = await Guest.findById(guestId);

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: `Guest not found with ID: ${guestId}`,
      });
    }

    if (!guest.isCheckedIn) {
      return res.status(400).json({
        success: false,
        message: 'Guest is already checked out',
      });
    }

    guest.isCheckedIn = false;
    guest.checkout = Date.now();

    const updatedGuest = await guest.save();

    res.status(200).json({
      success: true,
      message: 'Guest checked out successfully',
      guest: {
        id: updatedGuest._id,
        name: updatedGuest.name,
        room: updatedGuest.room,
        checkout: updatedGuest.checkout,
        isCheckedIn: updatedGuest.isCheckedIn,
      },
    });
  } catch (error) {
    console.error('Error checking out guest:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid guest ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during check-out',
    });
  }
});


// @desc    Get all guests in the system
// @route   GET /api/guests
// @access  Private
const getGuests = asyncHandler(async (req, res) => {
  try {
    const guests = await Guest.find()
      .select(
        'name contact room hostName hostRoom wing isCheckedIn checkIn checkout flagged studentAtOU createdAt updatedAt'
      )
      .sort({ createdAt: -1 })
      .populate('host', 'name roomNumber');

    res.status(200).json({
      success: true,
      count: guests.length,
      guests,
    });
  } catch (error) {
    console.error('Error fetching all guests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch guests',
      error: error.message,
    });
  }
});


// @desc    Get guest by ID
// @route   GET /api/guests/:id
// @access  Private
const getGuestById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: 'Guest ID is required' 
      });
    }

    const guest = await Guest.findById(id)
      .populate('host', 'name roomNumber email phoneNumber');
    
    if (!guest) {
      return res.status(404).json({ 
        success: false,
        message: 'Guest not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      guest
    });
  } catch (error) {
    console.error('Error fetching guest by ID:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid guest ID format'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch guest' 
    });
  }
});

// @desc    Update guest information
// @route   PUT /api/guests/:id
// @access  Private
const updateGuest = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: 'Guest ID is required' 
      });
    }

    // Don't allow updating certain fields directly
    const disallowedFields = ['_id', 'createdAt', 'updatedAt', '__v'];
    disallowedFields.forEach(field => delete updateData[field]);
    
    // If contact is being updated, validate it
    if (updateData.contact) {
      const cleanContact = updateData.contact.toString().replace(/\D/g, '');
      if (cleanContact.length !== 10) {
        return res.status(400).json({ 
          success: false,
          message: 'Contact must be 10 digits' 
        });
      }
      updateData.contact = cleanContact;
    }
    
    // If studentAtOU is being set to true, ensure IDNumber is provided
    if (updateData.studentAtOU === true && (!updateData.IDNumber || !updateData.IDNumber.trim())) {
      return res.status(400).json({ 
        success: false,
        message: 'Student ID is required for OU students' 
      });
    }
    
    const guest = await Guest.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!guest) {
      return res.status(404).json({ 
        success: false,
        message: 'Guest not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Guest updated successfully',
      guest
    });
  } catch (error) {
    console.error('Error updating guest:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate field value entered'
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid guest ID format'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to update guest' 
    });
  }
});

// @desc    Flag/unflag a guest
// @route   PUT /api/guests/flag/:id
// @access  Private
const flagGuest = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { flagged, reason } = req.body;
    
    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: 'Guest ID is required' 
      });
    }
    
    if (flagged === undefined || flagged === null) {
      return res.status(400).json({ 
        success: false,
        message: 'Flagged status is required' 
      });
    }

    const guest = await Guest.findById(id);
    
    if (!guest) {
      return res.status(404).json({ 
        success: false,
        message: 'Guest not found' 
      });
    }
    
    guest.flagged = flagged;
    if (reason) guest.flagReason = reason;
    
    const updatedGuest = await guest.save();
    
    res.status(200).json({
      success: true,
      message: `Guest ${flagged ? 'flagged' : 'unflagged'} successfully`,
      guest: {
        id: updatedGuest._id,
        name: updatedGuest.name,
        flagged: updatedGuest.flagged,
        flagReason: updatedGuest.flagReason
      }
    });
  } catch (error) {
    console.error('Error flagging guest:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid guest ID format'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to update guest flag status' 
    });
  }
});
// backend/controllers/guestController.js
// Add these new functions:

// @desc    Get analytics data
// @route   GET /api/guests/analytics/overview
// @access  Private
const getAnalyticsOverview = asyncHandler(async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Get all counts in parallel
    const [
      totalGuests,
      checkedInGuests,
      flaggedGuests,
      allGuests,
      todayCheckins,
      weekCheckins
    ] = await Promise.all([
      Guest.countDocuments(),
      Guest.countDocuments({ isCheckedIn: true }),
      Guest.countDocuments({ flagged: true }),
      Guest.find().populate('host', 'name roomNumber'),
      Guest.countDocuments({ 
        checkIn: { $gte: today } 
      }),
      Guest.countDocuments({ 
        checkIn: { $gte: oneWeekAgo } 
      })
    ]);

    // Calculate wing distribution
    const northWingGuests = allGuests.filter(g => g.wing === 'North').length;
    const southWingGuests = allGuests.filter(g => g.wing === 'South').length;
    
    // Calculate student distribution
    const studentGuests = allGuests.filter(g => g.studentAtOU).length;
    const nonStudentGuests = totalGuests - studentGuests;
    
    // Calculate average visit duration
    const guestsWithDuration = allGuests.filter(g => g.checkIn && g.checkout);
    let averageVisitDuration = 'N/A';
    if (guestsWithDuration.length > 0) {
      const totalDuration = guestsWithDuration.reduce((total, guest) => {
        const checkIn = new Date(guest.checkIn);
        const checkout = new Date(guest.checkout);
        return total + (checkout - checkIn);
      }, 0);
      
      const avgMs = totalDuration / guestsWithDuration.length;
      const hours = Math.floor(avgMs / (1000 * 60 * 60));
      const minutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
      averageVisitDuration = `${hours}h ${minutes}m`;
    }

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalGuests,
          checkedInGuests,
          flaggedGuests,
          todayCheckins,
          weekCheckins
        },
        distribution: {
          wing: [
            { wing: 'North', count: northWingGuests, percentage: totalGuests > 0 ? (northWingGuests / totalGuests * 100).toFixed(1) : 0 },
            { wing: 'South', count: southWingGuests, percentage: totalGuests > 0 ? (southWingGuests / totalGuests * 100).toFixed(1) : 0 }
          ],
          student: [
            { type: 'Students', count: studentGuests, percentage: totalGuests > 0 ? (studentGuests / totalGuests * 100).toFixed(1) : 0 },
            { type: 'Non-Students', count: nonStudentGuests, percentage: totalGuests > 0 ? (nonStudentGuests / totalGuests * 100).toFixed(1) : 0 }
          ]
        },
        metrics: {
          averageVisitDuration,
          peakCheckinHour: '16:00 - 20:00', // This could be calculated from data
          averageGuestsPerDay: Math.round(weekCheckins / 7)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
      error: error.message
    });
  }
});

// @desc    Get room analytics
// @route   GET /api/guests/analytics/rooms
// @access  Private
const getRoomAnalytics = asyncHandler(async (req, res) => {
  try {
    const guests = await Guest.find({ isCheckedIn: true });
    
    // Count guests per room
    const roomCounts = guests.reduce((acc, guest) => {
      if (guest.room) {
        acc[guest.room] = (acc[guest.room] || 0) + 1;
      }
      return acc;
    }, {});

    // Convert to array and sort
    const topRooms = Object.entries(roomCounts)
      .map(([room, count]) => ({
        room,
        count,
        wing: room.charAt(0) === 'N' ? 'North' : 'South'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 rooms

    res.status(200).json({
      success: true,
      data: {
        topRooms,
        totalOccupiedRooms: Object.keys(roomCounts).length,
        averageGuestsPerRoom: guests.length > 0 ? (guests.length / Object.keys(roomCounts).length).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching room analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room analytics',
      error: error.message
    });
  }
});

// @desc    Get activity timeline
// @route   GET /api/guests/analytics/activity
// @access  Private
const getActivityTimeline = asyncHandler(async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    // Get recent check-ins and checkouts
    const recentCheckins = await Guest.find({ isCheckedIn: true })
      .sort({ checkIn: -1 })
      .limit(parseInt(limit))
      .select('name room checkIn hostName');

    const recentCheckouts = await Guest.find({ 
      isCheckedIn: false,
      checkout: { $exists: true }
    })
      .sort({ checkout: -1 })
      .limit(parseInt(limit))
      .select('name room checkout hostName');

    const activity = [
      ...recentCheckins.map(g => ({
        type: 'check-in',
        guest: g.name,
        room: g.room,
        time: g.checkIn,
        host: g.hostName
      })),
      ...recentCheckouts.map(g => ({
        type: 'check-out',
        guest: g.name,
        room: g.room,
        time: g.checkout,
        host: g.hostName
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time))
     .slice(0, limit);

    res.status(200).json({
      success: true,
      data: {
        activity,
        totalActivity: activity.length
      }
    });
  } catch (error) {
    console.error('Error fetching activity timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity timeline',
      error: error.message
    });
  }
});

// @desc    Get time-based analytics
// @route   GET /api/guests/analytics/timeline
// @access  Private
const getTimelineAnalytics = asyncHandler(async (req, res) => {
  try {
    const { period = 'day' } = req.query; // day, week, month
    let startDate;
    const now = new Date();
    
    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const guests = await Guest.find({
      checkIn: { $gte: startDate }
    }).select('checkIn checkout isCheckedIn');

    // Group by date
    const dailyStats = {};
    guests.forEach(guest => {
      const date = new Date(guest.checkIn).toDateString();
      if (!dailyStats[date]) {
        dailyStats[date] = {
          checkins: 0,
          checkouts: 0,
          active: 0
        };
      }
      
      dailyStats[date].checkins++;
      if (guest.checkout) {
        dailyStats[date].checkouts++;
      }
    });

    // Convert to array
    const timeline = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      ...stats
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({
      success: true,
      data: {
        period,
        timeline,
        totalCheckins: guests.length,
        currentActive: guests.filter(g => g.isCheckedIn).length
      }
    });
  } catch (error) {
    console.error('Error fetching timeline analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch timeline analytics',
      error: error.message
    });
  }
});

// @desc    Get export data
// @route   GET /api/guests/analytics/export
// @access  Private
const getExportData = asyncHandler(async (req, res) => {
  try {
    const guests = await Guest.find()
      .populate('host', 'name roomNumber')
      .select('name contact room hostName hostRoom wing isCheckedIn checkIn checkout flagged studentAtOU createdAt');

    // Format for CSV/Excel
    const exportData = guests.map(guest => ({
      'Guest Name': guest.name,
      'Contact': guest.contact,
      'Room': guest.room,
      'Wing': guest.wing,
      'Host Name': guest.hostName,
      'Host Room': guest.hostRoom,
      'Status': guest.isCheckedIn ? 'Checked In' : 'Checked Out',
      'Check-in Time': guest.checkIn ? new Date(guest.checkIn).toLocaleString() : 'N/A',
      'Check-out Time': guest.checkout ? new Date(guest.checkout).toLocaleString() : 'N/A',
      'Flagged': guest.flagged ? 'Yes' : 'No',
      'Student at OU': guest.studentAtOU ? 'Yes' : 'No',
      'Registration Date': new Date(guest.createdAt).toLocaleDateString()
    }));

    res.status(200).json({
      success: true,
      data: {
        guests: exportData,
        summary: {
          total: guests.length,
          checkedIn: guests.filter(g => g.isCheckedIn).length,
          flagged: guests.filter(g => g.flagged).length,
          students: guests.filter(g => g.studentAtOU).length
        },
        exportDate: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching export data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch export data',
      error: error.message
    });
  }
});

// Don't forget to add these to your exports:
module.exports = { 
  registerGuest, 
  checkInGuest, 
  checkOutGuest, 
  getCheckedInGuests, 
  getGuests,
  getGuestById,
  updateGuest,
  flagGuest,
  getAnalyticsOverview,
  getRoomAnalytics,
  getActivityTimeline,
  getTimelineAnalytics,
  getExportData
};