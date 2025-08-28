from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional, Sequence

import numpy as np
from sklearn.linear_model import LogisticRegression


def clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def calculate_risk_score(price_change: float, liquidity: float, flags: Sequence[str]) -> float:
    """
    Deterministic risk score in [0, 1].
    - Base score: |price_change| / max(liquidity, 1)
    - Additive penalty if 'suspicious' flag present: +0.3
    """
    if not isinstance(price_change, (int, float)) or not np.isfinite(price_change):
        raise ValueError("price_change must be a finite number")
    if not isinstance(liquidity, (int, float)) or liquidity < 0:
        raise ValueError("liquidity must be a non-negative number")
    if flags is None:
        flags = []

    base = abs(float(price_change)) / max(float(liquidity), 1.0)
    penalty = 0.3 if "suspicious" in flags else 0.0
    return round(clamp(base + penalty, 0.0, 1.0), 2)


def log_event(event_type: str, metadata: Dict[str, Any], logfile: str = "logfile.jsonl") -> None:
    """
    Append a JSON line with timestamp, event, and metadata to logfile.
    Writes to a .jsonl file (one JSON object per line).
    """
    if not isinstance(event_type, str) or not event_type:
        raise ValueError("event_type must be a non-empty string")
    if not isinstance(metadata, dict):
        raise ValueError("metadata must be a dict")

    now = datetime.now(timezone.utc).isoformat()
    entry = {"timestamp": now, "event": event_type, "meta": metadata}

    os.makedirs(os.path.dirname(logfile) or ".", exist_ok=True)
    with open(logfile, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


@dataclass
class WalletAnalyzer:
    address: str
    transactions: List[Dict[str, Any]] = field(default_factory=list)

    def load_transactions(self, tx_list: Iterable[Dict[str, Any]]) -> None:
        self.transactions = list(tx_list or [])

    def detect_anomalies(self, threshold: float = 10_000) -> List[Dict[str, Any]]:
        """
        Flag transactions whose 'value' exceeds threshold.
        Returns a list of matching transactions. Missing 'value' treated as 0.
        """
        if threshold < 0:
            raise ValueError("threshold must be non-negative")
        out: List[Dict[str, Any]] = []
        for tx in self.transactions:
            val = tx.get("value", 0)
            if isinstance(val, (int, float)) and val > threshold:
                out.append(tx)
        return out


def classify_token(risk_score: float) -> str:
    """
    Map a [0,1] risk_score to a label.
    > 0.8 -> High Risk
    > 0.5 -> Moderate Risk
    else  -> Low Risk
    """
    if not isinstance(risk_score, (int, float)) or not np.isfinite(risk_score):
        raise ValueError("risk_score must be a finite number")
    rs = float(risk_score)
    if rs > 0.8:
        return "High Risk"
    if rs > 0.5:
        return "Moderate Risk"
    return "Low Risk"


def summarize_metrics(metrics: Sequence[float]) -> Dict[str, float]:
    """
    Return avg, max, min for a sequence. Empty -> zeros.
    Ignores non-finite values.
    """
    values = [float(x) for x in metrics if isinstance(x, (int, float)) and np.isfinite(x)]
    if not values:
        return {"avg": 0.0, "max": 0.0, "min": 0.0}
    return {
        "avg": float(sum(values) / len(values)),
        "max": float(max(values)),
        "min": float(min(values)),
    }


def train_model(X: Sequence[Sequence[float]], y: Sequence[int]) -> LogisticRegression:
    """
    Train a logistic regression classifier deterministically.
    Uses liblinear solver (deterministic) and balanced class weights for stability.
    """
    X_arr = np.asarray(X, dtype=float)
    y_arr = np.asarray(y, dtype=int)
    if X_arr.ndim != 2 or y_arr.ndim != 1 or X_arr.shape[0] != y_arr.shape[0]:
        raise ValueError("X must be 2D and y must be 1D with matching lengths")
    model = LogisticRegression(solver="liblinear", class_weight="balanced", max_iter=1000)
    model.fit(X_arr, y_arr)
    return model


def predict_risk(model: LogisticRegression, features: Sequence[float], positive_label: int = 1) -> float:
    """
    Return P(y == positive_label) in [0,1] for a single feature vector.
    """
    X = np.asarray([features], dtype=float)
    proba = model.predict_proba(X)[0]
    classes = model.classes_.tolist()
    if positive_label not in classes:
        raise ValueError(f"positive_label {positive_label} not in model classes {classes}")
    idx = classes.index(positive_label)
    return float(proba[idx])


def detect_outliers(data: Sequence[float]) -> List[float]:
    """
    IQR-based outlier detection. Returns values outside [Q1 - 1.5*IQR, Q3 + 1.5*IQR].
    For fewer than 4 points, returns an empty list (not enough data).
    """
    values = [float(x) for x in data if isinstance(x, (int, float)) and np.isfinite(x)]
    if len(values) < 4:
        return []
    q1 = float(np.percentile(values, 25))
    q3 = float(np.percentile(values, 75))
    iqr = q3 - q1
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr
    return [x for x in values if x < lower or x > upper]
