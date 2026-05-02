"""LLM comparison payload validation (from aiper-project)."""

from __future__ import annotations

from typing import Any, Dict

SUMMARY_KEY = "Summary"
DETECTED_COMPONENTS_KEY = "DetectedComponents"
ENTRY_KEYS = {"A", "B", "Status"}
ALLOWED_STATUS = {"OK", "Different", "Missing"}
MIN_PARAMETER_KEYS = 2


def validate_llm_payload(raw: Any) -> Dict[str, Any]:
    if not isinstance(raw, dict):
        raise ValueError("LLM response must be a JSON object.")

    if SUMMARY_KEY not in raw:
        raise ValueError("Missing required key: Summary")

    summary = raw.get(SUMMARY_KEY)
    if not isinstance(summary, str):
        raise ValueError("Summary must be a string.")

    parameter_keys: list[str] = []

    for key, entry in raw.items():
        if key in {SUMMARY_KEY, DETECTED_COMPONENTS_KEY}:
            continue

        if not isinstance(key, str):
            raise ValueError("All parameter names must be strings.")

        parameter_keys.append(key)

        if not isinstance(entry, dict):
            raise ValueError(f"{key} must be an object with A, B, Status.")

        entry_keys = set(entry.keys())
        if entry_keys != ENTRY_KEYS:
            raise ValueError(f"{key} must contain exactly these keys: {sorted(ENTRY_KEYS)}")

        status = entry.get("Status")
        if not isinstance(status, str) or status not in ALLOWED_STATUS:
            raise ValueError(f"{key}.Status must be one of: {sorted(ALLOWED_STATUS)}")

        if not _is_scalar_value(entry.get("A")):
            raise ValueError(f"{key}.A must be a string or number.")
        if not _is_scalar_value(entry.get("B")):
            raise ValueError(f"{key}.B must be a string or number.")

    if len(parameter_keys) < MIN_PARAMETER_KEYS:
        raise ValueError(f"At least {MIN_PARAMETER_KEYS} parameter entries are required.")

    detected = raw.get(DETECTED_COMPONENTS_KEY)
    if detected is not None:
        if not isinstance(detected, dict):
            raise ValueError("DetectedComponents must be an object when present.")
        required = {"component_a_type", "component_b_type", "pair_key", "pair_supported"}
        missing = required.difference(detected.keys())
        if missing:
            raise ValueError(f"DetectedComponents missing required keys: {sorted(missing)}")
        if not isinstance(detected.get("component_a_type"), str):
            raise ValueError("DetectedComponents.component_a_type must be a string.")
        if not isinstance(detected.get("component_b_type"), str):
            raise ValueError("DetectedComponents.component_b_type must be a string.")
        if not isinstance(detected.get("pair_key"), str):
            raise ValueError("DetectedComponents.pair_key must be a string.")
        if not isinstance(detected.get("pair_supported"), bool):
            raise ValueError("DetectedComponents.pair_supported must be a boolean.")

    return raw


def _is_scalar_value(value: Any) -> bool:
    return isinstance(value, (str, int, float))
