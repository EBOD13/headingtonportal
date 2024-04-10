const mongoose = require('mongoose');

const clerkSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    email:{
        type: String,
        required :[true, 'Email required']
    },
    clerkID:{
        type: String, 
        require: [true, 'Clerk ID is required']
    },
    role:{type: String, default:'clerk'}
},
{timestamps: true});

const Clerk = mongoose.model('Clerk', clerkSchema);

module.exports = Clerk;


