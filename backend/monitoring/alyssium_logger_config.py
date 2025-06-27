import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import numpy as np
import requests
from sklearn.linear_model import LogisticRegression


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)


def log_event(event_type: str, metadata: Dict[str, Any], logfile: str = "logfile.json") -> None:
    """
    Append a JSON-formatted event log entry to the logfile.
    """
    entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "event": event_type,
        "meta": metadata,
    }
    with open(logfile, "a") as f:
        f.write(json.dumps(entry) + "\n")


def calculate_risk_score(
    price_change: float,
    liquidity: float,
    flags: List[str]
) -> float:
    """
    Compute a normalized risk score in [0.0, 1.0].
    Adds 0.3 if 'suspicious' flag is present.
    """
    base = abs(price_change) / max(liquidity, 1.0)
    if "suspicious" in flags:
        base += 0.3
    return round(min(base, 1.0), 2)


def fetch_token_data(api_url: str, timeout: int = 5) -> Optional[Dict[str, Any]]:
    """
    Fetch and return JSON data from api_url, or None on failure.
    """
    try:
        resp = requests.get(api_url, timeout=timeout)
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as e:
        logging.error("API fetch error: %s", e)
        return None


def summarize_metrics(metrics: List[float]) -> Dict[str, float]:
    """
    Return average, max, and min of a list of metrics.
    """
    if not metrics:
        return {"avg": 0.0, "max": 0.0, "min": 0.0}
    return {
        "avg": sum(metrics) / len(metrics),
        "max": max(metrics),
        "min": min(metrics),
    }


class WalletAnalyzer:
    """
    Analyze wallet transactions for high-value anomalies.
    """

    def __init__(self, address: str):
        self.address = address
        self.transactions: List[Dict[str, Any]] = []

    def load_transactions(self, tx_list: List[Dict[str, Any]]) -> None:
        """Load transaction data into the analyzer."""
        self.transactions = tx_list

    def detect_anomalies(self, threshold: float = 10_000) -> List[Dict[str, Any]]:
        """
        Return transactions exceeding the threshold value.
        """
        return [tx for tx in self.transactions if tx.get("value", 0) > threshold]


def train_model(
    X: List[List[float]],
    y: List[int]
) -> LogisticRegression:
    """
    Train and return a logistic regression model.
    """
    model = LogisticRegression()
    model.fit(X, y)
    logging.info("Trained LogisticRegression model")
    return model


def predict_risk(model: LogisticRegression, features: List[float]) -> float:
    """
    Predict the probability of risk (class 1) for given features.
    """
    proba = model.predict_proba([features])
    return float(proba[0][1])


def detect_outliers(data: List[float]) -> List[float]:
    """
    Identify outliers using the IQR method.
    Returns values outside [Q1 - 1.5*IQR, Q3 + 1.5*IQR].
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
    # Log a startup event
    log_event("startup", {"message": "Analyzer started"})

    # Fetch sample token data
    data = fetch_token_data("https://api.example.com/token")
    if data:
        score = calculate_risk_score(
            price_change=data.get("price_change", 0.0),
            liquidity=data.get("liquidity", 1.0),
            flags=data.get("flags", [])
        )
        classification = "high" if score > 0.8 else "low"
        log_event("token_scored", {"score": score, "classification": classification})

    # Analyze wallet transactions
    analyzer = WalletAnalyzer("ExampleAddress")
    sample_txs = [{"value": 15000}, {"value": 500}, {"value": 20000}]
    analyzer.load_transactions(sample_txs)
    anomalies = analyzer.detect_anomalies()
    logging.info("Found %d anomalies", len(anomalies))
    log_event("anomalies_detected", {"count": len(anomalies)})
