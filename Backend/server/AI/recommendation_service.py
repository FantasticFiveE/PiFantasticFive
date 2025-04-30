from flask import Flask, request, jsonify
from job_recommender import JobRecommender
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)
recommender = JobRecommender()

@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.json
    candidate_id = data.get('candidate_id')
    top_k = data.get('top_k', 5)
    
    if not candidate_id:
        return jsonify({"error": "candidate_id is required"}), 400
    
    results = recommender.recommend_jobs(candidate_id, top_k)
    return jsonify(results)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)