import json
import math
import sys


SKIN_FACTORS = {
    "Sensitive": 1.20,
    "Combination": 1.10,
    "Normal": 1.00,
    "Oily": 0.90,
    "Dry": 0.95,
}

LIFESTYLE_FACTORS = {
    "Indoor": 1.10,
    "Outdoor": 0.95,
}


def determine_risk(uv_index: float) -> str:
    if uv_index >= 8:
        return "High"
    if uv_index >= 5:
        return "Moderate"
    return "Low"


def compute_duration(uv_index: float, skin_factor: float, lifestyle_factor: float) -> int:
    base_duration = 25 - (uv_index * 1.5)
    adjusted = base_duration / max(0.55, skin_factor * lifestyle_factor)
    return max(10, min(45, int(round(adjusted))))


def compute_vitamin_d(uv_index: float, duration: int, skin_factor: float) -> int:
    value = uv_index * duration * skin_factor * 8
    return int(round(value))


def time_window_for_risk(risk: str) -> tuple[str, str]:
    if risk == "High":
      return ("07:30:00", "08:15:00")
    if risk == "Moderate":
      return ("08:30:00", "10:00:00")
    return ("09:00:00", "10:30:00")


def main() -> int:
    raw = sys.stdin.read().strip()
    payload = json.loads(raw) if raw else {}

    uv_index = float(payload.get("uv_index", 5.0))
    skin_type = payload.get("skin_type", "Normal")
    lifestyle = payload.get("lifestyle", "Indoor")
    requested_duration = payload.get("exposure_duration")

    skin_factor = SKIN_FACTORS.get(skin_type, 1.0)
    lifestyle_factor = LIFESTYLE_FACTORS.get(lifestyle, 1.0)
    safe_duration = compute_duration(uv_index, skin_factor, lifestyle_factor)
    exposure_duration = int(requested_duration) if requested_duration else safe_duration
    estimated_vitamin_d = compute_vitamin_d(uv_index, exposure_duration, skin_factor)
    risk_level = determine_risk(uv_index)
    recommended_start, recommended_end = time_window_for_risk(risk_level)

    result = {
        "uv_index": round(uv_index, 2),
        "skin_type": skin_type,
        "lifestyle": lifestyle,
        "safe_duration": safe_duration,
        "exposure_duration": exposure_duration,
        "estimated_vitamin_d": estimated_vitamin_d,
        "expected_vitamin_d": estimated_vitamin_d,
        "risk_level": risk_level,
        "recommended_time_start": recommended_start,
        "recommended_time_end": recommended_end,
    }

    sys.stdout.write(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
