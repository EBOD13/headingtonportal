const express = require("express")
const router = express.Router()
const {protect} = require("../middleware/authMiddleware")
const {readFromSheet, appendToSheet, updateRow} = require("../controllers/sheetController")


router.get("/read", readFromSheet)
router.post("/append", appendToSheet)
router.put("/update/", updateRow)

module.exports = router