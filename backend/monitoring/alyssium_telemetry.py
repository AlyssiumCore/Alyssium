import logging
import requests
import time
import json
from datetime import datetime
from typing import Any, Dict, List, Optional

import numpy as np
from sklearn.linear_model import LogisticRegression


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)


def calculate_risk_score(
    price_change: float,
    liquidity: float,
    flags: List[str]
) -> float:
    """
    Compute a normalized risk score based on price change, liquidity, and flags.
    Returns a value in [0.0, 1.0].
    """
    base_score = abs(price_change) / max(liquidity, 1.0)
    if "suspicious" in flags:
        base_score += 0.3
    return round(min(base_score, 1.0), 2)


class WalletAnalyzer:
    """
    Analyze wallet transactions for anomalies.
    """

    def __init__(self, address: str):
        self.address = address
        self.transactions: List[Dict[str, Any]] = []

    def load_transactions(self, tx_list: List[Dict[str, Any]]) -> None:
        """Load a list of transaction dicts into the analyzer."""
        self.transactions = tx_list

    def detect_anomalies(self, threshold: float = 10_000) -> List[Dict[str, Any]]:
        """
        Return transactions whose 'value' exceeds the threshold.
        """
        return [tx for tx in self.transactions if tx.get("value", 0) > threshold]


def classify_token(risk_score: float) -> str:
    """
    Classify a token into risk categories based on its risk score.
    """
    if risk_score > 0.8:
        return "High Risk"
    if risk_score > 0.5:
        return "Moderate Risk"
    return "Low Risk"


def fetch_token_data(api_url: str, timeout: int = 5) -> Optional[Dict[str, Any]]:
    """
    Fetch JSON data from the given API URL.
    Returns parsed JSON or None on error.
    """
    try:
        response = requests.get(api_url, timeout=timeout)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        logging.error("API fetch error: %s", e)
        return None


def summarize_metrics(metrics: List[float]) -> Dict[str, float]:
    """
    Summarize a list of numeric metrics into average, max, and min.
    """
    if not metrics:
        return {"avg": 0.0, "max": 0.0, "min": 0.0}

    return {
        "avg": float(sum(metrics) / len(metrics)),
        "max": float(max(metrics)),
        "min": float(min(metrics)),
    }


def train_model(X: List[List[float]], y: List[int]) -> LogisticRegression:
    """
    Train and return a logistic regression model.
    """
    model = LogisticRegression()
    model.fit(X, y)
    logging.info("Model training complete")
    return model


def predict_risk(model: LogisticRegression, features: List[float]) -> float:
    """
    Predict risk probability (class 1) for the given feature vector.
    """
    proba = model.predict_proba([features])
    return float(proba[0][1])


def detect_outliers(data: List[float]) -> List[float]:
    """
    Identify outliers in data using the IQR method.
    Returns the values outside [Q1 - 1.5*IQR, Q3 + 1.5*IQR].
    """
    if not data:
        return []

    arr = np.array(data)
    q1, q3 = np.percentile(arr, [25, 75])
    iqr = q3 - q1
    lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    return [float(x) for x in arr[(arr < lower) | (arr > upper)]]


# Example usage
if __name__ == "__main__":
    # Load transactions from a JSON file
    try:
        with open("transactions.json") as f:
            txs = json.load(f)
    except (IOError, json.JSONDecodeError):
        logging.error("Failed to load transactions.json")
        txs = []

    analyzer = WalletAnalyzer(address="ExampleWalletAddress")
    analyzer.load_transactions(txs)
    anomalies = analyzer.detect_anomalies()
    logging.info("Detected %d anomalous transactions", len(anomalies))

    # Sample metrics summary
    sample_metrics = [calculate_risk_score(Δ, 1_000, []) for Δ in [5, -2, 0.5, 12]]
    logging.info("Metrics summary: %s", summarize_metrics(sample_metrics))
