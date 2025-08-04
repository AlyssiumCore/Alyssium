import logging
import requests
import time
import json
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field

import numpy as np
from sklearn.linear_model import LogisticRegression

# Configure module logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
handler.setFormatter(formatter)
logger.addHandler(handler)


@dataclass
class TransactionRecord:
    tx_id: str
    value: float
    timestamp: int
    meta: Dict[str, Any] = field(default_factory=dict)


def calculate_risk_score(
    price_change: float,
    liquidity: float,
    flags: Optional[List[str]] = None
) -> float:
    """
    Compute a normalized risk score in [0.0, 1.0] reflecting price change vs liquidity,
    with optional flag adjustments.
    """
    flags = flags or []
    base = abs(price_change) / max(liquidity, 1.0)
    if "suspicious" in flags:
        base += 0.3
    score = min(base, 1.0)
    return round(score, 3)


class WalletAnalyzer:
    """
    Analyze wallet transactions for value-based anomalies.
    """

    def __init__(self, address: str, threshold: float = 10_000):
        self.address = address
        self.threshold = threshold
        self.transactions: List[TransactionRecord] = []

    def load_transactions(self, tx_list: List[Dict[str, Any]]) -> None:
        """Load raw transaction dicts into TransactionRecord objects."""
        self.transactions = [
            TransactionRecord(
                tx_id=tx.get("tx_id", ""),
                value=float(tx.get("value", 0)),
                timestamp=int(tx.get("timestamp", time.time())),
                meta={k: v for k, v in tx.items() if k not in ("tx_id", "value", "timestamp")}
            )
            for tx in tx_list
        ]
        logger.debug(f"Loaded {len(self.transactions)} transactions for {self.address}")

    def detect_anomalies(self) -> List[TransactionRecord]:
        """Return transactions whose 'value' exceeds the configured threshold."""
        anomalies = [tx for tx in self.transactions if tx.value > self.threshold]
        logger.info(f"Detected {len(anomalies)} anomalies (threshold={self.threshold})")
        return anomalies


def classify_token(risk_score: float) -> str:
    """
    Classify a token by risk score.
    """
    if risk_score >= 0.8:
        return "High Risk"
    if risk_score >= 0.5:
        return "Moderate Risk"
    return "Low Risk"


def fetch_token_data(
    api_url: str,
    timeout: int = 5,
    max_retries: int = 3,
    backoff_factor: float = 0.5
) -> Optional[Dict[str, Any]]:
    """
    Fetch JSON from API with simple retry/backoff.
    """
    for attempt in range(1, max_retries + 1):
        try:
            resp = requests.get(api_url, timeout=timeout)
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as e:
            logger.warning(f"Fetch attempt {attempt}/{max_retries} failed: {e}")
            if attempt == max_retries:
                logger.error("Max retries reached; giving up")
                return None
            time.sleep(backoff_factor * (2 ** (attempt - 1)))
    return None


def summarize_metrics(metrics: List[float]) -> Dict[str, float]:
    """
    Return summary stats: average, max, min.
    """
    if not metrics:
        return {"avg": 0.0, "max": 0.0, "min": 0.0}
    arr = np.array(metrics, dtype=float)
    return {
        "avg": float(arr.mean()),
        "max": float(arr.max()),
        "min": float(arr.min()),
    }


def train_model(
    X: List[List[float]],
    y: List[int],
    solver: str = "lbfgs",
    random_state: int = 42
) -> LogisticRegression:
    """
    Train and return a LogisticRegression model.
    """
    model = LogisticRegression(solver=solver, random_state=random_state)
    model.fit(X, y)
    logger.info("Model training complete")
    return model


def predict_risk(model: LogisticRegression, features: List[float]) -> float:
    """
    Predict probability of class 1 (risky).
    """
    try:
        proba = model.predict_proba([features])[0][1]
        return float(round(proba, 3))
    except AttributeError:
        logger.error("Model does not support probability prediction")
        return 0.0


def detect_outliers(data: List[float]) -> List[float]:
    """
    Return values outside 1.5 * IQR bounds.
    """
    if not data:
        return []
    arr = np.array(data, dtype=float)
    q1, q3 = np.percentile(arr, [25, 75])
    iqr = q3 - q1
    lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    out = arr[(arr < lower) | (arr > upper)]
    return out.tolist()


def main():
    # Load transactions
    try:
        with open("transactions.json", "r") as f:
            raw = json.load(f)
    except Exception as e:
        logger.error("Failed to load transactions.json: %s", e)
        return

    analyzer = WalletAnalyzer(address="ExampleWallet", threshold=5_000)
    analyzer.load_transactions(raw)
    anomalies = analyzer.detect_anomalies()

    # Example risk scores
    metrics = [calculate_risk_score(delta, 1_000, []) for delta in [5, -2, 0.5, 12]]
    summary = summarize_metrics(metrics)
    logger.info("Metrics summary: %s", summary)

    # Placeholder for training & prediction demo
    # model = train_model([[m] for m in metrics], [0,0,0,1])
    # print(predict_risk(model, [0.9]))


if __name__ == "__main__":
    main()
