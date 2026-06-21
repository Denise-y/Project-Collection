"""
Authors: Minpei LIN, Zhiqian ZHANG (LLM rule parsing and text-to-heuristic conversion)
"""

import json
from typing import Dict

class RuleParser:
    """Parses raw text or JSON rules returned from LLM"""

    @staticmethod
    def _extract_json_candidate(text: str) -> str:
        """
        Best-effort extraction of a JSON object from LLM output.
        Handles common cases like ```json ... ``` fences or extra surrounding text.
        """
        if not text:
            return text
        t = text.strip()
        # Strip markdown code fences if present
        if "```" in t:
            lines = [ln.rstrip() for ln in t.splitlines()]
            in_fence = False
            kept: list[str] = []
            for ln in lines:
                if ln.strip().startswith("```"):
                    if not in_fence:
                        in_fence = True
                        continue
                    else:
                        in_fence = False
                        continue
                if in_fence:
                    kept.append(ln)
            if kept:
                t = "\n".join(kept).strip()

        # If there's still extra text, extract the first {...} block
        if "{" in t and "}" in t:
            start = t.find("{")
            end = t.rfind("}")
            if 0 <= start < end:
                t = t[start : end + 1].strip()
        return t

    def parse(self, raw_text: str) -> Dict:
        """
        Parse raw text or JSON rule from LLM into a format compatible with the new scheduler.
        
        Supports Parametric Score format and legacy preset format (type: SPT/LPT/FIFO).
        """
        try:
            # Try to parse as JSON first
            candidate = self._extract_json_candidate(raw_text)
            rule_dict = json.loads(candidate)

            # Parametric scoring rule: pass through (validated later by SafetyNet)
            if isinstance(rule_dict, dict) and str(rule_dict.get("rule_type", "")).lower() == "parametric_score":
                return rule_dict
            
            # Preset heuristic JSON: pass through as-is (validated later by SafetyNet)
            if isinstance(rule_dict, dict) and "type" in rule_dict:
                return rule_dict

            # Unknown JSON shape -> return empty to trigger SafetyNet fallback
            return {}
            
        except json.JSONDecodeError:
            # Fallback: parse from text
            text = raw_text.upper()
            if "SPT" in text or "SHORT" in text or "SHORTEST" in text:
                return {
                    "type": "SPT",
                    "description": "Shortest Processing Time"
                }
            elif "LPT" in text or "LONG" in text or "LONGEST" in text:
                return {
                    "type": "LPT",
                    "description": "Longest Processing Time"
                }
            else:
                return {
                    "type": "FIFO",
                    "description": "Fallback FIFO rule"
                }
