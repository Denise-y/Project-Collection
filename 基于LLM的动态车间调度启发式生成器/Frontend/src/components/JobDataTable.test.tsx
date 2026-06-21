// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

/**
 * Author: Minpei LIN (JobDataTable component tests)
 */

import { JobDataTable } from "./JobDataTable";
import type { Job, Machine } from "../types";

function setup(initialJobs?: Job[], initialMachines?: Machine[]) {
  const jobs: Job[] =
    initialJobs ??
    [
      {
        id: "Order-1",
        operations: [{ machineId: "1", duration: 30 }],
      },
    ];
  const machines: Machine[] =
    initialMachines ?? [
      { id: "1", name: "Machine A" },
      { id: "2", name: "Machine B" },
    ];

  const setJobs = vi.fn<(next: Job[]) => void>();

  render(<JobDataTable jobs={jobs} setJobs={setJobs} machines={machines} />);

  return { jobs, machines, setJobs };
}

describe("JobDataTable", () => {
  it("adds a new job when clicking Add Job", () => {
    const { jobs, setJobs } = setup();

    const addButton = screen.getByText("Add Job");
    fireEvent.click(addButton);

    expect(setJobs).toHaveBeenCalledTimes(1);
    const nextJobs = setJobs.mock.calls[0][0] as Job[];
    expect(nextJobs).toHaveLength(jobs.length + 1);
    expect(nextJobs[nextJobs.length - 1].id).toMatch(/^Order-/);
  });
});

