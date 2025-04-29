import os
import re
import spacy
import pdfplumber
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Uploads folder
UPLOAD_FOLDER = 'uploads/'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load spaCy model
nlp = spacy.load("en_core_web_sm")

# Load skills from file
def load_skill_keywords():
    path = os.path.join(os.path.dirname(__file__), "skills_list.txt")
    if not os.path.exists(path):
        print("⚠️ Warning: skills_list.txt not found.")
        return []
    with open(path, 'r', encoding='utf-8') as f:
        return [line.strip().lower() for line in f if line.strip()]

skill_keywords = load_skill_keywords()

# Helper cleaning
def clean_text(text):
    return re.sub(r'\s+', ' ', text).replace('\r', '').replace('\t', '').strip()

# Extractors
def extract_name(text):
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    for line in lines[:5]:
        if line.istitle() and not any(word.lower() in ['cv', 'resume'] for word in line.split()):
            return line
    return None

def extract_email(text):
    match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    return match.group(0) if match else None

def extract_phone(text):
    match = re.search(r'(\+?\d{1,3})?[\s\-]?\(?\d{2,4}\)?[\s\-]?\d{3}[\s\-]?\d{3,4}', text)
    if match:
        phone = re.sub(r'\D', '', match.group(0))
        return '+' + phone if not phone.startswith('+') else phone
    return None

def extract_education(text):
    education = []
    lines = text.split('\n')
    capture = False
    for line in lines:
        if re.search(r'education|formation|academic background|études', line, re.IGNORECASE):
            capture = True
            continue
        if capture:
            if re.search(r'experience|work history|skills|certification|projects|languages', line, re.IGNORECASE):
                break
            if line.strip():
                education.append(line.strip())
    return education

def extract_experience(text):
    experience = []
    lines = text.split('\n')
    current_exp = {}
    capture = False
    for line in lines:
        if re.search(r'experience|work history|professional experience|emploi', line, re.IGNORECASE):
            capture = True
            continue
        if capture:
            if re.search(r'education|formation|skills|certification|projects|languages', line, re.IGNORECASE):
                break
            exp_match = re.search(r'^(.*?)\s*[-–]\s*(.*?)\s*[-–]\s*(.*)$', line)
            if exp_match:
                if current_exp:
                    experience.append(current_exp)
                current_exp = {
                    'company': exp_match.group(1).strip(),
                    'title': exp_match.group(2).strip(),
                    'duration': exp_match.group(3).strip(),
                    'description': []
                }
            elif line.strip():
                bullet_match = re.match(r'^[•\-]\s*(.*)', line.strip())
                if bullet_match:
                    current_exp.setdefault('description', []).append(bullet_match.group(1))
                elif current_exp and current_exp.get('description'):
                    if re.match(r'^\s+', line):
                        current_exp['description'][-1] += ' ' + line.strip()
    if current_exp:
        experience.append(current_exp)
    return experience

def extract_skills(text):
    skills = set()
    text_lower = text.lower()
    for skill in skill_keywords:
        if re.search(rf'\b{re.escape(skill)}\b', text_lower):
            skills.add(skill.capitalize())
    return sorted(list(skills))

def extract_languages(text):
    language_map = {
        "english": "English", "anglais": "English",
        "french": "French", "français": "French",
        "spanish": "Spanish", "español": "Spanish",
        "arabic": "Arabic", "arabe": "Arabic",
        "german": "German", "deutsch": "German",
        "italian": "Italian", "italiano": "Italian",
    }
    languages = set()
    text_lower = text.lower()
    for lang_key, lang_value in language_map.items():
        if re.search(rf'\b{re.escape(lang_key)}\b', text_lower):
            languages.add(lang_value)
    return sorted(list(languages))

def extract_summary(text):
    lines = text.split('\n')
    summary = []
    capture = False
    for line in lines:
        if re.search(r'(summary|about\s+me|profile|profil|personal\s+profile)', line, re.IGNORECASE):
            capture = True
            continue
        if capture:
            if re.search(r'experience|education|skills|languages', line, re.IGNORECASE):
                break
            if line.strip():
                summary.append(line.strip())
    return ' '.join(summary) if summary else None

def extract_text_from_pdf(file_path):
    text = ''
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + '\n'
    except Exception as e:
        print(f"❌ Error reading PDF: {e}")
    return clean_text(text)

def process_resume(file_path):
    text = extract_text_from_pdf(file_path)
    if not text or len(text) < 50:
        return {'error': 'Extracted text is too short or empty'}

    return {
        "name": extract_name(text),
        "email": extract_email(text),
        "phone": extract_phone(text),
        "role": "CANDIDATE",
        "isActive": True,
        "verificationStatus": {
            "status": "PENDING",
            "emailVerified": False
        },
        "profile": {
            "resume": extract_summary(text) or "",
            "skills": extract_skills(text),
            "phone": extract_phone(text),
            "languages": extract_languages(text),
            "availability": "Full-time",
            "experience": [{
                "title": exp.get('title', ''),
                "company": exp.get('company', ''),
                "duration": exp.get('duration', ''),
                "description": ' '.join(exp.get('description', []))
            } for exp in extract_experience(text)]
        },
        "education": extract_education(text)
    }

# Home route (for checking server)
@app.route('/', methods=['GET'])
def home():
    return "✅ Flask server running", 200

# Upload route
@app.route('/upload', methods=['POST'])
def upload_resume():
    if 'resume' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['resume']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are accepted'}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)

    try:
        extracted = process_resume(file_path)
        return jsonify(extracted)
    except Exception as e:
        print(f"❌ Resume processing error: {e}")
        return jsonify({'error': f'Processing error: {str(e)}'}), 500
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

# Start server
if __name__ == '__main__':
    app.run(debug=True, port=5002)
