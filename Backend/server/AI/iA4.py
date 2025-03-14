import os
import re
import spacy
import PyPDF2
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS

app = Flask(__name__)

CORS(app)  # ✅ Activer CORS pour toutes les routes


# 📂 Dossier où les fichiers seront stockés
UPLOAD_FOLDER = 'uploads/'

# 🛠️ Assurer que le dossier 'uploads/' existe
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# 🔍 Charger le modèle NLP spaCy
nlp = spacy.load("en_core_web_sm")

# 📝 Fonction pour extraire du texte d'un PDF
def extract_text_from_pdf(file_path):
    text = ''
    try:
        with open(file_path, 'rb') as file:
            pdf = PyPDF2.PdfReader(file)
            for page in pdf.pages:
                extracted_text = page.extract_text()
                if extracted_text:
                    text += extracted_text + "\n"
    except Exception as e:
        print(f"❌ Erreur lors de l'extraction du texte: {e}")
    return text.strip()  # Supprimer les espaces inutiles

# 🔍 Extraction d'email (via regex)
def extract_email(text):
    match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    return match.group(0) if match else None

# 📞 Extraction de numéro de téléphone (via regex)
def extract_phone_number(text):
    phone_patterns = [
        r'\+?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{1,4}',  # Formats internationaux avec parenthèses
        r'\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}',  # Formats nationaux (Ex: (212) 555-1234)
        r'\d{2}[-.\s]?\d{2}[-.\s]?\d{2}[-.\s]?\d{2}'   # Formats européens (Ex: 06 12 34 56 78)
    ]
    
    for pattern in phone_patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0).strip()
    
    return None

# 🛠️ Extraction des compétences (skills) avec regex et NLP
def extract_skills(text):
    match = re.search(r'Skills\s*[:\n](.+)', text, re.DOTALL)
    if match:
        skills = [skill.strip() for skill in re.split(r',|\n', match.group(1)) if skill.strip()]
        return skills
    
    doc = nlp(text)
    skills = [ent.text for ent in doc.ents if ent.label_ in ["SKILL", "PRODUCT"] or ent.text.lower() in ["python", "javascript", "java", "sql", "excel", "tableau", "powerpoint", "word", "html", "css", "react", "nodejs", "docker", "kubernetes", "aws", "azure", "gcp"]]
    return list(set(skills))  

# 🛠️ Extraction de l'expérience (Améliorée)
def extract_experience(text):
    # 📌 1. Recherche avec Regex pour détecter des sections "Experience", "Work Experience", etc.
    experience_patterns = [r'Experience\s*[:\n](.+)', r'Work Experience\s*[:\n](.+)', r'Expérience\s*[:\n](.+)']
    experience_section = None
    
    for pattern in experience_patterns:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            experience_section = match.group(1)
            break  # Arrête dès qu'on trouve une correspondance

    # 📌 2. Extraction via NLP (Entités liées aux expériences)
    experience_list = []
    if experience_section:
        experience_list = [exp.strip() for exp in re.split(r',|\n', experience_section) if exp.strip()]
    
    # 📌 3. Recherche des dates avec Regex
    date_matches = re.findall(r'(\d{4}[-/]?\d{2}?[-/]?\d{2}?|\d{4})', text)  # Ex: 2019-2021, 2020
    date_info = list(set(date_matches))  # Suppression des doublons

    # 📌 4. Traitement du texte avec NLP pour extraire des phrases d'expériences
    doc = nlp(text)
    nlp_experience = [sent.text for sent in doc.sents if "worked" in sent.text.lower() or "experience" in sent.text.lower()]
    
    # 📌 5. Fusion des résultats
    return {
        "extracted_experience": experience_list + nlp_experience,
        "dates": date_info
    }

# 🌍 Extraction des langues avec regex et NLP
def extract_languages(text):
    match = re.search(r'Languages\s*[:\n](.+)', text, re.DOTALL)
    if match:
        languages = [lang.strip() for lang in re.split(r',|\n', match.group(1)) if lang.strip()]
        return languages
    
    doc = nlp(text)
    languages = [ent.text for ent in doc.ents if ent.label_ == "LANGUAGE" or ent.text.lower() in ["english", "french", "spanish", "german", "italian","Arabe","Français","Anglais","Espagnol","Allemand","Italien"]]
    return list(set(languages))

# 📥 Fonction principale pour traiter un CV
def process_resume(file_path):
    resume_text = extract_text_from_pdf(file_path)
    if not resume_text:
        return {'error': 'Aucun texte extrait du PDF, vérifiez le format du fichier'}

    extracted_data = {
        'email': extract_email(resume_text),
        'phone': extract_phone_number(resume_text),
        'skills': extract_skills(resume_text),
        'languages': extract_languages(resume_text),
    }

    print("🔹 Données extraites :", extracted_data)
    return extracted_data

# 🖼️ API pour uploader un CV et l'analyser
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'resume' not in request.files:
        return jsonify({'error': 'Aucun fichier fourni'}), 400

    file = request.files['resume']
    if file.filename == '':
        return jsonify({'error': 'Aucun fichier sélectionné'}), 400

    # ✅ Vérifier si le fichier est un PDF
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Seuls les fichiers PDF sont acceptés'}), 400

    # ✅ Sécuriser le nom du fichier avant de l'enregistrer
    filename = secure_filename(file.filename)
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)

    print(f"📄 Fichier reçu : {filename}")

    # 🔍 Traiter le CV et extraire les informations
    result = process_resume(file_path)
    return jsonify(result)

# 🚀 Lancer l'application Flask
if __name__ == '__main__':
    app.run(debug=True, port=5002)
