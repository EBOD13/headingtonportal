const asyncHandler = require("express-async-handler")
const jwt = require("jsonwebtoken")
const Clerk = require("../models/clerkModel")
const bcrypt = require("bcryptjs")
const sendMail = require('../notification/emails/registeredClerkEmail')


const registerClerk = asyncHandler(async(req, res) =>{
    const {name, password, email} = req.body

    if(!name || !password || !email){
        res.status(400)
        throw new Error("All fields are required")
    }
    const clerkExist = await Clerk.findOne({email})

    if(clerkExist){
        res.status(401)
        throw new Error('User already exist')
    }

    let userID;
    let isUniqueID = false;
    

    while (!isUniqueID){
        userID = generateUserID();
        const existingUser = await Clerk.findOne({clerkID: userID})
        if(!existingUser){
            isUniqueID = true;
        }
    }

    const salt = await bcrypt.genSalt(16)
    const hashedPassword = await bcrypt.hash(password, salt)
    const clerk = await Clerk.create({name, password:hashedPassword, email, clerkID: userID })
    const capitalize = (str) =>{
        const capitalized = str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        return capitalized
      }
    sendMail(capitalize(name), email, userID)
    

    if(clerk){
        res.status(201).json({_id: clerk.id, name: clerk.name, email: clerk.email, clerkID: clerk.clerkID, token: generateJWTtoken(clerk._id)})
    }
    else{
        res.status(400)
        throw new Error("Invalid user data")
    }
});


const generateUserID = () =>{
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    return randomNumber.toString();
}

const loginClerk = asyncHandler(async (req, res) => {
    const { clerkCred, password } = req.body;
    
    // Check if clerkCred is either email or clerkID
    const clerk = await Clerk.findOne({
        $or: [
            { email: clerkCred },
            { clerkID: clerkCred }
        ]
    });

    if (clerk && await bcrypt.compare(password, clerk.password)) {
        res.json({
            _id: clerk._id,
            name: clerk.name,
            email: clerk.email,
            clerkID: clerk.clerkID,
            token: generateJWTtoken(clerk._id)
        });
    } else {
        res.status(401).json({ message: "Invalid credentials" }); // Unauthorized if credentials are invalid
    }
});


const getCurrentClerk = asyncHandler(async(req, res) =>{
    const {_id, name, email, clerkID} = await Clerk.findById(req.clerk.id)
    res.status(200).json({id:_id, name, email, clerkID})
});

const generateJWTtoken = id => jwt.sign({id}, process.env.JWT_SECRET, {expiresIn:'15d'})

module.exports = {registerClerk, loginClerk, getCurrentClerk}