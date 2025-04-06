const express = require('express');
const router = express.Router();
const autoGenerateApplication = require('../services/aiService');

router.post('/generate-application', async (req, res) => {
  const { resume, jobTitle } = req.body;

  try {
    const aiResult = await autoGenerateApplication(resume, jobTitle);
    res.json({ suggestion: aiResult });
  } catch (err) {
    console.error("❌ AI Error:", err);
    res.status(500).json({ message: "Erreur lors de la génération AI" });
  }
});

module.exports = router;
