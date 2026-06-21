"""
Authors: Minpei LIN, Zhiqian ZHANG (LLM client and scheduling prompt design)
"""

import requests

from Backend.config import DEFAULT_RULE, LLM_API_KEY, LLM_MODEL, LLM_URL


def _default_rule_json(description: str) -> str:
    return (
        "{"
        f"\"type\": \"{DEFAULT_RULE}\", "
        f"\"description\": \"{description}\""
        "}"
    )

class LLMClient:
    """Handles communication with the LLM API"""

    def generate_rule(self, goal: str, job_ids: list[str] | None = None) -> str:
        """Generate scheduling rule text based on user goal"""
        try:
            if not LLM_API_KEY:
                print("LLM API key not configured; using default safe rule.")
                return _default_rule_json("Default safe rule (LLM API key not configured)")

            print("Calling LLM with goal:", goal)
            job_ids = job_ids or []
            response = requests.post(
                LLM_URL,
                headers={
                    "Authorization": f"Bearer {LLM_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": LLM_MODEL,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are an expert in production scheduling.\n"
                                "Return ONLY a single JSON object (no markdown, no extra text).\n"
                                "You MUST choose exactly ONE of the following strategies:\n"
                                "- A) Preset heuristic (FIFO / SPT / LPT) for simple, single-factor goals, OR\n"
                                "- B) Parametric Score for multi-objective goals or when per-job priority tiers matter, OR\n"
                                "- C) Fallback FIFO only if the goal is too vague.\n"
                                "\n"
                                "Allowed features (keys in weights):\n"
                                "- urgency: higher means more urgent (system-defined)\n"
                                "- inverse_processing_time: 1/processing_time (system-defined)\n"
                                "- priority: per-job priority (provided via job_priority map)\n"
                                "\n"
                                "Allowed output schemas (choose ONE):\n"
                                "\n"
                                "A) Preset heuristic (recommended for simple goals):\n"
                                "{\n"
                                "  \"type\": \"FIFO\" | \"SPT\" | \"LPT\",\n"
                                "  \"description\": \"...\"\n"
                                "}\n"
                                "\n"
                                "B) Parametric Score (recommended for complex goals):\n"
                                "{\n"
                                "  \"rule_type\": \"parametric_score\",\n"
                                "  \"weights\": {\"urgency\": 0.0, \"inverse_processing_time\": 0.0, \"priority\": 0.0},\n"
                                "  \"job_priority\": {\"<job_id>\": 0, \"<job_id>\": 3},\n"
                                "  \"explanation\": \"...\"\n"
                                "}\n"
                                "\n"
                                "C) Fallback FIFO (only if nothing else applies):\n"
                                "{\n"
                                "  \"rule_type\": \"fifo\",\n"
                                "  \"type\": \"FIFO\",\n"
                                "  \"description\": \"...\"\n"
                                "}\n"
                                "\n"
                                "Constraints:\n"
                                "- If you choose preset heuristic, ALWAYS set \"type\" to exactly FIFO/SPT/LPT\n"
                                "- weights must be non-negative numbers\n"
                                "- weights must sum to 1 (small floating error ok)\n"
                                "- include at least 2 features in weights unless the goal clearly implies a single factor\n"
                                "- Only use job_priority when the goal explicitly mentions multiple priority tiers (e.g. VIP vs normal, urgent vs non-urgent). If the goal does not describe tiers, you MUST omit the job_priority field entirely.\n"
                                "- Never invent VIP or priority tiers when the goal does not mention them. When priorities are not clearly specified, treat all jobs as having the same priority and DO NOT output job_priority.\n"
                                "- If you do use job_priority, keys MUST be chosen from the provided job list, and values must be integers 0..3 (0=normal, 1=important, 2=urgent, 3=VIP).\n"
                                "- job_priority defines schedule phases: jobs with the same value run in the same phase; higher value is scheduled earlier. Use 2–4 distinct values only when the goal has multiple priority levels.\n"
                                "- do NOT output any Python code\n"
                            )
                        },
                        {
                            "role": "user",
                            "content": f"Goal: {goal}\nJobs: {job_ids}"
                        }
                    ],
                    "temperature": 0.2
                },
                timeout=30
            )

        
            print("LLM raw response:", response.text[:200])

            data = response.json()
            if "choices" not in data:
                print("LLM API error:", data)
                return _default_rule_json("Fallback rule")
            return data["choices"][0]["message"]["content"]

        except Exception as e:
            print("LLM error:", str(e))
            return _default_rule_json("Default safe rule")

    def quick_test(self, prompt: str):
        """Simplified test call returning only the text output"""
        try:
            response = requests.post(
                LLM_URL,
                headers={
                    "Authorization": f"Bearer {LLM_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": LLM_MODEL,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ]
                },
                timeout=10
            )
            data = response.json()
            if "choices" not in data:
                return f"API error: {data}"
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            return f"Error: {str(e)}"
