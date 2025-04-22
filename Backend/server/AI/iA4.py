import os
import re
import spacy
import pdfplumber
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads/'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

nlp = spacy.load("en_core_web_sm")

def extract_name(text):
    # Look for the most prominent name (usually at the top)
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    if len(lines) > 0:
        # The name is likely the first line that's in title case
        for line in lines[:3]:  # Check first 3 lines
            if line.istitle() and not any(word.lower() in ['cv', 'resume'] for word in line.split()):
                return line
    return None

def extract_email(text):
    match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    return match.group(0) if match else None

def extract_phone(text):
    # Match international phone numbers with optional + prefix
    phone_matches = re.findall(r'(\+?[\d\s\-()]{7,}\d)', text)
    cleaned_numbers = [re.sub(r'[^\d+]', '', num) for num in phone_matches]
    return cleaned_numbers[0] if cleaned_numbers else None

def extract_education(text):
    education = []
    lines = text.split('\n')
    capture = False
    
    for i, line in enumerate(lines):
        if re.search(r'education|formation|academic background|études', line, re.IGNORECASE):
            capture = True
            continue
        
        if capture:
            # Stop at next major section
            if re.search(r'experience|work history|skills|certification|projects|languages', line, re.IGNORECASE):
                break
            
            # Match education entries (institution - degree - date)
            if line.strip() and not line.strip().startswith(('•', '-')):
                education.append(line.strip())
    
    return education

def extract_experience(text):
    experience = []
    lines = text.split('\n')
    current_exp = {}
    capture = False
    
    for i, line in enumerate(lines):
        if re.search(r'experience|work history|professional experience|emploi', line, re.IGNORECASE):
            capture = True
            continue
        
        if capture:
            # Stop at next major section
            if re.search(r'education|formation|skills|certification|projects|languages', line, re.IGNORECASE):
                break
            
            # Match experience entries (company - position - date)
            exp_match = re.search(r'^(.*?)\s*[-–]\s*(.*?)\s*[-–]\s*(.*)$', line)
            if exp_match:
                if current_exp:  # Save previous experience if exists
                    experience.append(current_exp)
                current_exp = {
                    'company': exp_match.group(1).strip(),
                    'title': exp_match.group(2).strip(),
                    'duration': exp_match.group(3).strip(),
                    'description': []
                }
            elif line.strip():
                # Add bullet points to description
                bullet_match = re.match(r'^[•\-]\s*(.*)', line.strip())
                if bullet_match:
                    current_exp['description'].append(bullet_match.group(1))
                elif current_exp and current_exp.get('description'):
                    # Continue previous bullet point if line starts with whitespace
                    if re.match(r'^\s+', line) and current_exp['description']:
                        current_exp['description'][-1] += ' ' + line.strip()
    
    if current_exp:
        experience.append(current_exp)
    
    return experience

def extract_skills(text):
    # Enhanced skill keywords including those from Mariem's resume
    skill_keywords = [
        "python", "java", "c", "c++", "html", "css", "javascript", "react", "nodejs", "sql",
        "mongodb", "git", "docker", "aws", "azure", "linux", "powerbi", "tableau",
        "figma", "agile", "scrum", "typescript", "angular", "django", "flask",
        "symfony", "spring", "php", "tensorflow", "keras", "scikit-learn", "matlab",
        "network infrastructure", "web development", "computer systems", "signal processing",
        "responsive design", "api integration", "cms", "pegi", "esrb", "usk", "react.js",
        "tailwind css", "ia recommendation system", "b2b website", "django framework",
        "tableplus", "cisco packet tracer", "nagios xi", "anaconda", "intellij", "eclipse",
        "oracle server", "ubuntu", "centos7"
    ]
    
    # Find skills section
    skills = set()
    lines = text.split('\n')
    in_skills_section = False
    
    for line in lines:
        if re.search(r'skills|technical skills|compétences|competencies|technologies', line, re.IGNORECASE):
            in_skills_section = True
            continue
        
        if in_skills_section:
            # Stop at next section
            if re.search(r'experience|education|projects|languages', line, re.IGNORECASE):
                break
            
            # Check for skills in this line
            line_lower = line.lower()
            for skill in skill_keywords:
                if re.search(rf'\b{re.escape(skill)}\b', line_lower):
                    skills.add(skill.capitalize())
    
    # If no skills section found, search entire text
    if not skills:
        text_lower = text.lower()
        for skill in skill_keywords:
            if re.search(rf'\b{re.escape(skill)}\b', text_lower):
                skills.add(skill.capitalize())
    
    return sorted(list(skills))

def extract_languages(text):
    language_map = {
        "english": "English",
        "french": "French",
        "spanish": "Spanish",
        "arabic": "Arabic",
        "german": "German",
        "italian": "Italian",
        "français": "French",
        "anglais": "English",
        "espagnol": "Spanish",
        "arabe": "Arabic"
    }
    
    languages = set()
    lines = text.split('\n')
    in_lang_section = False
    
    for line in lines:
        if re.search(r'languages|langues|language proficiency', line, re.IGNORECASE):
            in_lang_section = True
            continue
        
        if in_lang_section:
            # Stop at next section
            if re.search(r'experience|education|skills|projects', line, re.IGNORECASE):
                break
            
            # Check for languages in this line
            line_lower = line.lower()
            for lang_key, lang_value in language_map.items():
                if re.search(rf'\b{re.escape(lang_key)}\b', line_lower):
                    languages.add(lang_value)
    
    # If no languages section found, search entire text
    if not languages:
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
        if re.search(r'summary|about|profile|profil', line, re.IGNORECASE):
            capture = True
            continue
        
        if capture:
            # Stop at next section
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
        print("Error reading PDF:", e)
    return text.strip()

def process_resume(file_path):
    text = extract_text_from_pdf(file_path)
    
    if not text or len(text.strip()) < 50:
        return {'error': 'Extracted text is too short or empty'}
    
    # Extract all data points
    name = extract_name(text)
    email = extract_email(text)
    phone = extract_phone(text)
    summary = extract_summary(text)
    skills = extract_skills(text)
    languages = extract_languages(text)
    education = extract_education(text)
    experience = extract_experience(text)
    
    # Format the data to match your schema
    resume_data = {
        "name": name,
        "email": email,
        "phone": phone,
        "role": "CANDIDATE",  # Default role
        "isActive": True,     # Default active status
        "verificationStatus": {
            "status": "PENDING",
            "emailVerified": False
        },
        "profile": {
            "resume": summary or "",
            "skills": skills,
            "phone": phone,
            "languages": languages,
            "availability": "Full-time",  # Default value
            "experience": [{
                "title": exp.get('title', ''),
                "company": exp.get('company', ''),
                "duration": exp.get('duration', ''),
                "description": ' '.join(exp.get('description', []))
            } for exp in experience]
        },
        "education": education
    }
    
    return resume_data

@app.route('/upload', methods=['POST'])
def upload_file():
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
        return jsonify({'error': f'Processing error: {str(e)}'}), 500
    finally:
        # Clean up the uploaded file
        if os.path.exists(file_path):
            os.remove(file_path)

if __name__ == '__main__':
    app.run(debug=True, port=5002)