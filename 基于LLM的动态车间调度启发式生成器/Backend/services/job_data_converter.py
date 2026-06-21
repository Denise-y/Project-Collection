from Backend.domain.models import Job, Operation


class JobDataConverter:
    """Convert JSON input into domain Job objects"""

    def from_json(self, data: dict):
        jobs = []
        for j in data["jobs"]:
            steps = [Operation(**s) for s in j["steps"]]
            jobs.append(Job(id=j["id"], steps=steps))
        return jobs
