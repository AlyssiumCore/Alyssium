import json
import time
import math
import requests
import logging
from datetime import datetime
import numpy as np
from sklearn.linear_model import LogisticRegression

class WalletAnalyzer:
    def __init__(self, address):
        self.address = address
        self.transactions = []

    def load_transactions(self, tx_list):
        self.transactions = tx_list

    def detect_anomalies(self, threshold=10000):
        return [tx for tx in self.transactions if tx.get('value', 0) > threshold]

    def total_volume(self):
        return sum(tx.get('value', 0) for tx in self.transactions)

    def average_transaction(self):
        if not self.transactions:
            return 0
        return self.total_volume() / len(self.transactions)

    def transactions_per_day(self):
        dates = [datetime.fromisoformat(tx['timestamp']).date() for tx in self.transactions if 'timestamp' in tx]
        if not dates:
            return 0
        days_span = (max(dates) - min(dates)).days or 1
        return len(self.transactions) / days_span

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

def classify_token(risk_score):
    if risk_score > 0.8:
        return "High Risk"
    elif risk_score > 0.5:
        return "Moderate Risk"
    else:
        return "Low Risk"

def fetch_token_data(api_url, timeout=10):
    try:
        response = requests.get(api_url, timeout=timeout)
        if response.status_code == 200:
            return response.json()
        else:
            logging.error("API error: %s", response.status_code)
            return None
    except Exception as e:
        logging.error("Exception during fetch: %s", e)
        return None

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

def train_model(X, y):
    model = LogisticRegression(max_iter=1000)
    model.fit(X, y)
    return model

def predict_risk(model, features):
    prediction = model.predict_proba([features])
    return prediction[0][1]

def detect_outliers(data, factor=1.5):
    q1 = np.percentile(data, 25)
    q3 = np.percentile(data, 75)
    iqr = q3 - q1
    lower = q1 - factor * iqr
    upper = q3 + factor * iqr
    return [x for x in data if x < lower or x > upper]

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
        liq = token_metrics["liquidity"][i] if i < len(token_metrics.get("liquidity", [])) else 1
        flgs = token_metrics["flags"][i] if i < len(token_metrics.get("flags", [])) else []
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
