import pandas as pd
from sklearn.model_selection import train_test_split
import os

def export_test_ids():
    data_path = "d:/BVP/delivery-risk-scorer/backend/data/Delivery_Logistics.csv"
    if not os.path.exists(data_path):
        print(f"Error: Dataset not found at {data_path}")
        return

    df = pd.read_csv(data_path)
    # We use the same random_state as our training script (42)
    _, test_df = train_test_split(df, test_size=0.2, random_state=42)
    
    test_ids = test_df['delivery_id'].astype(str).tolist()
    
    output_path = "d:/BVP/delivery-risk-scorer/TEST_SET_IDS.txt"
    with open(output_path, "w") as f:
        f.write("\n".join(test_ids[:100])) # Give first 100 for easy copy-pasting
        
    print(f"Successfully exported {len(test_ids)} test IDs to {output_path}")
    print("Top 10 IDs to try:")
    print(test_ids[:10])

if __name__ == "__main__":
    export_test_ids()
