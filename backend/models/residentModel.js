const mongoose = require('mongoose');

const residentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    roomNumber: {
        type: String,
        required: [true, "Room number is required"]
    },
    email:{
        type: String,
        required :true
    },
    phoneNumber:{
        type: String, 
        require: true
    },
    studentID:{
        type: String,
        required: [true, "Student ID is required"]
    },
    guests:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Guest' }],
    
    flagged:{
        type: Boolean,
        default: false
    }
},
{timestamps: true}
);

const Resident = mongoose.model('Resident', residentSchema);

module.exports = Resident;


