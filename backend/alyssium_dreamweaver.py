import os
import json
import logging
import functools
from dataclasses import dataclass, field
from datetime import datetime, date
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import requests
from requests.adapters import HTTPAdapter, Retry
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.preprocessing import StandardScaler

# ─── Configuration ──────────────────────────────────────────────────────────────
LOG_FILE = os.getenv("CLEOGARDA_LOGFILE", "logfile.json")
API_TIMEOUT = float(os.getenv("API_TIMEOUT", "10"))
API_RETRIES = int(os.getenv("API_RETRIES", "3"))

# ─── Logger setup ────────────────────────────────────────────────────────────────
logger = logging.getLogger("cleogarda")
logger.setLevel(logging.INFO)
handler = logging.FileHandler(LOG_FILE)
formatter = logging.Formatter(
    '{"timestamp":"%(asctime)s","level":"%(levelname)s","event":"%(message)s"}'
)
handler.setFormatter(formatter)
logger.addHandler(handler)


def log_event(event: str, meta: Optional[Dict[str, Any]] = None, level: str = "INFO") -> None:
    """Emit a structured log entry."""
    entry = {"event": event, "meta": meta or {}}
    if level.upper() == "ERROR":
        logger.error(json.dumps(entry))
    else:
        logger.info(json.dumps(entry))


# ─── Utility Functions ───────────────────────────────────────────────────────────

def classify_token(risk_score: float) -> str:
    """Label a token by its average risk score."""
    if risk_score > 0.9:
        return "Critical Risk"
    if risk_score > 0.7:
        return "High Risk"
    if risk_score > 0.4:
        return "Moderate Risk"
    return "Low Risk"


def summarize_metrics(metrics: List[float]) -> Dict[str, float]:
    """Compute summary statistics over a list of scores."""
    if not metrics:
        return dict(avg=0, max=0, min=0, median=0, std_dev=0)
    arr = np.array(metrics, dtype=float)
    return dict(
        avg=float(arr.mean()),
        max=float(arr.max()),
        min=float(arr.min()),
        median=float(np.median(arr)),
        std_dev=float(arr.std()),
    )


def calculate_risk_score(
    price_change: float, liquidity: float, flags: List[str]
) -> float:
    """Produce a [0..1] risk score combining market moves and threat flags."""
    base = abs(price_change) / max(liquidity, 1.0)
    penalty = 0.0
    for flag, weight in (("suspicious", 0.3), ("blacklisted", 0.2), ("honeypot", 0.15)):
        if flag in flags:
            penalty += weight
    score = min(base + penalty, 1.0)
    return round(score, 3)


@functools.lru_cache(maxsize=128)
def fetch_api_data(
    url: str, params: Optional[Dict[str, Any]] = None, headers: Optional[Dict[str, str]] = None
) -> Optional[Dict[str, Any]]:
    """GET JSON from an API with retries and caching."""
    session = requests.Session()
    retries = Retry(total=API_RETRIES, backoff_factor=0.3,
                    status_forcelist=[500, 502, 503, 504])
    session.mount("https://", HTTPAdapter(max_retries=retries))
    try:
        resp = session.get(url, params=params, headers=headers, timeout=API_TIMEOUT)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        log_event("API Request Failed", {"url": url, "error": str(e)}, level="ERROR")
        return None


def normalize_data(data: List[float]) -> List[float]:
    """Scale a list into [0..1], with constant fallback."""
    if not data:
        return []
    arr = np.array(data, dtype=float)
    mn, mx = float(arr.min()), float(arr.max())
    if mn == mx:
        return [0.5] * len(arr)
    return ((arr - mn) / (mx - mn)).tolist()


def detect_outliers(data: List[float], factor: float = 1.5) -> List[float]:
    """Identify 1.5*IQR outliers and log summary."""
    arr = np.array(data, dtype=float)
    q1, q3 = np.percentile(arr, (25, 75))
    iqr = q3 - q1
    lb, ub = q1 - factor * iqr, q3 + factor * iqr
    out = [x for x in arr.tolist() if x < lb or x > ub]
    log_event("Outlier Detection", {"lower_bound": lb, "upper_bound": ub, "count": len(out)})
    return out


