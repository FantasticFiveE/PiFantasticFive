const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


// Définition du schéma pour un candidat
const CandidatSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,  // Le champ name est requis
    },
    email: {
        type: String,
        required: true,  // Le champ email est requis
        unique: true,    // L'email doit être unique
        lowercase: true, // Convertir l'email en minuscules avant de le stocker
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please fill a valid email address'], // Validation de l'email
    },
    password: {
        type: String,
        required: true,  // Le champ password est requis
        minlength: [6, 'Password must be at least 6 characters long'], // Validation de la longueur du mot de passe
    },
}, {
    timestamps: true, // Ajoute createdAt et updatedAt
});
CandidatSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        try {
            console.log("Mot de passe avant hachage:", this.password);  // Affiche le mot de passe en clair
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
            console.log("Mot de passe après hachage:", this.password);  // Affiche le mot de passe haché
        } catch (err) {
            console.error("Erreur lors du hachage du mot de passe:", err);
        }
    }
    next();
});

// Création du modèle à partir du schéma
const CandidatModel = mongoose.model('Candidat', CandidatSchema);

module.exports = CandidatModel;
