import os
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
import numpy as np
from faiss import IndexFlatIP
import time
from bson import ObjectId
from typing import List, Dict, Any, Optional, Union

# Initialize MongoDB connection
client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("MONGO_DB_NAME", "users")]

# Load the embedding model
model = SentenceTransformer('all-MiniLM-L6-v2')

class JobRecommender:
    def __init__(self):
        self.job_index: Optional[IndexFlatIP] = None
        self.job_ids: List[ObjectId] = []
        self.last_update: float = 0
        
    def _prepare_job_text(self, job: Dict[str, Any]) -> str:
        """Enhanced job text preparation with null checks"""
        components = [
            job.get('title', ''),
            job.get('description', ''),
            f"Skills: {', '.join(job.get('skills', []))}" if job.get('skills') else "",
            f"Languages: {', '.join(job.get('languages', []))}" if job.get('languages') else "",
            f"Location: {job.get('location', '')}" if job.get('location') else "",
            f"Salary: {job.get('salary', '')}" if job.get('salary') else ""
        ]
        return '. '.join(filter(None, components))
    
    def _prepare_candidate_text(self, candidate: Dict[str, Any]) -> str:
        """Enhanced candidate text preparation with null checks"""
        profile = candidate.get('profile', {})
        
        # Experience section
        experiences = []
        for exp in profile.get('experience', []):
            exp_text = [
                exp.get('title', 'Position'),
                f"at {exp.get('company', 'Company')}" if exp.get('company') else "",
                f"({exp.get('duration', '')})" if exp.get('duration') else "",
                f": {exp.get('description', '')}" if exp.get('description') else ""
            ]
            experiences.append(' '.join(filter(None, exp_text)))
        
        # Fixed newline issue in f-string
        exp_section = "Experience:\n" + "\n".join(experiences) if experiences else ""
        
        components = [
            f"Resume Summary: {profile.get('resume', '')}" if profile.get('resume') else "",
            f"Skills: {', '.join(profile.get('skills', []))}" if profile.get('skills') else "",
            f"Languages: {', '.join(profile.get('languages', []))}" if profile.get('languages') else "",
            f"Availability: {profile.get('availability', '')}" if profile.get('availability') else "",
            exp_section
        ]
        
        return '\n'.join(filter(None, components))
    
    def update_job_index(self, force: bool = False) -> None:
        """Update the job index with all available jobs"""
        if not force and time.time() - self.last_update < 3600:  # 1 hour cache
            return
        
        try:
            jobs = list(db.jobs.find())
            print(f"\n[DEBUG] Found {len(jobs)} jobs in database")
            
            if not jobs:
                print("[WARNING] No jobs found in database")
                return
            
            job_texts = []
            self.job_ids = []
            
            for i, job in enumerate(jobs, 1):
                job_text = self._prepare_job_text(job)
                print(f"\n[DEBUG] Job {i}/{len(jobs)}:")
                print(f"ID: {job['_id']}")
                print(f"Title: {job.get('title', 'N/A')}")
                print(f"Text: {job_text[:200]}...")  # Print first 200 chars
                
                if job_text.strip():
                    job_texts.append(job_text)
                    self.job_ids.append(job["_id"])
                else:
                    print("[WARNING] Skipped empty job text")
            
            if not job_texts:
                print("[ERROR] No valid jobs found to index")
                return
            
            # Generate embeddings and normalize
            print("\n[DEBUG] Generating embeddings...")
            embeddings = model.encode(job_texts, convert_to_tensor=False)
            norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
            embeddings = embeddings / np.clip(norms, 1e-8, None)
            
            # Create or update FAISS index
            dimension = embeddings.shape[1]
            self.job_index = IndexFlatIP(dimension)
            self.job_index.add(embeddings.astype('float32'))
            
            self.last_update = time.time()
            print(f"[SUCCESS] Indexed {len(self.job_ids)} jobs")
            
        except Exception as e:
            print(f"[ERROR] Updating job index: {str(e)}")
            self.job_index = None
            self.job_ids = []
    
    def recommend_jobs(
        self,
        candidate_id: str,
        top_k: int = 5,
        threshold: float = 0.3  # Lowered default threshold
    ) -> Dict[str, Union[str, List[Dict[str, Any]]]]:
        """Get job recommendations for a candidate"""
        print("\n==== STARTING RECOMMENDATION ====")
        self.update_job_index()
        
        try:
            candidate_obj_id = ObjectId(candidate_id)
        except Exception:
            print("[ERROR] Invalid candidate ID format")
            return {"error": "Invalid candidate ID format"}
        
        try:
            candidate = db.users.find_one(
                {"_id": candidate_obj_id, "role": "CANDIDATE"},
                {"profile": 1, "applications": 1, "name": 1}
            )
        except Exception as e:
            print(f"[ERROR] Database lookup failed: {str(e)}")
            return {"error": f"Database error: {str(e)}"}
        
        if not candidate:
            print("[ERROR] Candidate not found or not a candidate role")
            return {"error": "Candidate not found or not a candidate role"}
        
        print(f"\n[DEBUG] Candidate: {candidate.get('name', 'Unknown')} ({candidate_id})")
        
        # Get applied job IDs
        applied_job_ids = []
        for app in candidate.get('applications', []):
            try:
                applied_job_ids.append(ObjectId(app.get('jobId')))
            except:
                continue
        
        print(f"[DEBUG] Applied to {len(applied_job_ids)} jobs")
        
        # Prepare candidate embedding
        try:
            candidate_text = self._prepare_candidate_text(candidate)
            print("\n[DEBUG] Candidate Profile Text:")
            print(candidate_text)
            
            candidate_embedding = model.encode(candidate_text, convert_to_tensor=False)
            candidate_embedding = candidate_embedding / np.linalg.norm(candidate_embedding)
            
            print(f"\n[DEBUG] Embedding shape: {candidate_embedding.shape}")
            print(f"Sample embedding values: {candidate_embedding[:5]}...")
        except Exception as e:
            print(f"[ERROR] Processing candidate profile: {str(e)}")
            return {"error": f"Error processing candidate profile: {str(e)}"}
        
        if not self.job_index or len(self.job_ids) == 0:
            print("[ERROR] No jobs available in the index")
            return {"error": "No jobs available in the index"}
        
        try:
            # Search for similar jobs
            search_k = min(top_k * 3, len(self.job_ids))
            print(f"\n[DEBUG] Searching top {search_k} jobs from {len(self.job_ids)} available")
            
            scores, indices = self.job_index.search(
                candidate_embedding.reshape(1, -1).astype('float32'),
                search_k
            )
            
            print(f"[DEBUG] Raw scores: {scores}")
            print(f"[DEBUG] Raw indices: {indices}")
            
            recommendations = []
            for idx, score in zip(indices[0], scores[0]):
                if idx >= len(self.job_ids):
                    print(f"[WARNING] Invalid index {idx} >= {len(self.job_ids)}")
                    continue
                    
                if score < threshold:
                    print(f"[DEBUG] Score {score:.3f} below threshold {threshold} for job {idx}")
                    continue
                    
                job_id = self.job_ids[idx]
                
                # Skip already applied jobs
                if job_id in applied_job_ids:
                    print(f"[DEBUG] Skipping already applied job {job_id}")
                    continue
                    
                try:
                    job = db.jobs.find_one(
                        {"_id": job_id},
                        {
                            "title": 1,
                            "description": 1,
                            "skills": 1,
                            "languages": 1,
                            "location": 1,
                            "salary": 1,
                            "entrepriseId": 1,
                            "createdAt": 1
                        }
                    )
                    
                    if job:
                        job["_id"] = str(job["_id"])
                        if "entrepriseId" in job:
                            job["entrepriseId"] = str(job["entrepriseId"])
                        job["match_score"] = float(score)
                        recommendations.append(job)
                        
                        print(f"[MATCH] Job {job['title']} (ID: {job['_id']}) - Score: {score:.3f}")
                        
                        if len(recommendations) >= top_k:
                            break
                except Exception as e:
                    print(f"[ERROR] Processing job {job_id}: {str(e)}")
                    continue
            
            recommendations.sort(key=lambda x: x["match_score"], reverse=True)
            
            if recommendations:
                print(f"\n[SUCCESS] Returning {len(recommendations)} recommendations")
                return {"recommendations": recommendations}
            else:
                print("\n[WARNING] No matching jobs found")
                return {
                    "message": "No matching jobs found",
                    "debug_info": {
                        "threshold_used": threshold,
                        "top_scores": [float(s) for s in scores[0][:5]],
                        "candidate_skills": candidate.get('profile', {}).get('skills', []),
                        "total_jobs_considered": len(self.job_ids)
                    }
                }
            
        except Exception as e:
            print(f"[ERROR] During recommendation search: {str(e)}")
            return {"error": f"Error during recommendation search: {str(e)}"}

if __name__ == "__main__":
    recommender = JobRecommender()
    print("Job recommender initialized with debug mode")