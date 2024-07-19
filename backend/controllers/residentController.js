const asyncHandler = require("express-async-handler");
const Resident = require("../models/residentModel");
const bcrypt = require("bcryptjs");


const getResidents = asyncHandler(async(req, res)=>{
        const residents = await Resident.find();
        res.status(200).json(residents)
        
});
const getGuestsByHost = asyncHandler(async (req, res) => {
    const { hostId } = req.params; 

    try {
const resident = await Resident.findById(hostId)
    .populate({
        path: 'guests',
        match: { isCheckedIn: false } // Only populate guests where isCheckedIn is false
    });

        if (!resident) {
            return res.status(404).json({ message: 'Resident not found' });
        }

        const guestNames = resident.guests.map(guest => ({ name: guest.name, id: guest._id }));
        res.status(200).json({ guestNames });

    } catch (error) {
        console.error('Error retrieving guests:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


const registerResident = asyncHandler(async (req, res) => {
    const { name, roomNumber, email, phoneNumber, studentID } = req.body;

    if (!name || !roomNumber || !email || !phoneNumber || !studentID) {
        res.status(400);
        throw new Error("All fields are required");
    }

    const residentExist = await Resident.findOne({ email });

    if (residentExist) {
        res.status(401);
        throw new Error("Resident already in database");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedID = await bcrypt.hash(studentID, salt);

    const resident = await Resident.create({
        name,
        roomNumber,
        email,
        phoneNumber,
        studentID: hashedID,
        flagged: false, // Assuming flagged should be set to false by default
        guests: [] // Empty array for guests
    });

    if (resident) {
        res.status(201).json({
            _id: resident._id,
            name: resident.name,
            roomNumber: resident.roomNumber,
            email: resident.email,
            phoneNumber: resident.phoneNumber
        });
    } else {
        res.status(400);
        throw new Error("Failed to register resident");
    }
});

const updateResident = asyncHandler(async(req, res) =>{
    const resident = await Resident.findById(req.params.id);
    if(!resident){
        res.status(400)
        throw new Error("No resident found")
    }
    const updateResident = await Resident.findByIdAndUpdate(req.params.id, req.body, {new: true})
    res.status(200).json(updateResident)

})
const deleteResident = asyncHandler(async(req, res) =>{
    const resident = await Resident.findById(req.params.id)
    if(!resident){
        res.status(400)
        throw new Error("Resident not found")
    }
    // if (!req.clerk || req.clerk.role !== "admin"){
    //     res.status(401);
    //     throw new Error("Not authorized to delete resident")
    // }
    await Resident.findByIdAndDelete(req.params.id);
    res.status(200).json({id: req.params.id})
})
const getResidentByRoom = asyncHandler(async (req, res) => {
    const room = req.params.room; // Corrected to 'room' instead of 'id'
    
    try {
        const residents = await Resident.find({ roomNumber: room });
        
        if (residents.length > 0) {
            res.status(200).json(residents);
        } else {
            res.status(404).json({ message: "No residents found for the specified room number" });
        }
    } catch (error) {
        console.error("Error fetching residents by room:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = {registerResident, getResidents, updateResident, deleteResident, getResidentByRoom, getGuestsByHost};
