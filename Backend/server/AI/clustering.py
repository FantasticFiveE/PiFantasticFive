# clustering_api.py

import os
import pickle
from flask import Flask, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import pandas as pd
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

app = Flask(__name__)
CORS(app)

# Connexion MongoDB
def get_mongo_collection():
    try:
        client = MongoClient(os.getenv("MONGO_URI"))
        db = client[os.getenv("MONGO_DB_NAME", "users")]
        return db["users"]
    except Exception as e:
        print(f"❌ Erreur de connexion MongoDB : {e}")
        raise

# Charger le modèle pipeline
def load_model():
    try:
        with open("clustering_model.pkl", "rb") as f:
            return pickle.load(f)
    except Exception as e:
        print(f"❌ Erreur chargement modèle : {e}")
        raise

# Préparation des données utilisateurs
def prepare_candidate_data(users):
    data = []
    for user in users:
        try:
            applications = user.get("applications", [])
            profile = user.get("profile", {})
            experience = profile.get("experience", [])
            enterprise = user.get("enterprise", {})

            if applications:
                app_data = applications[0]
                data.append({
                    "user_id": str(user["_id"]),
                    "domain": app_data.get("domain", "unknown"),
                    "experience_years": len(experience),
                    "education": profile.get("education", "unknown"),
                    "desired_salary": int(app_data.get("salary", 0) or 0),
                    "location": enterprise.get("location", "unknown")
                })
        except Exception as e:
            print(f"⚠️ Erreur traitement utilisateur {user.get('_id', 'unknown')} : {e}")
    
    return pd.DataFrame(data) if data else pd.DataFrame()

# Statistiques des clusters
def calculate_cluster_stats(df):
    cluster_stats = []
    for cluster_num in sorted(df['cluster'].unique()):
        cluster_data = df[df['cluster'] == cluster_num]
        stats = {
            'cluster': int(cluster_num),
            'count': int(len(cluster_data)),
            'avg_salary': float(cluster_data['desired_salary'].mean()),
            'most_common_location': cluster_data['location'].mode()[0],
            'most_common_domain': cluster_data['domain'].mode()[0],
            'avg_experience': float(cluster_data['experience_years'].mean())
        }
        cluster_stats.append(stats)
    return cluster_stats

# Endpoint clustering
@app.route('/cluster', methods=['GET'])
def cluster_candidates():
    try:
        collection = get_mongo_collection()
        model = load_model()

        users = list(collection.find({"role": "CANDIDATE"}))
        if not users:
            return jsonify({"error": "No candidate users found", "candidates": [], "clusters": []}), 404

        df = prepare_candidate_data(users)
        if df.empty:
            return jsonify({"error": "No usable data for clustering", "candidates": [], "clusters": []}), 400

        # Prévision avec le modèle pipeline
        df['cluster'] = model.predict(df[['domain', 'experience_years', 'education', 'desired_salary', 'location']])

        response = {
            "candidates": df.to_dict(orient='records'),
            "clusters": calculate_cluster_stats(df),
            "message": f"✅ {len(df)} candidats classés en {len(df['cluster'].unique())} groupes"
        }

        return jsonify(response)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Clustering failed: {str(e)}", "candidates": [], "clusters": []}), 500

# Lancer le serveur
if __name__ == '__main__':
    port = int(os.getenv("PORT", 3001))
    app.run(host='0.0.0.0', port=port, debug=True)
