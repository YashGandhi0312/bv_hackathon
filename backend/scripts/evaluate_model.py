import joblib
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, roc_auc_score, f1_score
import sys
import os

# Add parent directory to path to allow importing ml.features
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(base_dir)

from ml.features import load_and_preprocess_data

def evaluate():
    print("Loading Kaggle Dataset and Splitting (Seed 42)...")
    X, y, preprocessor, num_cols, cat_cols = load_and_preprocess_data()
    X_preprocessed = preprocessor.fit_transform(X)
    
    # Same exact split used during training
    X_train, X_test, y_train, y_test = train_test_split(X_preprocessed, y, test_size=0.2, random_state=42)
    
    print("Loading Trained LightGBM Model...")
    models_dir = os.path.join(base_dir, 'models')
    lgb_model = lgb.Booster(model_file=os.path.join(models_dir, 'lgb_model.txt'))
    
    print("\n--- Running Inference on Hold-out Test Set ---")
    y_pred_probs = lgb_model.predict(X_test)
    y_pred = (y_pred_probs > 0.5).astype(int)
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    
    try:
        roc_auc = roc_auc_score(y_test, y_pred_probs)
    except ValueError:
        roc_auc = "N/A (Only one class present in test set)"
        
    print(f"\n✅ Total Test Samples: {len(y_test)}")
    print(f"✅ Accuracy:  {acc * 100:.2f}%")
    print(f"✅ Precision: {prec * 100:.2f}%")
    print(f"✅ Recall:    {rec * 100:.2f}%")
    print(f"✅ F1 Score:  {f1 * 100:.2f}%")
    print(f"✅ ROC AUC:   {roc_auc if isinstance(roc_auc, str) else f'{roc_auc:.4f}'}")
  
    

if __name__ == "__main__":
    evaluate()
