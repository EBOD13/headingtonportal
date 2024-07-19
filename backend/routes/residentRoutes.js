const express = require("express");
const router = express.Router();
const { registerResident, getResidents, updateResident, deleteResident, getResidentByRoom, getGuestsByHost } = require("../controllers/residentController");
const { protect } = require("../middleware/authMiddleware");

router.get('/', protect, getResidents);
router.post("/", protect, registerResident);
router.put('/:id', protect, updateResident);
router.delete("/:id", protect, deleteResident);
router.get("/:room", protect, getResidentByRoom);
router.get("/guests/:hostId", protect, getGuestsByHost); 

module.exports = router;
