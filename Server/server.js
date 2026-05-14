require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db.js');
const hospitalRoutes = require('./routes/hospitalRoutes.js');
const adminRoutes = require('./routes/adminRoutes.js');


const app = express();
const PORT = process.env.PORT || 5000;

// Routes
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'MedRoute API running ✅' }));


// Databse Connection
connectDB();

app.listen(PORT, () => {
    console.log(`Server is running on PORT: http://localhost:${PORT}`);
});