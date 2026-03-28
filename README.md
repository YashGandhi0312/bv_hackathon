# LogisPredict AI - Delivery Delay Risk Scorer

LogisPredict AI is a full-stack Machine Learning application developed for a hackathon. It predicts delivery delay risks in real-time using a hybrid model pipeline and provides actionable explainability for logistics operators.

## 🚀 Key Features
- **Hybrid AI Pipeline**: Combines LightGBM (90.54% Accurate) with PyTorch Neural Networks.
- **Uncertainty Quantification**: Uses Monte Carlo Dropout to provide a confidence margin (±%) for every prediction.
- **Online Learning**: Features a RiverML adaptive hook that allows the model to learn from new delivery data incrementally.
- **Explainable AI (XAI)**: Integrated SHAP engine provides a feature-by-feature breakdown of why a package is at risk.
- **Live Parcel Tracker**: Interactive React Dashboard with a Leaflet.js map showing real-time route progress across India.

## 🛠️ Tech Stack
- **Backend**: FastAPI (Python), MongoDB (Persistence), Scikit-Learn, LightGBM, PyTorch, RiverML, SHAP.
- **Frontend**: React (Vite), Tailwind CSS v4, Recharts, Lucide-React, React-Leaflet.

## 📂 Project Structure
- `backend/`: FastAPI server, ML training scripts, and model inference engine.
- `frontend/`: React Vite application and dashboard UI.
- `data/`: Historical logistics telemetry (Kaggle Dataset).

## 🚦 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB instance (Local or Atlas)

### 1. Setup Backend
```bash
cd backend
python -m venv venv
./venv/Scripts/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📊 Model Evaluation
Run the evaluation script to verify the 90.54% accuracy on the hold-out test set:
```bash
python scripts/evaluate_model.py
```

## 🏆 Hackathon Pitch
LogisPredict AI turns reactive logistics into a proactive powerhouse by predicting failures before they happen, allowing for smarter re-routing and better customer expectations.

---
*Created for the BVP Delivery Risk Hackathon.*
