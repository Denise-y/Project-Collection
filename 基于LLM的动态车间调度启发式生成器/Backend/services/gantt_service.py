from Backend.domain.models import Schedule


class GanttService:
    """Build schedule visualization data.

    Author: Zizhen WANG (schedule aggregation and makespan calculation)
    """

    def build(self, schedule_data):
        makespan = max(e["end_time"] for e in schedule_data) if schedule_data else 0
        return Schedule(events=schedule_data, makespan=makespan)
