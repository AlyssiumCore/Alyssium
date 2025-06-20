import requests
from datetime import datetime
import json
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, roc_auc_score

def classify_token(risk_score):
    if risk_score > 0.9:
        return "Critical Risk"
    elif risk_score > 0.7:
        return "High Risk"
    elif risk_score > 0.4:
        return "Moderate Risk"
    else:
        return "Low Risk"

def log_event(event_type, metadata, level="INFO"):
    now = datetime.utcnow().isoformat()
    log_entry = {
        "timestamp": now,
        "level": level,
        "event": event_type,
        "meta": metadata
    }
    with open("logfile.json", "a") as f:
        f.write(json.dumps(log_entry) + "\n")

def summarize_metrics(metrics):
    if not metrics:
        return {"avg": 0, "max": 0, "min": 0, "median": 0, "std_dev": 0}
    metrics_np = np.array(metrics)
    return {
        "avg": np.mean(metrics_np),
        "max": np.max(metrics_np),
        "min": np.min(metrics_np),
        "median": np.median(metrics_np),
        "std_dev": np.std(metrics_np)
    }

def calculate_risk_score(price_change, liquidity, flags):
    base_score = abs(price_change) / max(liquidity, 1)
    penalty = 0
    penalty += 0.3 if 'suspicious' in flags else 0
    penalty += 0.2 if 'blacklisted' in flags else 0
    penalty += 0.15 if 'honeypot' in flags else 0
    final_score = base_score + penalty
    return round(min(final_score, 1.0), 3)

class WalletAnalyzer:
    def __init__(self, address):
        self.address = address
        self.transactions = []
        self.anomalies = []

    def load_transactions(self, tx_list):
        if not isinstance(tx_list, list):
            raise ValueError("Transactions must be a list")
        self.transactions = tx_list

    def detect_anomalies(self, threshold=10000):

        self.anomalies = [tx for tx in self.transactions if tx.get('value', 0) > threshold]
        return self.anomalies

    def total_volume(self):
        return sum(tx.get('value', 0) for tx in self.transactions)

    def average_transaction(self):
        if not self.transactions:
            return 0
        return self.total_volume() / len(self.transactions)

    def transactions_per_day(self):
        if not self.transactions:
            return 0
        dates = [datetime.fromisoformat(tx['timestamp']).date() for tx in self.transactions if 'timestamp' in tx]
        if not dates:
            return 0
        days_span = (max(dates) - min(dates)).days or 1
        return len(self.transactions) / days_span

def train_model(X, y):
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    model = LogisticRegression(max_iter=1000)
    model.fit(X_scaled, y)
    return model, scaler

def predict_risk(model, scaler, features):
    features_scaled = scaler.transform([features])
    prediction_proba = model.predict_proba(features_scaled)
    return prediction_proba[0][1]

def evaluate_model(model, scaler, X_test, y_test):
    X_test_scaled = scaler.transform(X_test)
    y_pred = model.predict(X_test_scaled)
    y_proba = model.predict_proba(X_test_scaled)[:,1]
    report = classification_report(y_test, y_pred, output_dict=True)
    auc = roc_auc_score(y_test, y_proba)
    return report, auc

def detect_outliers(data, factor=1.5, log=True):
    q1 = np.percentile(data, 25)
    q3 = np.percentile(data, 75)
    iqr = q3 - q1
    lower_bound = q1 - factor * iqr
    upper_bound = q3 + factor * iqr
    outliers = [x for x in data if x < lower_bound or x > upper_bound]
    if log:
        log_event("Outlier Detection", {"lower_bound": lower_bound, "upper_bound": upper_bound, "outliers_count": len(outliers)})
    return outliers

def fetch_api_data(url, headers=None, params=None, timeout=10):
    try:
        response = requests.get(url, headers=headers, params=params, timeout=timeout)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        log_event("API Request Failed", {"url": url, "error": str(e)}, level="ERROR")
        return None

def normalize_data(data):
    if not data:
        return []
    data_np = np.array(data)
    min_val = np.min(data_np)
    max_val = np.max(data_np)
    if min_val == max_val:
        return [0.5] * len(data)
    return ((data_np - min_val) / (max_val - min_val)).tolist()

def analyze_token(token_metrics):
    risk_scores = []
    for i in range(len(token_metrics.get("price_changes", []))):
        pc = token_metrics["price_changes"][i]
        liq = token_metrics["liquidity"][i] if i < len(token_metrics["liquidity"]) else 1
        flgs = token_metrics["flags"][i] if i < len(token_metrics["flags"]) else []
        score = calculate_risk_score(pc, liq, flgs)
        risk_scores.append(score)
    summary = summarize_metrics(risk_scores)
    classification = classify_token(summary["avg"])
    log_event("Token Analyzed", {"average_risk": summary["avg"], "classification": classification})
    return {
        "risk_scores": risk_scores,
        "summary": summary,
        "classification": classification
    }

