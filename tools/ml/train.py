"""
Training script for the URL ML classifier.

Usage:
  python train.py --data PATH_TO_CSV --out model.json

This script expects a CSV derived from the PhiUSIIL phishing URL dataset
with a binary target column named 'label' where 1=phishing, 0=legitimate.

DO NOT commit raw dataset or model artifacts to the repository.
"""
import argparse
import json
import math
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.utils import shuffle
from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_recall_fscore_support, confusion_matrix


def entropy(s: str) -> float:
    if not s:
        return 0.0
    probs = [v / len(s) for v in pd.Series(list(s)).value_counts().values]
    return -sum(p * math.log2(p) for p in probs)


def extract_features_from_row(url: str):
    raw = url.strip()
    parse = raw
    if not parse.lower().startswith("http"):
        if parse.startswith("//"):
            parse = "http:" + parse
        else:
            parse = "http://" + parse
    try:
        from urllib.parse import urlparse

        u = urlparse(parse)
    except Exception:
        return None

    hostname = u.hostname or ""
    pathname = u.path or ""
    search = u.query or ""

    url_length = len(raw)
    hostname_length = len(hostname)
    path_length = len(pathname)
    num_dots = hostname.count('.')
    subdomain_count = max(0, hostname.count('.') - 2)
    num_digits = sum(c.isdigit() for c in raw)
    num_hyphens = raw.count('-')
    # Mirror production: count param assignments by splitting on '&' when query non-empty
    if search:
        num_query_params = len([p for p in search.split('&') if p != ''])
    else:
        num_query_params = 0
    num_path_segments = len([p for p in pathname.split('/') if p])
    import re
    has_ip = 1 if hostname and re.match(r'^(?:\d{1,3}\.){3}\d{1,3}$', hostname) else 0
    has_at = 1 if '@' in raw else 0
    has_pct_encoding = 1 if re.search(r'%[0-9A-Fa-f]{2}', raw) else 0
    has_punycode = 1 if hostname.startswith('xn--') or 'xn--' in hostname else 0
    is_https = 1 if u.scheme == 'https' else 0
    unusual_port = 1 if (u.port and str(u.port) not in ['80','443','8080','8443']) else 0
    hostname_entropy = entropy(hostname)
    path_entropy = entropy(pathname + search)

    features = [
        url_length,
        hostname_length,
        path_length,
        num_dots,
        subdomain_count,
        num_digits,
        num_hyphens,
        num_query_params,
        num_path_segments,
        has_ip,
        has_at,
        has_pct_encoding,
        has_punycode,
        is_https,
        unusual_port,
        hostname_entropy,
        path_entropy,
    ]
    return features


FEATURE_ORDER = [
    "url_length",
    "hostname_length",
    "path_length",
    "num_dots",
    "subdomain_count",
    "num_digits",
    "num_hyphens",
    "num_query_params",
    "num_path_segments",
    "has_ip",
    "has_at",
    "has_pct_encoding",
    "has_punycode",
    "is_https",
    "unusual_port",
    "hostname_entropy",
    "path_entropy",
]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data', required=True, help='Path to CSV with URL rows and label column (1=phish,0=legit)')
    parser.add_argument('--out', required=True, help='Output JSON model path')
    parser.add_argument('--seed', type=int, default=42, help='Random seed for reproducibility')
    args = parser.parse_args()

    df = pd.read_csv(args.data)
    if 'label' not in df.columns:
        raise SystemExit('CSV must contain a label column with 1=phish,0=legit')

    feature_rows = []
    labels = []
    for idx, row in df.iterrows():
        feats = extract_features_from_row(str(row.get('url', row.get('URL', ''))))
        if feats is None:
            continue
        feature_rows.append(feats)
        labels.append(int(row['label']))

    X = np.array(feature_rows)
    y = np.array(labels)

    # Shuffle and split reproducibly with provided seed
    X, y = shuffle(X, y, random_state=args.seed)
    n = X.shape[0]
    n_train = int(n * 0.7)
    n_val = int(n * 0.15)
    n_test = n - n_train - n_val

    X_train = X[:n_train]
    y_train = y[:n_train]
    X_val = X[n_train:n_train + n_val]
    y_val = y[n_train:n_train + n_val]
    X_test = X[n_train + n_val:]
    y_test = y[n_train + n_val:]

    model = LogisticRegression(max_iter=1000, random_state=args.seed)

    model.fit(X_train, y_train)

    # Validation probabilities
    probs_val = model.predict_proba(X_val)[:, 1]

    # Evaluate fixed thresholds conservatively
    thresholds = [0.50, 0.60, 0.70, 0.80, 0.90]
    thr_metrics = []
    from sklearn.metrics import confusion_matrix
    print('\nValidation threshold evaluation:')
    for thr in thresholds:
        preds = (probs_val >= thr).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_val, preds).ravel()
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
        fnr = fn / (fn + tp) if (fn + tp) > 0 else 0.0
        thr_metrics.append((thr, precision, recall, f1, fpr, fnr, (tn, fp, fn, tp)))
        print(f'  thr={thr:.2f}  precision={precision:.4f}  recall={recall:.4f}  f1={f1:.4f}  fpr={fpr:.4f}  fnr={fnr:.4f}')

    # Select conservative threshold: prefer FPR <= 0.02, maximize recall among those
    candidates = [m for m in thr_metrics if m[4] <= 0.02]
    if candidates:
        # pick candidate with max recall
        selected = max(candidates, key=lambda x: x[2])
    else:
        # fallback: pick threshold with minimum FPR
        selected = min(thr_metrics, key=lambda x: x[4])
    threshold = float(selected[0])
    print('\nSelected threshold:', threshold, 'metrics:', selected[1:6])

    # (export will be performed below after test evaluation)

    # Final test evaluation using selected threshold
    probs_test = model.predict_proba(X_test)[:, 1]
    preds_test = (probs_test >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_test, preds_test).ravel()
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
    accuracy = (tp + tn) / (tp + tn + fp + fn)
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    fnr = fn / (fn + tp) if (fn + tp) > 0 else 0.0

    print('\nTest results:')
    print(f'  precision={precision:.4f}  recall={recall:.4f}  f1={f1:.4f}  accuracy={accuracy:.4f}  fpr={fpr:.4f}  fnr={fnr:.4f}')
    print('  confusion_matrix (tn, fp, fn, tp)=', (tn, fp, fn, tp))

    # Export model artifact
    import os
    out_dir = os.path.dirname(args.out)
    if out_dir and not os.path.exists(out_dir):
        os.makedirs(out_dir, exist_ok=True)

    model_json = {'version': '1.0', 'featureOrder': FEATURE_ORDER}
    coefs = model.coef_[0].tolist()
    intercept = float(model.intercept_[0])
    model_json.update({'intercept': intercept, 'coefficients': dict(zip(FEATURE_ORDER, coefs)), 'threshold': threshold})
    metadata = {
        'seed': args.seed,
        'n_total': int(X.shape[0]),
        'n_train': int(X_train.shape[0]),
        'n_val': int(X_val.shape[0]),
        'n_test': int(X_test.shape[0]),
        'selected_threshold': threshold,
    }
    model_json['training_metadata'] = metadata

    with open(args.out, 'w') as f:
        json.dump(model_json, f, indent=2)

    print('\nModel artifact written to', args.out)


if __name__ == '__main__':
    main()
