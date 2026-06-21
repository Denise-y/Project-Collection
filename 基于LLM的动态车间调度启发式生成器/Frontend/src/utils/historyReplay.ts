/**
 * Author: Zhiqian ZHANG (history replay utilities and schedule reconstruction)
 */

import type { BackendScheduleResponse, Job, Machine, ScheduleResult } from "@/types";

import { getMachineDisplayName } from "@/utils/machineNames";

export type ScheduleHistorySummary = {
  id: string | number;
  created_at?: string;
  goal?: string;
  title?: string;
  rule_type?: string;
  status?: string;
  makespan?: number;
  machine_utilization?: number;
};

export type ScheduleHistoryDetail = {
  id: string | number;
  created_at?: string;
  goal?: string;
  title?: string;
  rule_type?: string;
  status?: string;
  request_payload?: unknown;
  result_payload?: unknown;
};

export function formatRuleTypeDisplay(ruleType: unknown) {
  const raw = typeof ruleType === "string" ? ruleType.trim() : "";
  if (!raw) return "-";
  const upper = raw.toUpperCase();
  if (upper === "FIFO" || raw.toLowerCase() === "fifo") return "FIFO (First In First Out)";
  if (upper === "SPT" || raw.toLowerCase() === "spt") return "SPT (Shortest Processing Time)";
  if (upper === "LPT" || raw.toLowerCase() === "lpt") return "LPT (Longest Processing Time)";
  if (raw.toLowerCase() === "parametric_score") return "Parametric Score";
  return raw;
}

export function safeString(v: unknown) {
  if (typeof v === "string") return v;
  if (v == null) return "";
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export function inferMachinesFromHistory(detail: ScheduleHistoryDetail): Machine[] {
  const requestPayload = detail.request_payload as {
    machines?: Array<{ id?: unknown; machine_id?: unknown; machine?: unknown; name?: unknown }>;
  };
  const machines = Array.isArray(requestPayload?.machines) ? requestPayload.machines : undefined;
  if (Array.isArray(machines) && machines.length) {
    return machines
      .map((m) => {
        const id = String(m.id ?? m.machine_id ?? m.machine ?? "");
        return { id, name: m.name ? String(m.name) : getMachineDisplayName(id) };
      })
      .filter((m): m is Machine => Boolean(m.id));
  }

  const resultPayload = detail.result_payload as {
    schedule?: { events?: Array<{ machine?: unknown }> };
  };
  const events = Array.isArray(resultPayload?.schedule?.events) ? resultPayload.schedule.events : [];
  const ids = new Set<string>();
  for (const event of events) {
    if (event?.machine != null) ids.add(String(event.machine));
  }
  return Array.from(ids)
    .sort()
    .map((id) => ({ id, name: getMachineDisplayName(id) }));
}

export function inferJobsFromHistory(detail: ScheduleHistoryDetail): Job[] {
  const requestPayload = detail.request_payload as {
    jobs?: Array<{
      id?: unknown;
      steps?: Array<{
        machine?: unknown;
        machine_id?: unknown;
        machineId?: unknown;
        duration?: unknown;
        proc_time?: unknown;
      }>;
    }>;
  };
  const jobs = Array.isArray(requestPayload?.jobs) ? requestPayload.jobs : [];
  if (!Array.isArray(jobs)) return [];

  return jobs
    .map((job, idx): Job => {
      const rawOps = Array.isArray(job?.steps) ? job.steps : [];
      const operations = rawOps
        .map((step) => {
          const machineId = String(step?.machine ?? step?.machine_id ?? step?.machineId ?? "");
          const duration = Number(step?.duration ?? step?.proc_time ?? 0) || 0;
          if (!machineId) return null;
          return { machineId, duration };
        })
        .filter((op): op is Job["operations"][number] => op !== null);

      const id = String(job?.id ?? `Job-${idx + 1}`);
      return { id, operations };
    })
    .filter((job) => job.operations.length > 0);
}

export function buildReplayData(detail: ScheduleHistoryDetail): {
  result: ScheduleResult;
  machines: Machine[];
  jobs: Job[];
  goal: string;
} {
  const raw = detail.result_payload as BackendScheduleResponse;
  const anyRaw = raw as BackendScheduleResponse & {
    parsed_rule?: { type?: string; rule_type?: string; description?: string; explanation?: string };
  };

  if (!anyRaw?.schedule?.events) {
    throw new Error("This history item does not contain schedule events.");
  }

  const machines = inferMachinesFromHistory(detail);
  const jobs = inferJobsFromHistory(detail);
  const goal = detail.goal ?? "";
  const events = anyRaw.schedule.events ?? [];
  const jobOperationCount: Record<string, number> = {};

  const ganttData = events.map((event) => {
    const operationIndex = jobOperationCount[event.job_id] ?? 0;
    jobOperationCount[event.job_id] = operationIndex + 1;
    return {
      jobId: String(event.job_id),
      machineId: String(event.machine),
      startTime: Number(event.start_time),
      endTime: Number(event.end_time),
      duration: Number(event.end_time) - Number(event.start_time),
      operationIndex,
    };
  });

  const makespan = Number(anyRaw.schedule.makespan ?? 0);
  const machineTimeUsage: Record<string, number> = {};
  for (const event of events) {
    const duration = Number(event.end_time) - Number(event.start_time);
    const machineId = String(event.machine);
    machineTimeUsage[machineId] = (machineTimeUsage[machineId] ?? 0) + duration;
  }
  const totalMachineTime = machines.reduce(
    (sum, machine) => sum + (machineTimeUsage[machine.id] ?? 0),
    0
  );
  const denominator = makespan * Math.max(1, machines.length);
  const machineUtilization = denominator ? (totalMachineTime / denominator) * 100 : 0;

  const ruleDescription =
    typeof anyRaw.parsed_rule?.description === "string" && anyRaw.parsed_rule.description.trim()
      ? anyRaw.parsed_rule.description.trim()
      : "LLM-generated scheduling heuristic";
  const isParametric =
    typeof anyRaw.parsed_rule?.rule_type === "string" &&
    anyRaw.parsed_rule.rule_type.toLowerCase() === "parametric_score";
  const summaryText = (() => {
    const ruleType = typeof anyRaw.parsed_rule?.type === "string" ? anyRaw.parsed_rule.type.toUpperCase() : "";
    if (isParametric) {
      const explanation =
        typeof anyRaw.parsed_rule?.explanation === "string"
          ? anyRaw.parsed_rule.explanation.trim()
          : "";
      return explanation || "Parametric Score generated from objective.";
    }
    if (ruleType === "FIFO") return "Schedule jobs in the order they arrive (FIFO).";
    if (ruleType === "SPT") return "Prioritize tasks with the shortest processing time (SPT).";
    if (ruleType === "LPT") return "Prioritize tasks with the longest processing time (LPT).";
    return "LLM-generated scheduling heuristic.";
  })();

  return {
    result: {
      ganttData,
      makespan,
      machineUtilization,
      rule: {
        name: ruleDescription,
        description: summaryText,
        type: "llm",
        meta: anyRaw.parsed_rule,
        raw:
          typeof anyRaw.raw_rule === "string"
            ? anyRaw.raw_rule
            : JSON.stringify(anyRaw.raw_rule, null, 2),
      },
    },
    machines,
    jobs,
    goal,
  };
}
