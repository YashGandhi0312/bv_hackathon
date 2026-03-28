import os
import joblib
import torch
import torch.nn as nn
import torch.optim as optim
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from ml.features import load_and_preprocess_data

class UncertaintyNet(nn.Module):
    def __init__(self, input_dim):
        super(UncertaintyNet, self).__init__()
        self.fc1 = nn.Linear(input_dim, 64)
        self.relu = nn.ReLU()
        self.drop = nn.Dropout(p=0.3)
        self.fc2 = nn.Linear(64, 1)
        self.sigmoid = nn.Sigmoid()
        
    def forward(self, x):
        x = self.relu(self.fc1(x))
        x = self.drop(x)
        x = self.sigmoid(self.fc2(x))
        return x

def train():
    print("Loading and preprocessing data...")
    X, y, preprocessor, num_cols, cat_cols = load_and_preprocess_data()
    
    # Fit preprocessor
    X_preprocessed = preprocessor.fit_transform(X)
    feature_names = num_cols + list(preprocessor.named_transformers_['cat'].get_feature_names_out(cat_cols))
    
    X_train, X_test, y_train, y_test = train_test_split(X_preprocessed, y, test_size=0.2, random_state=42)
    
    print("Training LightGBM base model...")
    lgb_train = lgb.Dataset(X_train, y_train)
    lgb_eval = lgb.Dataset(X_test, y_test, reference=lgb_train)
    
    params = {
        'objective': 'binary',
        'metric': 'binary_logloss',
        'boosting_type': 'gbdt',
        'learning_rate': 0.05,
        'num_leaves': 31,
        'verbose': -1
    }
    
    gbm = lgb.train(params, lgb_train, num_boost_round=100, valid_sets=[lgb_eval])
    
    print("Training PyTorch Uncertainty Network...")
    input_dim = X_train.shape[1]
    net = UncertaintyNet(input_dim)
    criterion = nn.BCELoss()
    optimizer = optim.Adam(net.parameters(), lr=0.01)
    
    X_train_tensor = torch.FloatTensor(X_train)
    y_train_tensor = torch.FloatTensor(y_train).unsqueeze(1)
    
    for epoch in range(50):
        optimizer.zero_grad()
        outputs = net(X_train_tensor)
        loss = criterion(outputs, y_train_tensor)
        loss.backward()
        optimizer.step()
        
    print("Saving models...")
    os.makedirs('models', exist_ok=True)
    joblib.dump(preprocessor, 'models/preprocessor.pkl')
    gbm.save_model('models/lgb_model.txt')
    torch.save(net.state_dict(), 'models/uncertainty_net.pth')
    joblib.dump(feature_names, 'models/feature_names.pkl')
    
    print("Training complete!")

if __name__ == "__main__":
    train()
