"""Quick model tester: loads exported JSON model and scores sample URLs.
Usage:
  python test_model.py --model lib/security/models/ml_model.json
"""
import argparse
import json
import math
import re


def entropy(s: str) -> float:
    if not s:
        return 0.0
    counts = {}
    for c in s:
        counts[c] = counts.get(c, 0) + 1
    probs = [v / len(s) for v in counts.values()]
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
    if search:
        num_query_params = len([p for p in search.split('&') if p != ''])
    else:
        num_query_params = 0
    num_path_segments = len([p for p in pathname.split('/') if p])
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


def score_with_model(model_json, feats):
    intercept = model_json['intercept']
    coefs = model_json['coefficients']
    order = model_json['featureOrder']
    lin = intercept
    for i, name in enumerate(order):
        lin += feats[i] * float(coefs[name])
    import math
    prob = 1.0 / (1.0 + math.exp(-lin))
    return prob


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', required=True)
    args = parser.parse_args()

    with open(args.model, 'r') as f:
        model = json.load(f)

    test_urls = [
        'https://www.google.com/',
        'https://accounts.google.com/signin',
        'https://www.microsoft.com/',
        'https://login.microsoftonline.com/common/oauth2/authorize',
        'https://apple.com',
        'http://192.168.0.1/login',
        'http://xn--example-9p8h[.]com/',
        'http://malicious-paypal.com/verify?user=abc',
        'http://very-long-subdomain.' + 'a'*100 + '.com/path?query=1',
    ]

    print('Model threshold:', model.get('threshold'))
    for u in test_urls:
        feats = extract_features_from_row(u)
        if feats is None:
            print('SKIP', u)
            continue
        prob = score_with_model(model, feats)
        pred = int(prob >= float(model.get('threshold', 0.5)))
        print(f'{u}\n  prob={prob:.4f} pred={pred}')


if __name__ == '__main__':
    main()
