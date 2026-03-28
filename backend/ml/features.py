import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib
import os

def load_and_preprocess_data(data_path="d:/BVP/delivery-risk-scorer/backend/data/Delivery_Logistics.csv"):
    df = pd.read_csv(data_path)
    # Target variable
    df['delay_target'] = (df['delayed'] == 'yes').astype(int)
    
    # Feature 1: Route Complexity Proxy
    # we proxy complexity by distance combined with package weight and vehicle type
    df['route_complexity'] = df['distance_km'] * np.where(df['vehicle_type'] == 'bike', 1.2, 0.8)
    
    # Feature 2: Variability from weather
    # We assign higher volatility to worse weather conditions
    weather_map = {'clear': 0.1, 'rainy': 0.8, 'foggy': 0.7, 'stormy': 1.0, 'snow': 0.9, 'windy': 0.5}
    df['weather_volatility'] = df['weather_condition'].str.lower().map(weather_map).fillna(0.3)
    
    # Feature 3: Past Delays (proxy simulation as we lack timestamps ordered by agent)
    # We calculate the region's overall delay rate and add noise to simulate recent history
    region_delays = df.groupby('region')['delay_target'].transform('mean')
    df['past_delay_t_1'] = region_delays + np.random.normal(0, 0.05, size=len(df))
    df['past_delay_t_1'] = np.clip(df['past_delay_t_1'], 0, 1)
    
    # Selecting core features for model
    categorical_features = ['delivery_partner', 'vehicle_type', 'delivery_mode', 'region', 'weather_condition']
    numeric_features = ['distance_km', 'package_weight_kg', 'route_complexity', 'weather_volatility', 'past_delay_t_1', 'delivery_cost']
    
    X = df[categorical_features + numeric_features].fillna(0)
    y = df['delay_target'].values
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features)
        ])
    
    return X, y, preprocessor, numeric_features, categorical_features
