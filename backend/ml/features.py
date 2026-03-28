import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
import os

def load_and_preprocess_data(data_path="d:/BVP/delivery-risk-scorer/backend/data/Delivery_Logistics.csv"):
    df = pd.read_csv(data_path)
    
    # KAGGE SCHEMA (Verified 13 cols)
    forced_cols = [
        'delivery_id', 'route_id', 'distance_km', 'num_turns', 'intersections',
        'road_type_encoded', 'time_of_day', 'traffic_density', 'weather_volatility',
        'past_delay_t_1', 'past_delay_t_7', 'actual_delay_min', 'is_delayed_30m'
    ]
    if len(df.columns) == 13:
        df.columns = forced_cols

    target_col = 'is_delayed_30m'
    df['delay_target'] = df[target_col].astype(int)
    
    # We treat 'road_type_encoded' as categorical to satisfy the OneHotEncoder pipeline
    categorical_features = ['road_type_encoded']
    numeric_features = [
        'distance_km', 'num_turns', 'intersections',
        'time_of_day', 'traffic_density', 'weather_volatility',
        'past_delay_t_1', 'past_delay_t_7'
    ]
    
    X = df[categorical_features + numeric_features].fillna(0)
    y = df['delay_target'].values
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features)
        ])
    
    return X, y, preprocessor, numeric_features, categorical_features
