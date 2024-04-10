const Guest = require("../models/guestModel");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const Resident = require("../models/residentModel");
const express = require("express");
const router = express.Router();

const getCheckedInGuests = asyncHandler(async (req, res) => {
    const guests = await Guest.find({ isCheckedIn: true });
    const checkedInGuestsCount = await Guest.countDocuments({ isCheckedIn: true });
    res.status(200).json({ guests: guests, count: checkedInGuestsCount });
});

const registerGuest = asyncHandler(async (req, res) => {
    const { name, host, contact, studentAtOU, IDNumber } = req.body;

    if (!name || !IDNumber || !contact || !host) {
        res.status(400).json({ message: "All fields are required" });
        throw new Error("All fields are required");
    }

    const guestExist = await Guest.findOne({ $or: [{ contact: contact }, { IDNumber: IDNumber }] });

    if (guestExist) {
        res.status(401).json({ message: "Guest already exists" });
        throw new Error("Guest already exists");
    }

    try {
        const guest = await Guest.create({
            name: name,
            host: host,
            contact: contact,
            studentAtOU: studentAtOU,
            IDNumber: IDNumber,
            flagged: false,
            isCheckedIn: true,
            checkIn: Date.now()
        });

        if (!guest) {
            res.status(400).json({ message: "Invalid data" });
            throw new Error("Invalid data");
        }

        const updatedResident = await Resident.findByIdAndUpdate(
            host,
            { $push: { guests: guest._id } },
            { new: true }
        );

        if (!updatedResident) {
            res.status(404).json({ message: "Host not found" });
            throw new Error("Host not found");
        }

        res.status(201).json({ message: "Guest registered successfully" });
    } catch (error) {
        console.error("Error registering guest:", error);
        res.status(500).json({ message: "Internal Server Error" });
        throw new Error("Error registering guest: " + error.message);
    }
});
const checkInGuest = asyncHandler(async (req, res) => {
    const { guestId } = req.params; // Ensure guestId is obtained from params
    try {
      // Use guestId to perform check-in logic
      const guest = await Guest.findById(guestId);
  
      if (!guest) {
        res.status(400).json({ message: `Guest does not exist ${guestId}` });
        throw new Error("Guest does not exist");
      }
  
      guest.isCheckedIn = true;
      const guestCheckIn = await guest.save();
      res.status(200).json(guestCheckIn);
    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  




  const checkOutGuest = asyncHandler(async (req, res) => {
    const { guestId } = req.params;
  
    try {
      const guest = await Guest.findById(guestId);
  
      if (!guest) {
        return res.status(400).json({ message: `Guest does not exist ${guestId}` });
      }
  
      guest.isCheckedIn = false;
      guest.checkout = Date.now()
      await guest.save();
  
      return res.status(200).json({ message: 'Guest checked out successfully' });
    } catch (error) {
      console.error('Error checking out guest:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  
module.exports = { registerGuest, checkInGuest, checkOutGuest, getCheckedInGuests };
