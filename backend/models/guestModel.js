const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    host: {
        type: mongoose.Schema.Types.ObjectId, 
        required: true, 
        ref: 'Clerk'
    },
    contact:{
        type: String, 
        require: true
    },
    studentAtOU:{
        type: Boolean,
        required: true
    },
    IDNumber:{
        type: String
    },
    flagged:{
        type: Boolean,
        default: false
    },
    checkIn:{
        type: Date,
        default: Date.now
    },
    checkout:{
        type: Date
    },
    isCheckedIn:{
        type: Boolean, default: true
    },
   }
);

const Guest = mongoose.model('Guest', guestSchema);

module.exports = Guest;


