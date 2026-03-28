import pandas as pd

path = 'd:/BVP/delivery-risk-scorer/backend/data/Delivery_Logistics.csv'
df = pd.read_csv(path)

print("--- RAW COLUMNS ---")
for i, col in enumerate(df.columns):
    print(f"Col {i}: {repr(col)} -> {[ord(c) for c in col]}")

print("\n--- CLEANING ATTEMPT ---")
df.columns = [c.strip().replace('\ufeff', '') for c in df.columns]
for i, col in enumerate(df.columns):
    print(f"Cleaned Col {i}: {repr(col)}")

if 'vehicle_type' in df.columns:
    print("\nSUCCESS: 'vehicle_type' is now accessible!")
else:
    print("\nSTILL FAILING")
