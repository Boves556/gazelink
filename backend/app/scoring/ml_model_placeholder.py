"""
Scikit-learn-compatible placeholder for future ML-based scoring.

IMPORTANT: This module does NOT use real clinical training data.
Any sample arrays below are clearly marked as simulated demo features only.
"""

from __future__ import annotations

import numpy as np
from sklearn.base import BaseEstimator, ClassifierMixin


class AttentionSupportClassifierPlaceholder(BaseEstimator, ClassifierMixin):
    """
    Placeholder RandomForest-compatible estimator interface.

    In a future validated deployment, this class could be replaced with a
    properly trained model using ethically approved, de-identified datasets.
    """

    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        self.classes_ = np.array(["low", "medium", "high"])
        self.is_fitted_ = False

    def fit(self, X, y):
        """Accept demo data for API compatibility; does not perform real training."""
        self.n_features_in_ = X.shape[1] if hasattr(X, "shape") else len(X[0])
        self.is_fitted_ = True
        return self

    def predict(self, X):
        if not self.is_fitted_:
            raise RuntimeError("Placeholder model must be fit before predict().")
        # Demo-only heuristic: never presented as clinical inference.
        predictions = []
        for row in X:
            score = float(np.mean(row)) if len(row) else 0.0
            if score >= 0.65:
                predictions.append("high")
            elif score >= 0.35:
                predictions.append("medium")
            else:
                predictions.append("low")
        return np.array(predictions)

    def predict_proba(self, X):
        preds = self.predict(X)
        proba = []
        for label in preds:
            if label == "high":
                proba.append([0.1, 0.2, 0.7])
            elif label == "medium":
                proba.append([0.2, 0.6, 0.2])
            else:
                proba.append([0.7, 0.2, 0.1])
        return np.array(proba)


def demo_simulated_feature_matrix() -> np.ndarray:
    """
    Simulated demo features ONLY — not clinical data.
    Columns: [norm_rt, miss_rate, wrong_rate, gaze_stability, off_screen_rate, tracking_accuracy]
    """
    return np.array(
        [
            [0.42, 0.10, 0.05, 0.82, 0.04, 0.88],
            [0.58, 0.25, 0.12, 0.61, 0.11, 0.69],
            [0.71, 0.40, 0.20, 0.48, 0.18, 0.52],
        ]
    )


def demo_simulated_labels() -> np.ndarray:
    """Simulated demo labels ONLY — not derived from real patients."""
    return np.array(["low", "medium", "high"])
