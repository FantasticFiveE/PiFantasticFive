const axios = require("axios");

async function autoGenerateApplication(resume, jobTitle) {
  const prompt = `Voici mon CV : ${resume}. Je veux postuler au poste de "${jobTitle}".
  Donne-moi une réponse claire et stricte comme suit :
  1. Niveau d'expérience (choisir exactement parmi : Étudiant, Débutant, Avec Expérience (Non-Manager), Responsable (Manager), Je suis au chômage et je cherche un travail)
  2. Types d'emploi ouverts (choisis parmi : CDI, CDD, Temps plein, Temps partiel, Freelance / Indépendant, Intérim, Saisonnier, Contrat al Karama, SIVP)
  3. Titre du poste proposé
  4. Domaine (choisir parmi : Informatique, Marketing, Commerce)
  5. Salaire minimum attendu (en TND)
  6. Statut de recherche actuel (exemple : Je cherche un CDI, Je suis au chômage, etc.)
  `;
  
  

  const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
    model: "openai/gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  }, {
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  return response.data.choices[0].message.content;
}

module.exports = autoGenerateApplication;
