const mongoose = require("mongoose")

// ESTABLISH A CONNECTION WITH THE MONGODB DATABASE 
const connectDB = async ()=>{
    try{
        const connect = await mongoose.connect(process.env.MONGODB_URI)
        console.log("Successfully connected to database")
    }
    catch(error) {
        console.log(error)
        process.exit
    }
}

module.exports = connectDB