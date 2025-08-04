import logging
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import requests
from requests.adapters import HTTPAdapter, Retry
from sklearn.linear_model import LogisticRegression
from dataclasses import dataclass, field

# Configure module logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
logger.addHandler(handler)

# Prepare a requests Session with retries
session = requests.Session()
retries = Retry(total=3, backoff_factor=0.5, status_forcelist=[500, 502, 503, 504])
session.mount("http://", HTTPAdapter(max_retries=retries))
session.mount("https://", HTTPAdapter(max_retries=retries))

def fetch_token_data(api_url: str, timeout: int = 5) -> Optional[Dict[str, Any]]:
    """
    Fetch JSON from the given API URL with retry logic.
    """
    try:
        resp = session.get(api_url, timeout=timeout)
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as e:
        logger.error("API fetch error: %s", e)
        return None

def log_event(event_type: str, metadata: Dict[str, Any], logfile: Path = Path("logfile.json")) -> None:
    """
    Append a structured log entry to a JSONL logfile.
    """
    entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "event": event_type,
        "meta": metadata
    }
    try:
        logfile.parent.mkdir(parents=True, exist_ok=True)
        with logfile.open("a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
    except Exception as e:
        logger.error("Failed to write log event: %s", e)

@dataclass
class Transaction:
    tx_id: str
    value: float
    timestamp: int
    extra: Dict[str, Any] = field(default_factory=dict)

class WalletAnalyzer:
    """
    Analyze wallet transactions for anomalies.
    """
    def __init__(self, address: str, threshold: float = 10_000):
        self.address = address
        self.threshold = threshold
        self.transactions: List[Transaction] = []

    def load_transactions(self, tx_list: List[Dict[str, Any]]) -> None:
        self.transactions = [
            Transaction(
                tx_id=str(tx.get("tx_id", "")),
                value=float(tx.get("value", 0)),
                timestamp=int(tx.get("timestamp", datetime.utcnow().timestamp())),
                extra={k: v for k, v in tx.items() if k not in ("tx_id", "value", "timestamp")}
            )
            for tx in tx_list
        ]
        logger.debug(f"Loaded {len(self.transactions)} transactions for {self.address}")

    def detect_anomalies(self) -> List[Transaction]:
        anomalies = [tx for tx in self.transactions if tx.value > self.threshold]
        logger.info("Detected %d anomalies (threshold=%s)", len(anomalies), self.threshold)
        return anomalies

def classify_token(risk_score: float) -> str:
    """
    Classify token risk based on score.
    """
    if risk_score >= 0.8:
        return "High Risk"
    if risk_score >= 0.5:
        return "Moderate Risk"
    return "Low Risk"

def summarize_metrics(metrics: List[float]) -> Dict[str, float]:
    """
    Return avg, max, min of a list.
    """
    if not metrics:
        return {"avg": 0.0, "max": 0.0, "min": 0.0}
    arr = np.array(metrics, dtype=float)
    return {"avg": float(arr.mean()), "max": float(arr.max()), "min": float(arr.min())}

def train_model(X: List[List[float]], y: List[int]) -> LogisticRegression:
    """
    Train logistic regression and log completion.
    """
    model = LogisticRegression(max_iter=1000)
    model.fit(X, y)
    logger.info("Model training complete")
    return model

def predict_risk(model: LogisticRegression, features: List[float]) -> float:
    """
    Predict probability of class=1 (higher risk).
    """
    try:
        proba = model.predict_proba([features])[0][1]
        return float(round(proba, 3))
    except Exception as e:
        logger.error("Prediction error: %s", e)
        return 0.0

def detect_outliers(data: List[float]) -> List[float]:
    """
    Identify values outside the 1.5*IQR range.
    """
    if not data:
        return []
    arr = np.array(data, dtype=float)
    q1, q3 = np.percentile(arr, [25, 75])
    iqr = q3 - q1
    lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    return arr[(arr < lower) | (arr > upper)].tolist()