# ─── Wallet Analyzer ────────────────────────────────────────────────────────────
@dataclass
class WalletAnalyzer:
    address: str
    transactions: List[Dict[str, Any]] = field(default_factory=list)
    anomalies: List[Dict[str, Any]] = field(default_factory=list)

    def load_transactions(self, tx_list: List[Dict[str, Any]]) -> None:
        """Validate and store a list of transactions."""
        if not isinstance(tx_list, list):
            raise TypeError("Transactions must be a list of dicts")
        self.transactions = tx_list

    def detect_anomalies(self, threshold: float = 10_000) -> List[Dict[str, Any]]:
        """Mark any tx.value > threshold as anomalous."""
        self.anomalies = [tx for tx in self.transactions if tx.get("value", 0) > threshold]
        log_event("Anomalies Detected", {"count": len(self.anomalies)})
        return self.anomalies

    def total_volume(self) -> float:
        """Sum of all transaction values."""
        return float(sum(tx.get("value", 0) for tx in self.transactions))

    def average_transaction(self) -> float:
        """Mean transaction value (0 if none)."""
        return self.total_volume() / len(self.transactions) if self.transactions else 0.0

    def transactions_per_day(self) -> float:
        """Tx count divided by the span in days."""
        dates = [
            datetime.fromisoformat(tx["timestamp"]).date()
            for tx in self.transactions
            if "timestamp" in tx
        ]
        if not dates:
            return 0.0
        span = (max(dates) - min(dates)).days or 1
        return len(dates) / span


# ─── Model Training & Evaluation ────────────────────────────────────────────────
def train_model(X: np.ndarray, y: np.ndarray) -> Tuple[LogisticRegression, StandardScaler]:
    """Fit a logistic regression on scaled features."""
    scaler = StandardScaler()
    Xs = scaler.fit_transform(X)
    model = LogisticRegression(max_iter=1_000)
    model.fit(Xs, y)
    log_event("Model Trained", {"samples": X.shape[0]})
    return model, scaler


def predict_risk(model: LogisticRegression, scaler: StandardScaler, features: List[float]) -> float:
    """Return probability of the positive class."""
    prob = model.predict_proba(scaler.transform([features]))[0][1]
    return float(prob)


def evaluate_model(
    model: LogisticRegression, scaler: StandardScaler, X_test: np.ndarray, y_test: np.ndarray
) -> Tuple[Dict[str, Any], float]:
    """Produce a classification report dict and ROC‑AUC."""
    Xs = scaler.transform(X_test)
    preds = model.predict(Xs)
    proba = model.predict_proba(Xs)[:, 1]
    report = classification_report(y_test, preds, output_dict=True)
    auc = roc_auc_score(y_test, proba)
    log_event("Model Evaluated", {"roc_auc": auc})
    return report, float(auc)


# ─── Token Analysis ─────────────────────────────────────────────────────────────
def analyze_token(token_metrics: Dict[str, Any]) -> Dict[str, Any]:
    """
    Batch‑calculate risk throughout the history, summarize, classify, and log.
    Expects keys: price_changes, liquidity, flags (all lists).
    """
    prices = token_metrics.get("price_changes", [])
    liqs   = token_metrics.get("liquidity", [])
    flgs   = token_metrics.get("flags", [])
    scores = []
    for i, pc in enumerate(prices):
        liq  = liqs[i] if i < len(liqs) else 1.0
        fset = flgs[i] if i < len(flgs) else []
        scores.append(calculate_risk_score(pc, liq, fset))

    summary = summarize_metrics(scores)
    cls     = classify_token(summary["avg"])
    log_event("Token Analyzed", {"avg_risk": summary["avg"], "classification": cls})
    return {"risk_scores": scores, "summary": summary, "classification": cls}


# ─── If run as script ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # demo placeholder
    example = {
        "price_changes": [0.05, -0.1, 0.2],
        "liquidity": [1000, 500, 200],
        "flags": [["suspicious"], [], ["honeypot"]],
    }
    result = analyze_token(example)
    print(json.dumps(result, indent=2))
