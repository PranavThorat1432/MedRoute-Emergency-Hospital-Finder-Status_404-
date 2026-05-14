require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const app = express();


const PORT = process.env.PORT || 5000;

// Databse Connection
connectDB();


app.listen(PORT, () => {
    console.log(`Server is running on PORT: http://localhost:${PORT}`);
});