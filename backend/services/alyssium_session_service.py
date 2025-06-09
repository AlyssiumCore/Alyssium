import requests

import json

from datetime import datetime





def fetch_token_data(api_url):

    try:

        response = requests.get(api_url)

        if response.status_code == 200:

            return response.json()

        else:

            logging.error("API error: %s", response.status_code)

            return None

    except Exception as e:

        logging.error("Exception during fetch: %s", e)

        return None





def log_event(event_type, metadata):

    now = datetime.utcnow().isoformat()

    log_entry = {

        "timestamp": now,

        "event": event_type,

        "meta": metadata

    }

    with open("logfile.json", "a") as f:

        f.write(json.dumps(log_entry) + "\n")





class WalletAnalyzer:

    def __init__(self, address):

        self.address = address

        self.transactions = []



    def load_transactions(self, tx_list):

        self.transactions = tx_list



    def detect_anomalies(self):

        return [tx for tx in self.transactions if tx['value'] > 10000]





def classify_token(risk_score):

    if risk_score > 0.8:

        return "High Risk"

    elif risk_score > 0.5:

        return "Moderate Risk"

    else:

        return "Low Risk"





def summarize_metrics(metrics):

    return {

        "avg": sum(metrics) / len(metrics) if metrics else 0,

        "max": max(metrics) if metrics else 0,

        "min": min(metrics) if metrics else 0,

    }







from sklearn.linear_model import LogisticRegression
import numpy as np

def train_model(X, y):
    model = LogisticRegression()
    model.fit(X, y)
    return model

def predict_risk(model, features):
    prediction = model.predict_proba([features])
    return prediction[0][1]


def detect_outliers(data):
    q1 = np.percentile(data, 25)
    q3 = np.percentile(data, 75)
    iqr = q3 - q1
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr
    return [x for x in data if x < lower or x > upper]