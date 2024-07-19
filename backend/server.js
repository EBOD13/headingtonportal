const express = require("express");
// const {errorHandler} = require('./middleware/errorMiddleware')
const dotenv = require("dotenv").config();
const connectDB = require('./database/database')
const port = process.env.PORT || 5000;
const { google } = require('googleapis');
const bodyParser = require('body-parser');
// Require the fs module to read the credential file we have 
const fs = require('fs');

 // Call the main function of connecting to the database before anything else works

connectDB();
const app = express();


// The two lines below should always come before connecting to our api routes.
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use(`/api/sheets`, require('./routes/sheetRoutes'))
app.use(`/api/clerks`, require('./routes/clerkRoutes'))
app.use('/api/residents', require('./routes/residentRoutes'))
app.use('/api/guests', require("./routes/guestRoutes"))

// app.use(errorHandler); // Use the errorHandler to only show the error message in our page not on the node server

app.listen(port, ()=>{
    console.log(`Connected to port ${port}`)
})
