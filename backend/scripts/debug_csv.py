import pandas as pd
import sys

try:
    path = 'd:/BVP/delivery-risk-scorer/backend/data/Delivery_Logistics.csv'
    df = pd.read_csv(path)
    print("FILE PATH:", path)
    print("COLUMNS REPR:", repr(df.columns.tolist()))
    print("COLUMNS LIST:", df.columns.tolist())
    print("FIRST ROW:", df.iloc[0].to_dict())
    
    if 'vehicle_type' in df.columns:
        print("SUCCESS: 'vehicle_type' found!")
    else:
        print("FAILURE: 'vehicle_type' NOT found!")
        # Let's see if there are any approximate matches
        for c in df.columns:
            if 'vehicle' in c.lower():
                print(f"DEBUG: Found similar column: '{c}'")

except Exception as e:
    print("ERROR:", str(e))
