/**
 * Author: Zhiqian ZHANG (frontend fallback scheduling and response transformation)
 */

import type { BackendScheduleResponse, Job, Machine, ScheduleResult } from "@/types";

export function generateSchedule(jobs: Job[], machines: Machine[]): ScheduleResult {
  const ganttData: ScheduleResult["ganttData"] = [];
  const machineEndTimes: Record<string, number> = {};

  if (machines.length === 0) {
    return {
      ganttData: [],
      makespan: 0,
      machineUtilization: 0,
      rule: {
        name: "FIFO (First In First Out)",
        description: "No machines defined",
        type: "fallback",
        code: "",
        meta: { type: "FIFO", rule_type: "fifo", description: "No machines defined" },
        raw: JSON.stringify({ type: "FIFO", description: "No machines defined" }, null, 2),
      },
    };
  }

  machines.forEach((machine) => {
    machineEndTimes[machine.id] = 0;
  });

  jobs.forEach((job) => {
    let jobStartTime = 0;

    job.operations.forEach((op, opIndex) => {
      const machineId = op.machineId;
      const startTime = Math.max(machineEndTimes[machineId] || 0, jobStartTime);
      const endTime = startTime + op.duration;

      ganttData.push({
        jobId: job.id,
        machineId,
        startTime,
        endTime,
        duration: op.duration,
        operationIndex: opIndex,
      });

      machineEndTimes[machineId] = endTime;
      jobStartTime = endTime;
    });
  });

  const values = Object.values(machineEndTimes);
  const makespan = values.length > 0 ? Math.max(...values) : 0;
  const totalMachineTime = values.reduce((a, b) => a + b, 0);
  const denominator = makespan * machines.length;
  const machineUtilization = denominator > 0 ? (totalMachineTime / denominator) * 100 : 0;

  return {
    ganttData,
    makespan,
    machineUtilization,
    rule: {
      name: "FIFO (First In First Out)",
      description: "Schedule jobs in the order they are input",
      type: "fallback",
      code: "jobs.sort((a, b) => 0); // Maintain input order",
      meta: {
        type: "FIFO",
        rule_type: "fifo",
        description: "Schedule jobs in the order they are input",
      },
      raw: JSON.stringify(
        { type: "FIFO", description: "Schedule jobs in the order they are input" },
        null,
        2
      ),
    },
  };
}

export function transformScheduleResponse(
  data: BackendScheduleResponse,
  machines: Machine[]
): ScheduleResult {
  const events = data.schedule?.events ?? [];
  const jobOperationCount: Record<string, number> = {};

  const ganttData = events.map((event) => {
    const operationIndex = jobOperationCount[event.job_id] ?? 0;
    jobOperationCount[event.job_id] = operationIndex + 1;

    return {
      jobId: event.job_id,
      machineId: event.machine,
      startTime: event.start_time,
      endTime: event.end_time,
      duration: event.end_time - event.start_time,
      operationIndex,
    };
  });

  const makespan = data.schedule?.makespan ?? 0;
  const machineTimeUsage: Record<string, number> = {};

  events.forEach((event) => {
    const duration = event.end_time - event.start_time;
    machineTimeUsage[event.machine] = (machineTimeUsage[event.machine] ?? 0) + duration;
  });

  const totalMachineTime = machines.reduce(
    (sum, machine) => sum + (machineTimeUsage[machine.id] ?? 0),
    0
  );

  const denominator = makespan * Math.max(1, machines.length);
  const machineUtilization = denominator ? (totalMachineTime / denominator) * 100 : 0;

  const ruleTypeRaw = data.parsed_rule?.type?.toUpperCase() ?? "FIFO";
  const ruleDescription =
    typeof data.parsed_rule?.description === "string" && data.parsed_rule.description.trim()
      ? data.parsed_rule.description.trim()
      : "LLM-generated scheduling heuristic";
  const isFallback =
    ruleTypeRaw === "FIFO" &&
    (ruleDescription.toLowerCase().includes("default") ||
      ruleDescription.toLowerCase().includes("fallback"));
  const isParametric =
    typeof data.parsed_rule?.rule_type === "string" &&
    data.parsed_rule.rule_type.toLowerCase() === "parametric_score";

  const summaryText = (() => {
    if (isFallback) return "Fallback FIFO rule";
    if (isParametric) {
      const explanation =
        typeof data.parsed_rule?.explanation === "string" ? data.parsed_rule.explanation.trim() : "";
      return explanation || "Parametric Score generated from objective.";
    }
    if (ruleTypeRaw === "FIFO") return "Schedule jobs in the order they arrive (FIFO).";
    if (ruleTypeRaw === "SPT") return "Prioritize tasks with the shortest processing time (SPT).";
    if (ruleTypeRaw === "LPT") return "Prioritize tasks with the longest processing time (LPT).";
    return "LLM-generated scheduling heuristic.";
  })();

  return {
    ganttData,
    makespan,
    machineUtilization,
    rule: {
      name: ruleDescription,
      description: summaryText,
      type: isFallback ? "fallback" : "llm",
      meta: data.parsed_rule,
      raw:
        typeof data.raw_rule === "string" ? data.raw_rule : JSON.stringify(data.raw_rule, null, 2),
    },
  };
}
