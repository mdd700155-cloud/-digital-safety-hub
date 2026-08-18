# ML training helper

This folder contains scripts and guidance to train the lightweight URL classifier used by the application.

Key points:
- The model must be trained offline (Python) and exported as a small JSON artifact (intercept + coefficients).
- Do NOT commit raw dataset files or model artifacts into the repository.
- The production inference code in `lib/security/mlUrlClassifier.ts` will look for `lib/security/models/ml_model.json` by default or use the `ML_URL_MODEL_PATH` environment variable.

Dataset recommendation:
- PhiUSIIL Phishing URL Dataset (UCI) — https://archive.ics.uci.edu/dataset/967/phiusil-phishing-url-dataset

Training steps (summary):
1. Download the dataset and place a cleaned CSV locally (do not commit).
2. Ensure the CSV has a `url` column and a binary `label` column (1=phish, 0=legit).
3. Run training:

```bash
python tools/ml/train.py --data /path/to/clean.csv --out /path/to/ml_model.json --model logreg
```

4. Review validation/test metrics printed by the script (precision, recall, F1, confusion matrix).
5. If satisfied, copy the exported `ml_model.json` to `lib/security/models/ml_model.json` on the server (or set `ML_URL_MODEL_PATH`).

Security and generalization notes:
- The feature extractor is URL-only (no HTML fetching, no WHOIS). This keeps inference safe and fast.
- Carefully inspect features that require website content — do not use them in production unless the data can be retrieved safely.
- Prioritize low false-positive rates over recall for production use.
