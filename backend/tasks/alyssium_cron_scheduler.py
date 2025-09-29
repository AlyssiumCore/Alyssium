import json
import logging
import math
import time
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import numpy as np
import requests
from sklearn.linear_model import LogisticRegression


# basic logger setup for library style usage
logger = logging.getLogger(__name__)
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        fmt="%(asctime)s %(levelname)s %(name)s %(message)s"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
logger.setLevel(logging.INFO)


# ----------------------------
# data models
# ----------------------------

@dataclass(frozen=True)
class Transaction:
    txid: str
    value: float
    timestamp: int
    sender: Optional[str] = None
    receiver: Optional[str] = None
    token: Optional[str] = None


# ----------------------------
# core metrics and scoring
# ----------------------------

def calculate_risk_score(
    price_change: float,
    liquidity: float,
    flags: Iterable[str],
    *,
    flag_weights: Optional[Dict[str, float]] = None,
    liquidity_floor: float = 1.0,
    max_score: float = 1.0,
) -> float:
    """
    compute a capped risk score using price change, liquidity and flag signals
    higher absolute price change and lower liquidity increase risk
    specific flags can add weight
    """
    base = abs(price_change) / max(liquidity, liquidity_floor)
    wmap = flag_weights or {"suspicious": 0.3, "honeypot": 0.4, "blacklist": 0.5}
    bonus = sum(wmap.get(f, 0.0) for f in set(flags))
    score = min(base + bonus, max_score)
    return round(score, 4)


def summarize_metrics(values: Sequence[float]) -> Dict[str, float]:
    arr = np.array([v for v in values if v is not None], dtype=float)
    if arr.size == 0:
        return {"avg": 0.0, "max": 0.0, "min": 0.0, "std": 0.0, "count": 0}
    return {
        "avg": float(arr.mean()),
        "max": float(arr.max()),
        "min": float(arr.min()),
        "std": float(arr.std(ddof=0)),
        "count": int(arr.size),
    }


def risk_label(score: float) -> str:
    if score > 0.8:
        return "High Risk"
    if score > 0.5:
        return "Moderate Risk"
    return "Low Risk"


def detect_outliers(values: Sequence[float]) -> List[float]:
    arr = np.asarray(values, dtype=float)
    if arr.size < 4:
        return []
    q1 = float(np.percentile(arr, 25))
    q3 = float(np.percentile(arr, 75))
    iqr = q3 - q1
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr
    return [float(x) for x in arr if x < lower or x > upper]


def rolling_average(values: Sequence[float], window: int) -> List[float]:
    if window <= 0:
        raise ValueError("window must be positive")
    arr = np.asarray(values, dtype=float)
    if arr.size < window:
        return []
    kernel = np.ones(window) / float(window)
    # valid mode to avoid partial windows
    rolled = np.convolve(arr, kernel, mode="valid")
    return [float(x) for x in rolled]


# ----------------------------
# wallet analysis
# ----------------------------

class WalletAnalyzer:
    def __init__(self, address: str):
        self.address = address
        self.transactions: List[Transaction] = []

    def load_transactions(self, tx_list: Iterable[Dict[str, Any]]) -> None:
        self.transactions = [
            Transaction(
                txid=str(tx.get("txid", "")),
                value=float(tx.get("value", 0)),
                timestamp=int(tx.get("timestamp", 0)),
                sender=tx.get("sender"),
                receiver=tx.get("receiver"),
                token=tx.get("token"),
            )
            for tx in tx_list
        ]

    def detect_anomalies(self, threshold: float = 10_000) -> List[Transaction]:
        return [tx for tx in self.transactions if tx.value > threshold]

    def total_transferred(self) -> float:
        return float(sum(tx.value for tx in self.transactions))

    def top_transfers(self, k: int = 5) -> List[Transaction]:
        return sorted(self.transactions, key=lambda t: t.value, reverse=True)[:k]

    def time_window_slice(self, start_ts: int, end_ts: int) -> List[Transaction]:
        return [tx for tx in self.transactions if start_ts <= tx.timestamp < end_ts]


# ----------------------------
# external data access
# ----------------------------

def fetch_json(
    url: str,
    *,
    params: Optional[Dict[str, Any]] = None,
    headers: Optional[Dict[str, str]] = None,
    timeout: float = 10.0,
) -> Optional[Dict[str, Any]]:
    try:
        resp = requests.get(url, params=params, headers=headers, timeout=timeout)
        if resp.status_code == 200:
            return resp.json()
        logger.error("api error %s %s", resp.status_code, url)
        return None
    except requests.RequestException as e:
        logger.error("network error %s", e)
        return None
    except json.JSONDecodeError as e:
        logger.error("json decode error %s", e)
        return None


def fetch_token_overview_solanatracker(mint: str) -> Optional[Dict[str, Any]]:
    """
    real endpoint for token info
    """
    url = f"https://data.solanatracker.io/tokens/{mint}"
    return fetch_json(url)


def fetch_rugcheck_assessment(mint: str) -> Optional[Dict[str, Any]]:
    """
    real endpoint for risk assessment
    """
    url = f"https://api.rugcheck.xyz/v1/tokens/{mint}/report"
    return fetch_json(url)


def fetch_token_data(api_url: str) -> Optional[Dict[str, Any]]:
    """
    generic fetcher kept for compatibility
    """
    return fetch_json(api_url)


# ----------------------------
# model training and inference
# ----------------------------

def train_model(X: Sequence[Sequence[float]], y: Sequence[int]) -> LogisticRegression:
    """
    X is a 2d array like features
    y is binary labels
    balanced class weight helps with skewed datasets
    """
    model = LogisticRegression(
        solver="liblinear",
        class_weight="balanced",
        max_iter=1000,
    )
    model.fit(np.asarray(X, dtype=float), np.asarray(y, dtype=int))
    return model


def predict_risk(model: LogisticRegression, features: Sequence[float]) -> float:
    arr = np.asarray(features, dtype=float).reshape(1, -1)
    proba = model.predict_proba(arr)
    return float(proba[0][1])


# ----------------------------
# feature engineering helpers
# ----------------------------

def build_features_from_token(
    price_change: float,
    liquidity: float,
    volume_24h: float,
    holders: int,
    flags_count: int,
) -> List[float]:
    """
    simple deterministic feature vector for models
    """
    inv_liq = 1.0 / max(liquidity, 1e-6)
    log_vol = math.log(max(volume_24h, 1.0))
    log_holders = math.log(max(holders, 1.0))
    return [
        price_change,
        inv_liq,
        log_vol,
        log_holders,
        float(flags_count),
        price_change * inv_liq,
    ]


def aggregate_flag_list(flags: Iterable[str]) -> Tuple[int, Dict[str, int]]:
    counts: Dict[str, int] = {}
    for f in flags:
        counts[f] = counts.get(f, 0) + 1
    total = int(sum(counts.values()))
    return total, counts


# ----------------------------
# public API
# ----------------------------

__all__ = [
    "Transaction",
    "WalletAnalyzer",
    "calculate_risk_score",
    "summarize_metrics",
    "risk_label",
    "detect_outliers",
    "rolling_average",
    "fetch_json",
    "fetch_token_overview_solanatracker",
    "fetch_rugcheck_assessment",
    "fetch_token_data",
    "train_model",
    "predict_risk",
    "build_features_from_token",
    "aggregate_flag_list",
]
