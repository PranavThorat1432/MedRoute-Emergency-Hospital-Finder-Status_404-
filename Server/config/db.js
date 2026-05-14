const mongoose = require('mongoose');

const connectDB = async () => {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected to MedRoute'))
    .catch((err) => console.log('MongoDB Error:', err.message));
};

module.exports = connectDB;