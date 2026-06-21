"""
Author: Zizhen WANG (LLM rule safety net and validation)
"""

from typing import Dict

class SafetyNet:
    """
    Layer 1 Safety Net: Rule Format Validation
    
    This class validates and normalizes LLM-generated heuristic rules BEFORE
    they are converted to priority functions. It ensures:
    - Backward compatibility with legacy format (type field)
    - Returns a safe fallback rule (FIFO) if validation fails
    
    Note: This is the first layer of protection. The second layer is in
    SchedulingEngine.run() which catches execution-time exceptions.
    
    See SAFETY_NET_ARCHITECTURE.md for detailed explanation of the two-layer
    safety mechanism.
    """

    _ALLOWED_PARAMETRIC_FEATURES = {
        # Uses existing Task fields + job length context (provided by SchedulingEngine)
        "urgency",  # higher means more urgent (implemented as 1 / remaining_ops)
        "inverse_processing_time",  # 1 / proc_time
        "priority",  # optional per-job priority mapping (defaults to 0)
    }

    def validate_or_fallback(self, heuristic: Dict, allowed_job_ids: set[str] | None = None) -> Dict:
        """
        Validate heuristic rule format and ensure it has required fields.
        
        This is a STATIC validation that happens BEFORE rule execution.
        It prevents format errors that would cause build_priority_fn_from_json()
        to fail.
        
        Args:
            heuristic: Dictionary containing rule information (may be incomplete)
        
        Returns:
            A complete, validated rule dictionary with all required fields,
            or a FIFO fallback if validation fails
        """
        if not heuristic:
            return {
                "rule_type": "fifo",
                "type": "FIFO",
                "description": "Default safe rule"
            }

        # Validate parametric score rules
        if str(heuristic.get("rule_type", "")).lower() == "parametric_score":
            weights = heuristic.get("weights")
            if not isinstance(weights, dict) or not weights:
                return {
                    "rule_type": "fifo",
                    "type": "FIFO",
                    "description": "Default safe rule",
                    "_safety_message": "Invalid parametric_score: missing weights. Fell back to FIFO.",
                }

            normalized: Dict[str, float] = {}
            total = 0.0
            invalid = False
            too_many = 0
            for k, v in weights.items():
                if not isinstance(k, str):
                    invalid = True
                    continue
                key = k.strip()
                if key not in self._ALLOWED_PARAMETRIC_FEATURES:
                    invalid = True
                    continue
                try:
                    fv = float(v)
                except Exception:
                    invalid = True
                    continue
                if fv < 0:
                    invalid = True
                    continue
                normalized[key] = fv
                total += fv
                too_many += 1

            if too_many > 10:
                return {
                    "rule_type": "fifo",
                    "type": "FIFO",
                    "description": "Default safe rule",
                    "_safety_message": "Invalid parametric_score: too many weights. Fell back to FIFO.",
                }

            if invalid or total <= 0:
                return {
                    "rule_type": "fifo",
                    "type": "FIFO",
                    "description": "Default safe rule",
                    "_safety_message": "Invalid parametric_score: bad weights. Fell back to FIFO.",
                }

            # Normalize weights to sum to 1 (tolerate small drift)
            drift = abs(total - 1.0)
            if drift > 1e-3:
                heuristic["_safety_message"] = (
                    f"Parametric weights normalized (sum was {total:.4f})."
                )
            heuristic["weights"] = {k: (v / total) for k, v in normalized.items()}

            # Provide a default explanation if missing/empty
            if not isinstance(heuristic.get("explanation"), str) or not heuristic.get("explanation", "").strip():
                heuristic["explanation"] = "Parametric scoring rule generated from objective."

            # Validate job_priority mapping (optional)
            jp = heuristic.get("job_priority")
            if jp is not None:
                if not isinstance(jp, dict):
                    heuristic["_safety_message"] = (
                        (heuristic.get("_safety_message") + " " if heuristic.get("_safety_message") else "")
                        + "Invalid job_priority: expected object; ignored."
                    )
                    heuristic.pop("job_priority", None)
                else:
                    filtered: Dict[str, int] = {}
                    for k, v in jp.items():
                        if not isinstance(k, str):
                            continue
                        kid = k.strip()
                        if allowed_job_ids is not None and kid not in allowed_job_ids:
                            continue
                        try:
                            iv = int(v)
                        except Exception:
                            continue
                        # clamp to 0..3
                        if iv < 0:
                            iv = 0
                        if iv > 3:
                            iv = 3
                        filtered[kid] = iv
                    heuristic["job_priority"] = filtered

            return heuristic
        
        # Legacy preset heuristic: accept as-is (builder uses type field)
        if "type" in heuristic and isinstance(heuristic.get("type"), str):
            return heuristic

        # Unknown rule format -> safe FIFO
        heuristic["type"] = "FIFO"
        heuristic["rule_type"] = "fifo"
        heuristic["description"] = heuristic.get("description") or "Default safe rule"
        return heuristic
