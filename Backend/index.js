require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }).then(() => console.log("MongoDB Connected"))
    .catch(err => console.error("MongoDB Connection Error:", err));

// Import Routes
const userRoutes = require('./routes/userRoute');
const jobRoutes = require('./routes/jobRoute'); // Import job routes
const interviewRoutes = require('./routes/interviewRoute');
app.use('/api', userRoutes);
app.use('/api', jobRoutes);
app.use('/api', interviewRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});