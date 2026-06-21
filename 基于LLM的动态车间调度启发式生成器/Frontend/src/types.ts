export interface Machine {
  id: string;
  name: string;
}

export interface Operation {
  machineId: string;
  duration: number;
}

export interface Job {
  id: string;
  operations: Operation[];
}

export interface GanttTask {
  jobId: string;
  machineId: string;
  startTime: number;
  endTime: number;
  duration: number;
  operationIndex: number;
}

export interface Rule {
  name: string;
  description: string;
  type: 'llm' | 'fallback';
  code?: string;
  meta?: BackendScheduleResponse['parsed_rule'];
  raw?: string;
}

export interface ScheduleResult {
  ganttData: GanttTask[];
  makespan: number;
  machineUtilization: number;
  rule: Rule;
}

export interface BackendScheduleEvent {
  job_id: string;
  machine: string;
  start_time: number;
  end_time: number;
}

export interface BackendScheduleResponse {
  raw_rule: string;
  parsed_rule: {
    type?: string;
    rule_type?: string;
    description?: string;
    explanation?: string;
    weights?: Record<string, number>;
    [key: string]: unknown;
  };
  schedule: {
    events: BackendScheduleEvent[];
    makespan: number;
  };
}
