import os
import re
import spacy
import pdfplumber  # ✅ Meilleure extraction de texte que PyPDF2
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads/'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

nlp = spacy.load("en_core_web_sm")

# 🔹 Nom
def extract_name(text):
    doc = nlp(text)
    for ent in doc.ents:
        if ent.label_ == "PERSON" and len(ent.text.split()) >= 2:
            return ent.text.strip()
    return None

# 🔹 Email
def extract_email(text):
    match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    return match.group(0) if match else None

# 🔹 Téléphone
def extract_phone_number(text):
    phone_matches = re.findall(r'(\+?\d[\d\s\-()]{7,}\d)', text)
    cleaned_numbers = [re.sub(r'[^+\d]', '', num) for num in phone_matches]
    return cleaned_numbers[0] if cleaned_numbers else None


# 🔹 Compétences
def extract_skills(text):
    keywords = [
        "python", "java", "c++", "html", "css", "javascript", "react", "nodejs", "sql",
        "mongodb", "git", "docker", "aws", "azure", "linux", "powerbi", "tableau",
        "figma", "agile", "scrum"
    ]

    skill_lines = []
    for line in text.split('\n'):
        if re.search(r'skills|compétences', line, re.IGNORECASE):
            skill_lines.append(line)

    found = []
    for line in skill_lines:
        for word in keywords:
            if re.search(rf'\b{re.escape(word)}\b', line, re.IGNORECASE):
                found.append(word.lower())
    return list(set(found))


# 🔹 Langues
def extract_languages(text):
    keywords = [
        "english", "french", "spanish", "arabic", "german", "italian",
        "français", "anglais", "espagnol", "arabe"
    ]

    lines = text.split('\n')
    language_lines = [line for line in lines if re.search(r'language|langue|languages|langues', line, re.IGNORECASE)]

    found = []
    for line in language_lines:
        for lang in keywords:
            if re.search(rf'\b{re.escape(lang)}\b', line, re.IGNORECASE):
                found.append(lang.capitalize())

    return list(set(found))


# 🔹 Expérience
def extract_experience(text):
    lines = text.split('\n')
    experience = []
    capture = False

    for line in lines:
        if re.search(r'experience|expériences professionnelles|work history|emploi', line, re.IGNORECASE):
            capture = True
            continue
        if capture:
            if re.search(r'education|formation|skills|certification|projects|langues', line, re.IGNORECASE):
                break
            if line.strip():
                experience.append(line.strip())
    return experience

if not text or len(text.strip()) < 50:
    return {'error': 'Le texte extrait est trop court ou vide'}


# 🔹 Extraction de texte robuste
def extract_text_from_pdf(file_path):
    text = ''
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + '\n'
    except Exception as e:
        print("Erreur lors de la lecture du PDF:", e)
    return text.strip()

# 🔹 Traitement du CV
def process_resume(file_path):
    text = extract_text_from_pdf(file_path)
    print("\n🧾 Texte extrait (preview):", text[:500])  # ✅ Affiche les 500 premiers caractères

    if not text:
        return {'error': 'Aucun texte extrait'}

    resume_data = {
        "name": extract_name(text),
        "email": extract_email(text),
        "phone": extract_phone_number(text),
        "skills": extract_skills(text),
        "languages": extract_languages(text),
        "experience": extract_experience(text)
    }

    print("🧠 Résumé analysé :", resume_data)
    return resume_data



# 🔹 Route d'upload
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'resume' not in request.files:
        return jsonify({'error': 'Fichier manquant'}), 400

    file = request.files['resume']
    if file.filename == '':
        return jsonify({'error': 'Nom de fichier vide'}), 400

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Seuls les fichiers PDF sont acceptés'}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)

    # ✅ LOGS DE DEBUG
    print(f"\n📄 Fichier reçu : {filename}")
    print(f"📂 Chemin complet : {file_path}")
    print(f"🧪 Fichier existe ? {os.path.exists(file_path)}")

    # ✅ EXTRACTION
    extracted = process_resume(file_path)

    # ✅ APERCU DU CONTENU RETOURNÉ
    print("🧠 Résumé des données extraites :", extracted)

    return jsonify(extracted)

# 🔹 Lancement
if __name__ == '__main__':
    app.run(debug=True, port=5002)
