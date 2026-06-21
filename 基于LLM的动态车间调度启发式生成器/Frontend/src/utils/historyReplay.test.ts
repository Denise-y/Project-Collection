import { describe, expect, it } from "vitest";

/**
 * Author: Minpei LIN (history replay utility tests)
 */

import {
  buildReplayData,
  formatRuleTypeDisplay,
  inferJobsFromHistory,
  inferMachinesFromHistory,
  safeString,
  type ScheduleHistoryDetail,
} from "./historyReplay";

describe("historyReplay utils", () => {
  it("formats known rule types for display", () => {
    expect(formatRuleTypeDisplay("fifo")).toBe("FIFO (First In First Out)");
    expect(formatRuleTypeDisplay("SPT")).toBe("SPT (Shortest Processing Time)");
    expect(formatRuleTypeDisplay("parametric_score")).toBe("Parametric Score");
    expect(formatRuleTypeDisplay("custom")).toBe("custom");
    expect(formatRuleTypeDisplay(undefined)).toBe("-");
  });

  it("converts values to safe strings", () => {
    expect(safeString("abc")).toBe("abc");
    expect(safeString(null)).toBe("");
    expect(safeString({ ok: true })).toBe('{"ok":true}');
  });

  it("infers machines from request payload first and falls back to machine display names", () => {
    const detail: ScheduleHistoryDetail = {
      id: 1,
      request_payload: {
        machines: [
          { id: "2", name: "Lathe" },
          { machine_id: "3" },
        ],
      },
    };

    expect(inferMachinesFromHistory(detail)).toEqual([
      { id: "2", name: "Lathe" },
      { id: "3", name: "Machine C" },
    ]);
  });

  it("infers machines from result payload events when request payload has no machines", () => {
    const detail: ScheduleHistoryDetail = {
      id: 1,
      result_payload: {
        schedule: {
          events: [
            { machine: "2" },
            { machine: "1" },
            { machine: "2" },
          ],
        },
      },
    };

    expect(inferMachinesFromHistory(detail)).toEqual([
      { id: "1", name: "Machine A" },
      { id: "2", name: "Machine B" },
    ]);
  });

  it("normalizes jobs from history payload and drops invalid operations", () => {
    const detail: ScheduleHistoryDetail = {
      id: 1,
      request_payload: {
        jobs: [
          {
            id: "Job-1",
            steps: [
              { machine: "1", duration: 3 },
              { machine_id: "2", proc_time: 4 },
              { duration: 2 },
            ],
          },
          {
            steps: [{ machineId: "3", duration: 5 }],
          },
        ],
      },
    };

    expect(inferJobsFromHistory(detail)).toEqual([
      {
        id: "Job-1",
        operations: [
          { machineId: "1", duration: 3 },
          { machineId: "2", duration: 4 },
        ],
      },
      {
        id: "Job-2",
        operations: [{ machineId: "3", duration: 5 }],
      },
    ]);
  });

  it("builds replay data with parametric summary and derived machine utilization", () => {
    const detail: ScheduleHistoryDetail = {
      id: 1,
      goal: "Minimize makespan",
      request_payload: {
        jobs: [
          {
            id: "Job-1",
            steps: [
              { machine: "1", duration: 3 },
              { machine: "2", duration: 2 },
            ],
          },
        ],
        machines: [
          { id: "1", name: "Saw" },
          { id: "2", name: "Drill" },
        ],
      },
      result_payload: {
        raw_rule: '{"rule_type":"parametric_score"}',
        parsed_rule: {
          rule_type: "parametric_score",
          description: "Weighted objective",
          explanation: "Favor urgent work first.",
        },
        schedule: {
          makespan: 5,
          events: [
            { job_id: "Job-1", machine: "1", start_time: 0, end_time: 3 },
            { job_id: "Job-1", machine: "2", start_time: 3, end_time: 5 },
          ],
        },
      },
    };

    const replay = buildReplayData(detail);

    expect(replay.goal).toBe("Minimize makespan");
    expect(replay.machines).toEqual([
      { id: "1", name: "Saw" },
      { id: "2", name: "Drill" },
    ]);
    expect(replay.jobs).toHaveLength(1);
    expect(replay.result.makespan).toBe(5);
    expect(replay.result.machineUtilization).toBe(50);
    expect(replay.result.rule.name).toBe("Weighted objective");
    expect(replay.result.rule.description).toBe("Favor urgent work first.");
  });

  it("throws when history detail has no schedule events", () => {
    expect(() =>
      buildReplayData({
        id: 1,
        result_payload: {},
      })
    ).toThrow("This history item does not contain schedule events.");
  });
});
