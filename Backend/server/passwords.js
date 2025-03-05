const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config(); // Load environment variables from .env file

// Connect to your MongoDB database
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Define your User model (make sure it matches your existing schema)
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, required: true, enum: ['ADMIN', 'ENTERPRISE', 'CANDIDATE'] },
    password: { type: String, required: true },
    // Include all other fields from your schema
});

const User = mongoose.model('User', UserSchema);

// Function to hash passwords
async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10); // Generate a salt
    return await bcrypt.hash(password, salt); // Hash the password
}

// Migration script
async function migratePasswords() {
    try {
        // Fetch all users from the database
        const users = await User.find({});

        // Loop through each user and hash their password
        for (const user of users) {
            if (user.password) { // Check if the password exists
                const hashedPassword = await hashPassword(user.password); // Hash the password
                user.password = hashedPassword; // Update the password field
                await user.save(); // Save the updated user
                console.log(`Updated password for user: ${user.email}`);
            }
        }

        console.log('Password migration completed successfully.');
    } catch (error) {
        console.error('Error during password migration:', error);
    } finally {
        mongoose.connection.close(); // Close the database connection
    }
}

// Run the migration script
migratePasswords();