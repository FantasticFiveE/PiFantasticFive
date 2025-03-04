const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: false // Google peut créer sans nom, ce n'est plus obligatoire
    },
    password: {
        type: String,
        required: function () {
            return !this.googleId;  // Si googleId absent, on exige un password
        }
    },
    googleId: {
        type: String,
        unique: false, // Important pour éviter les conflits (ne pas mettre unique si le compte n'a pas GoogleId)
        sparse: true  // Permet à Mongoose d'accepter plusieurs comptes sans googleId
    },
    role: {
        type: String,
        enum: ['ADMIN', 'ENTERPRISE', 'CANDIDATE'],
        default: 'CANDIDATE'
    },
    emailVerified: { // Simplifié
        type: Boolean,
        default: false
    },
    verificationStatus: {
        emailVerified: { type: Boolean, default: false },
        status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
        updatedDate: { type: Date },
        reason: { type: String }
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    lastLogin: { type: Date },
    verificationCode: { // Ajout pour gérer le code de vérification
        type: String,
        required: false
    },
    picture: { type: String }
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
