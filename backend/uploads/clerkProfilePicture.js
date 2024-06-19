const ClerkModel = require('../models/clerkModel')
const multer = require('multer')

// Storage 

const Storage = multer.diskStorage({
    destination: 'uploads', 
    filename: (req, file, callback) =>{
        callback(null, file.originalname)
    }
})

const uploadProfile = multer({
    storage: Storage
}).single('clerkProfile')
