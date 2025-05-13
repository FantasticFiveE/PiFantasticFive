from flask import Flask, request, jsonify
import pickle
import pandas as pd
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load the trained model
with open('interview_score_model.pkl', 'rb') as f:
    model = pickle.load(f)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json

    # Ensure the input data includes all required features
    df = pd.DataFrame([{
        'domain_x': data.get('domain_match', 0),
        'experience_years': data.get('experience_years', 0),
        'education': data.get('education_match', 0),  # Adjust if needed
        'location_x': data.get('location', 0),
        'exp_match': data.get('experience_match', 0),
        'skill_match': data.get('skill_match', 0),  # Added this field
        'education_match': data.get('education_match', 0)  # Added this field
    }])

    # Print the dataframe to verify it's correctly structured
    print(f"Input DataFrame: {df}")

    # Handle missing values more explicitly
    df.fillna(0, inplace=True)  # Replace NaN values with 0 (or another suitable value)

    # Ensure that all columns are of the correct type
    df['domain_x'] = df['domain_x'].astype(int)
    df['experience_years'] = df['experience_years'].astype(int)
    df['education'] = df['education'].astype(int)
    df['location_x'] = df['location_x'].astype(int)
    df['exp_match'] = df['exp_match'].astype(int)
    df['skill_match'] = df['skill_match'].astype(int)
    df['education_match'] = df['education_match'].astype(int)

    # Print the cleaned dataframe for debugging
    print(f"Cleaned DataFrame: {df}")

    # Check if there are any NaN values after processing
    if df.isna().sum().sum() > 0:
        return jsonify({'error': 'Data contains NaN values after processing'}), 400

    try:
        # Make prediction
        prediction = model.predict(df)

        # Ensure score is between 0 and 1
        score = max(0, min(1, float(prediction[0])))

        return jsonify({'interview_score': score})
    except Exception as e:
        # Return an error response if prediction fails
        print(f"Error during prediction: {str(e)}")
        return jsonify({'error': 'Prediction failed', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(port=7000)
