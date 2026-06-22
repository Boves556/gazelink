"""Rule-based attention-support scoring for GazeLink prototype sessions."""

from __future__ import annotations

from typing import List

from dataclasses import dataclass


@dataclass
class ScoringInput:
    avg_reaction_time: float
    missed_targets: int
    wrong_clicks: int
    gaze_stability_score: float
    off_screen_gaze_count: int
    tracking_accuracy: float
    blink_count: int
    target_changes: int = 0


@dataclass
class ScoringResult:
    risk_level: str
    confidence_score: float
    explanation: str
    suggested_actions: List[str]


MEDICAL_DISCLAIMER = (
    "This screening output is for educational prototype use only and does not diagnose ADHD."
)


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def calculate_attention_support_score(data: ScoringInput) -> ScoringResult:
    """
    Rule-based scoring: higher composite risk score => higher attention-support need.
    Values are heuristic demo thresholds, not validated clinical cutoffs.
    """
    risk_points = 0.0
    reasons: List[str] = []

    if data.target_changes > 0:
        miss_rate = data.missed_targets / max(data.target_changes, 1)
        if miss_rate >= 0.4:
            risk_points += 30
            reasons.append("Several target-change responses were missed.")
        elif miss_rate >= 0.2:
            risk_points += 15
            reasons.append("Some target-change responses were missed.")

    if data.wrong_clicks >= 8:
        risk_points += 25
        reasons.append("Many incorrect responses were recorded.")
    elif data.wrong_clicks >= 4:
        risk_points += 12
        reasons.append("Some incorrect responses were recorded.")

    if data.tracking_accuracy < 0.55:
        risk_points += 20
        reasons.append("Tracking accuracy during the task was low.")
    elif data.tracking_accuracy < 0.75:
        risk_points += 10
        reasons.append("Tracking accuracy was moderate.")

    if data.gaze_stability_score < 0.5:
        risk_points += 18
        reasons.append("Gaze stability was lower than expected.")
    elif data.gaze_stability_score < 0.7:
        risk_points += 8

    if data.off_screen_gaze_count >= 12:
        risk_points += 15
        reasons.append("Frequent off-screen gaze events were detected.")
    elif data.off_screen_gaze_count >= 6:
        risk_points += 7

    if data.avg_reaction_time >= 900:
        risk_points += 18
        reasons.append("Average reaction time was slow.")
    elif data.avg_reaction_time >= 650:
        risk_points += 8

    if data.blink_count >= 40:
        risk_points += 5

    risk_points = _clamp(risk_points, 0, 100)

    if risk_points >= 55:
        risk_level = "high"
        suggested_actions = [
            "Consider scheduling a follow-up discussion with a qualified clinician.",
            "Monitor classroom attention patterns and provide structured support.",
            "Use shorter task blocks and clear visual instructions at home and school.",
        ]
    elif risk_points >= 30:
        risk_level = "medium"
        suggested_actions = [
            "Observe attention patterns over multiple contexts before drawing conclusions.",
            "Try structured movement breaks and reduced distractions.",
            "Share screening summary with relevant professionals if appropriate.",
        ]
    else:
        risk_level = "low"
        suggested_actions = [
            "Continue regular developmental monitoring.",
            "Maintain supportive routines for attention and task completion.",
            "Repeat screening only as part of an agreed support plan.",
        ]

    if not reasons:
        reasons.append("Task performance and gaze indicators were within expected prototype ranges.")

    explanation = " ".join(reasons) + f" {MEDICAL_DISCLAIMER}"

    # Confidence rises when more signals are available and internally consistent.
    signal_count = sum(
        [
            data.target_changes > 0,
            data.tracking_accuracy > 0,
            data.gaze_stability_score > 0,
            data.avg_reaction_time > 0,
        ]
    )
    confidence = 55 + signal_count * 8 + (100 - abs(risk_points - 50)) * 0.15
    confidence = round(_clamp(confidence, 45, 92), 1)

    return ScoringResult(
        risk_level=risk_level,
        confidence_score=confidence,
        explanation=explanation,
        suggested_actions=suggested_actions,
    )
