from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uvicorn
from contextlib import asynccontextmanager

from ml.model import get_predictor

# MongoDB setup
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URI)
db = client.logistics_db
deliveries_col = db.deliveries

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize predictor on startup to load models
    get_predictor()
    yield
    client.close()

app = FastAPI(title="Delivery Risk Scorer API", lifespan=lifespan)

# Setup CORS for local React and any domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict")
async def predict_risk(request: Request):
    try:
        data = await request.json()
        predictor = get_predictor()
        if not predictor:
            raise HTTPException(status_code=500, detail="Predictor models not found. Did you run train.py?")
            
        result = predictor.predict(data)
        
        # Optionally log the prediction
        # await deliveries_col.insert_one({"type": "prediction", "inputs": data, "result": result})
        
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/delivery/{delivery_id}")
async def get_delivery(delivery_id: str):
    try:
        import pandas as pd
        df = pd.read_csv("d:/BVP/delivery-risk-scorer/backend/data/Delivery_Logistics.csv")
        # delivery_id in CSV might be float or int string, handle both
        res = df[df['delivery_id'].astype(str) == str(delivery_id)]
        
        if res.empty:
            raise HTTPException(status_code=404, detail="Delivery ID not found in historical record.")
            
        return res.iloc[0].to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/update")
async def update_model(request: Request):
    try:
        data = await request.json()
        predictor = get_predictor()
        if not predictor:
            raise HTTPException(status_code=500, detail="Predictor models not found.")
            
        actual_delayed = data.get('actual_delayed', False)
        inputs = data.get('inputs', {})
        
        # Log outcome
        await deliveries_col.insert_one({"type": "actual", "inputs": inputs, "actual_delayed": actual_delayed})
        
        # Online Learning update step
        predictor.update_online(inputs, actual_delayed)
        return {"status": "success", "message": "Model updated via RiverML and recorded to MongoDB."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
