require('dotenv').config();
const express = require('express');
const cors = require('cors');

const hospitalRoutes = require('./routes/hospitalRoutes');
const adminRoutes = require('./routes/adminRoutes');
const connectDB = require('./config/db');
const { releaseExpiredHolds } = require('./services/holdService');
const app = express();

app.use(cors({ origin: [process.env.FRONTEND_URL, 'http://localhost:5173' || process.env.ADMIN_URL, 'http://localhost:5174'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'MedRoute API running ✅' }));

const PORT = process.env.PORT || 5000;

// Databse Connection
connectDB();


setInterval(() => {
  releaseExpiredHolds().catch((e) => console.warn('[holds] releaseExpiredHolds:', e.message));
}, 20 * 1000);

app.listen(PORT, () => {
  console.log(`Server is running on PORT: http://localhost:${PORT}`);
});