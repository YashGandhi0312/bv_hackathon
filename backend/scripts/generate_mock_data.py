import pandas as pd
import numpy as np
import os

def generate_logistics_data(num_samples=5000):
    np.random.seed(42)
    
    # Base features
    route_ids = np.random.randint(100, 500, size=num_samples)
    distance_km = np.random.uniform(5.0, 50.0, size=num_samples)
    
    # Route Complexity
    num_turns = np.random.poisson(lam=(distance_km * 0.5))
    intersections = np.random.poisson(lam=(distance_km * 1.2))
    # 0 = Highway, 1 = Suburban, 2 = Urban
    road_type_encoded = np.random.choice([0, 1, 2], size=num_samples, p=[0.2, 0.4, 0.4]) 
    
    # Environmental & Temporal
    time_of_day = np.random.randint(0, 24, size=num_samples)
    
    # Non-linear relationship for traffic density
    # Peak hours: 7-9 and 16-19
    is_peak = ((time_of_day >= 7) & (time_of_day <= 9)) | ((time_of_day >= 16) & (time_of_day <= 19))
    traffic_density = np.where(is_peak, np.random.uniform(0.7, 1.0, size=num_samples), np.random.uniform(0.1, 0.6, size=num_samples))
    
    # Weather
    weather_volatility = np.random.beta(2, 5, size=num_samples)
    
    # Past Delays (autoregressive elements)
    past_delay_t_1 = np.random.exponential(scale=15, size=num_samples)
    past_delay_t_7 = np.random.exponential(scale=12, size=num_samples)
    
    # Actual Delay target logic (hidden function for the ML to learn)
    # Base delay ~ proportional to distance and traffic
    base_delay = distance_km * 0.5 + (traffic_density * 40)
    
    # Penalize complexity
    complexity_penalty = (num_turns * 0.5) + (intersections * 0.2) + (road_type_encoded * 5)
    
    # Weather impact is non-linear (only bad weather causes huge delays)
    weather_penalty = np.where(weather_volatility > 0.6, weather_volatility * 30, 0)
    
    # Past delay correlation
    history_penalty = (past_delay_t_1 * 0.2) + (past_delay_t_7 * 0.3)
    
    # Total delay with some noise
    noise = np.random.normal(0, 5, size=num_samples)
    actual_delay_min = base_delay + complexity_penalty + weather_penalty + history_penalty + noise
    actual_delay_min = np.clip(actual_delay_min, 0, None)
    
    df = pd.DataFrame({
        'route_id': route_ids,
        'distance_km': distance_km,
        'num_turns': num_turns,
        'intersections': intersections,
        'road_type_encoded': road_type_encoded,
        'time_of_day': time_of_day,
        'traffic_density': traffic_density,
        'weather_volatility': weather_volatility,
        'past_delay_t_1': past_delay_t_1,
        'past_delay_t_7': past_delay_t_7,
        'actual_delay_min': actual_delay_min
    })
    
    # Binary target for LightGBM probabilities
    df['is_delayed_30m'] = (df['actual_delay_min'] > 30).astype(int)
    
    # Save dataset
    output_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(output_dir, '..', 'data', 'logistics_data.csv')
    os.makedirs(os.path.dirname(data_path), exist_ok=True)
    df.to_csv(data_path, index=False)
    print(f"Generated {num_samples} records and saved to {data_path}")

if __name__ == "__main__":
    generate_logistics_data()
