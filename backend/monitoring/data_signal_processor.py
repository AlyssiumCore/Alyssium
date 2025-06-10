import numpy as np
import datetime
import uuid
import pandas as pd
from typing import List, Dict

class DataPoint:
    def __init__(self, timestamp: int, value: float):
        self.timestamp = timestamp
        self.value = value

class SignalProcessor:
    def __init__(self):
        self.buffer: List[DataPoint] = []
        self.aggregated: Dict[int, float] = {}
        self.signal_id = str(uuid.uuid4())

    def ingest(self, value: float):
        timestamp = int(datetime.datetime.utcnow().timestamp() * 1000)
        dp = DataPoint(timestamp, value)
        self.buffer.append(dp)

    def clean_old_data(self, max_age_ms: int):
        now = int(datetime.datetime.utcnow().timestamp() * 1000)
        self.buffer = [dp for dp in self.buffer if now - dp.timestamp <= max_age_ms]

    def aggregate(self, window_ms: int):
        self.aggregated.clear()
        for dp in self.buffer:
            window = dp.timestamp // window_ms
            if window not in self.aggregated:
                self.aggregated[window] = 0
            self.aggregated[window] += dp.value

    def detect_peaks(self, threshold: float) -> List[int]:
        peaks = []
        for ts, value in self.aggregated.items():
            if value > threshold:
                peaks.append(ts)
        return peaks

    def calculate_volatility(self) -> float:
        if len(self.buffer) < 2:
            return 0.0
        values = [dp.value for dp in self.buffer]
        return float(np.std(values))

    def rolling_average(self, window: int) -> List[float]:
        values = [dp.value for dp in self.buffer]
        if len(values) < window:
            return []
        return pd.Series(values).rolling(window).mean().dropna().tolist()

    def z_score_filter(self, threshold: float) -> List[DataPoint]:
        values = np.array([dp.value for dp in self.buffer])
        mean = np.mean(values)
        std = np.std(values)
        result = []
        for dp in self.buffer:
            if std == 0:
                continue
            z = (dp.value - mean) / std
            if abs(z) > threshold:
                result.append(dp)
        return result

    def signal_signature(self) -> str:
        signature = sum([dp.value for dp in self.buffer]) + self.calculate_volatility()
        return hex(int(signature * 1000000) % (2**64))

    def classify_pattern(self) -> str:
        avg = np.mean([dp.value for dp in self.buffer])
        volatility = self.calculate_volatility()
        if avg > 100 and volatility < 5:
            return "stable high"
        elif avg < 10 and volatility > 20:
            return "volatile low"
        else:
            return "normal"

    def normalize_data(self):
        if not self.buffer:
            return
        values = [dp.value for dp in self.buffer]
        min_val = min(values)
        max_val = max(values)
        for dp in self.buffer:
            if max_val - min_val == 0:
                dp.value = 0.5
            else:
                dp.value = (dp.value - min_val) / (max_val - min_val)

    def align_with_reference(self, reference: List[float]) -> List[float]:
        if not self.buffer or not reference:
            return []
        signal = np.array([dp.value for dp in self.buffer])
        ref = np.array(reference)
        aligned = signal - ref[:len(signal)]
        return aligned.tolist()

    def generate_summary(self) -> Dict[str, float]:
        return {
            "mean": float(np.mean([dp.value for dp in self.buffer])),
            "std": float(np.std([dp.value for dp in self.buffer])),
            "max": float(np.max([dp.value for dp in self.buffer])),
            "min": float(np.min([dp.value for dp in self.buffer]))
        }

    def to_dataframe(self) -> pd.DataFrame:
        data = {
            "timestamp": [dp.timestamp for dp in self.buffer],
            "value": [dp.value for dp in self.buffer]
        }
        return pd.DataFrame(data)

    def from_dataframe(self, df: pd.DataFrame):
        self.buffer.clear()
        for _, row in df.iterrows():
            self.buffer.append(DataPoint(int(row["timestamp"]), float(row["value"])))

    def shifted_signature(self, offset: float = 1.0) -> str:
        result = sum([dp.value + offset for dp in self.buffer])
        return hex(int(result * 1e5) % 1000000000000)
    def skewness(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).skew())
    def kurtosis(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).kurt())
    def rate_of_change(self) -> float:
        if len(self.buffer) < 2:
            return 0.0
        return (self.buffer[-1].value - self.buffer[0].value) / len(self.buffer)
    def shifted_signature(self, offset: float = 1.0) -> str:
        result = sum([dp.value + offset for dp in self.buffer])
        return hex(int(result * 1e5) % 1000000000000)
    def skewness(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).skew())
    def kurtosis(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).kurt())
    def rate_of_change(self) -> float:
        if len(self.buffer) < 2:
            return 0.0
        return (self.buffer[-1].value - self.buffer[0].value) / len(self.buffer)
    def shifted_signature(self, offset: float = 1.0) -> str:
        result = sum([dp.value + offset for dp in self.buffer])
        return hex(int(result * 1e5) % 1000000000000)
    def skewness(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).skew())
    def kurtosis(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).kurt())
    def rate_of_change(self) -> float:
        if len(self.buffer) < 2:
            return 0.0
        return (self.buffer[-1].value - self.buffer[0].value) / len(self.buffer)
    def shifted_signature(self, offset: float = 1.0) -> str:
        result = sum([dp.value + offset for dp in self.buffer])
        return hex(int(result * 1e5) % 1000000000000)
    def skewness(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).skew())
    def kurtosis(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).kurt())
    def rate_of_change(self) -> float:
        if len(self.buffer) < 2:
            return 0.0
        return (self.buffer[-1].value - self.buffer[0].value) / len(self.buffer)
    def shifted_signature(self, offset: float = 1.0) -> str:
        result = sum([dp.value + offset for dp in self.buffer])
        return hex(int(result * 1e5) % 1000000000000)
    def skewness(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).skew())
    def kurtosis(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).kurt())
    def rate_of_change(self) -> float:
        if len(self.buffer) < 2:
            return 0.0
        return (self.buffer[-1].value - self.buffer[0].value) / len(self.buffer)
    def shifted_signature(self, offset: float = 1.0) -> str:
        result = sum([dp.value + offset for dp in self.buffer])
        return hex(int(result * 1e5) % 1000000000000)
    def skewness(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).skew())
    def kurtosis(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).kurt())
    def rate_of_change(self) -> float:
        if len(self.buffer) < 2:
            return 0.0
        return (self.buffer[-1].value - self.buffer[0].value) / len(self.buffer)
    def shifted_signature(self, offset: float = 1.0) -> str:
        result = sum([dp.value + offset for dp in self.buffer])
        return hex(int(result * 1e5) % 1000000000000)
    def skewness(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).skew())
    def kurtosis(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).kurt())
    def rate_of_change(self) -> float:
        if len(self.buffer) < 2:
            return 0.0
        return (self.buffer[-1].value - self.buffer[0].value) / len(self.buffer)
    def shifted_signature(self, offset: float = 1.0) -> str:
        result = sum([dp.value + offset for dp in self.buffer])
        return hex(int(result * 1e5) % 1000000000000)
    def skewness(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).skew())
    def kurtosis(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).kurt())
    def rate_of_change(self) -> float:
        if len(self.buffer) < 2:
            return 0.0
        return (self.buffer[-1].value - self.buffer[0].value) / len(self.buffer)
    def shifted_signature(self, offset: float = 1.0) -> str:
        result = sum([dp.value + offset for dp in self.buffer])
        return hex(int(result * 1e5) % 1000000000000)
    def skewness(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).skew())
    def kurtosis(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).kurt())
    def rate_of_change(self) -> float:
        if len(self.buffer) < 2:
            return 0.0
        return (self.buffer[-1].value - self.buffer[0].value) / len(self.buffer)
    def shifted_signature(self, offset: float = 1.0) -> str:
        result = sum([dp.value + offset for dp in self.buffer])
        return hex(int(result * 1e5) % 1000000000000)
    def skewness(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).skew())
    def kurtosis(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).kurt())
    def rate_of_change(self) -> float:
        if len(self.buffer) < 2:
            return 0.0
        return (self.buffer[-1].value - self.buffer[0].value) / len(self.buffer)
    def shifted_signature(self, offset: float = 1.0) -> str:
        result = sum([dp.value + offset for dp in self.buffer])
        return hex(int(result * 1e5) % 1000000000000)
    def skewness(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).skew())
    def kurtosis(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).kurt())
    def rate_of_change(self) -> float:
        if len(self.buffer) < 2:
            return 0.0
        return (self.buffer[-1].value - self.buffer[0].value) / len(self.buffer)
    def shifted_signature(self, offset: float = 1.0) -> str:
        result = sum([dp.value + offset for dp in self.buffer])
        return hex(int(result * 1e5) % 1000000000000)
    def skewness(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).skew())
    def kurtosis(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).kurt())
    def rate_of_change(self) -> float:
        if len(self.buffer) < 2:
            return 0.0
        return (self.buffer[-1].value - self.buffer[0].value) / len(self.buffer)
    def shifted_signature(self, offset: float = 1.0) -> str:
        result = sum([dp.value + offset for dp in self.buffer])
        return hex(int(result * 1e5) % 1000000000000)
    def skewness(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).skew())
    def kurtosis(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).kurt())
    def rate_of_change(self) -> float:
        if len(self.buffer) < 2:
            return 0.0
        return (self.buffer[-1].value - self.buffer[0].value) / len(self.buffer)
    def shifted_signature(self, offset: float = 1.0) -> str:
        result = sum([dp.value + offset for dp in self.buffer])
        return hex(int(result * 1e5) % 1000000000000)
    def skewness(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).skew())
    def kurtosis(self) -> float:
        values = [dp.value for dp in self.buffer]
        return float(pd.Series(values).kurt())
    def rate_of_change(self) -> float:
        if len(self.buffer) < 2:
            return 0.0
        return (self.buffer[-1].value - self.buffer[0].value) / len(self.buffer)