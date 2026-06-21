import { describe, expect, it } from "vitest";

/**
 * Author: Minpei LIN (frontend scheduling utility tests)
 */

import type { BackendScheduleResponse, Job, Machine } from "@/types";

import { generateSchedule, transformScheduleResponse } from "./schedule";

describe("schedule utils", () => {
  it("returns fallback schedule when no machines are provided", () => {
    const jobs: Job[] = [
      {
        id: "Job-1",
        operations: [{ machineId: "1", duration: 3 }],
      },
    ];

    const result = generateSchedule(jobs, []);

    expect(result.ganttData).toEqual([]);
    expect(result.makespan).toBe(0);
    expect(result.machineUtilization).toBe(0);
    expect(result.rule.type).toBe("fallback");
    expect(result.rule.description).toBe("No machines defined");
  });

  it("generates deterministic FIFO fallback schedule", () => {
    const jobs: Job[] = [
      {
        id: "Job-1",
        operations: [
          { machineId: "1", duration: 3 },
          { machineId: "2", duration: 2 },
        ],
      },
      {
        id: "Job-2",
        operations: [{ machineId: "1", duration: 4 }],
      },
    ];
    const machines: Machine[] = [
      { id: "1", name: "Machine A" },
      { id: "2", name: "Machine B" },
    ];

    const result = generateSchedule(jobs, machines);

    expect(result.ganttData).toEqual([
      {
        jobId: "Job-1",
        machineId: "1",
        startTime: 0,
        endTime: 3,
        duration: 3,
        operationIndex: 0,
      },
      {
        jobId: "Job-1",
        machineId: "2",
        startTime: 3,
        endTime: 5,
        duration: 2,
        operationIndex: 1,
      },
      {
        jobId: "Job-2",
        machineId: "1",
        startTime: 3,
        endTime: 7,
        duration: 4,
        operationIndex: 0,
      },
    ]);
    expect(result.makespan).toBe(7);
    expect(result.machineUtilization).toBeCloseTo(85.7142857);
    expect(result.rule.type).toBe("fallback");
  });

  it("transforms backend response into schedule result for fallback FIFO rules", () => {
    const response: BackendScheduleResponse = {
      raw_rule: '{"type":"FIFO"}',
      parsed_rule: {
        type: "FIFO",
        description: "Default safe rule",
      },
      schedule: {
        makespan: 5,
        events: [
          { job_id: "Job-1", machine: "1", start_time: 0, end_time: 3 },
          { job_id: "Job-1", machine: "2", start_time: 3, end_time: 5 },
        ],
      },
    };
    const machines: Machine[] = [
      { id: "1", name: "Machine A" },
      { id: "2", name: "Machine B" },
    ];

    const result = transformScheduleResponse(response, machines);

    expect(result.ganttData).toHaveLength(2);
    expect(result.machineUtilization).toBe(50);
    expect(result.rule.type).toBe("fallback");
    expect(result.rule.description).toBe("Fallback FIFO rule");
    expect(result.rule.raw).toBe('{"type":"FIFO"}');
  });

  it("uses parametric explanation and stringifies raw object rules", () => {
    const response: BackendScheduleResponse = {
      raw_rule: { complex: true } as unknown as string,
      parsed_rule: {
        type: "FIFO",
        rule_type: "parametric_score",
        description: "Weighted score",
        explanation: "Prefer urgent short jobs.",
      },
      schedule: {
        makespan: 4,
        events: [{ job_id: "Job-1", machine: "1", start_time: 0, end_time: 4 }],
      },
    };
    const machines: Machine[] = [{ id: "1", name: "Machine A" }];

    const result = transformScheduleResponse(response, machines);

    expect(result.rule.type).toBe("llm");
    expect(result.rule.description).toBe("Prefer urgent short jobs.");
    expect(result.rule.raw).toBe('{\n  "complex": true\n}');
  });
});
