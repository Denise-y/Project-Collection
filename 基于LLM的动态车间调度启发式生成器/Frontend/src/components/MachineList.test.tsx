// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

/**
 * Author: Minpei LIN (MachineList component tests)
 */

import { MachineList } from "./MachineList";
import type { Machine } from "../types";

describe("MachineList", () => {
  it("calls API and adds a new machine when clicking Add Machine", async () => {
    const machines: Machine[] = [
      { id: "1", name: "Machine A" },
      { id: "2", name: "Machine B" },
    ];
    const setMachines = vi.fn<(next: Machine[]) => void>();

    const api = {
      post: vi.fn().mockResolvedValue({ id: "3", name: "Machine C" }),
      put: vi.fn(),
      del: vi.fn(),
    };

    const onRefresh = vi.fn().mockResolvedValue(machines);

    render(
      <MachineList
        machines={machines}
        setMachines={setMachines}
        apiUrl="/api/machines/"
        api={api}
        onRefresh={onRefresh}
      />
    );

    fireEvent.click(screen.getByText("Add Machine"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(1);
    });

    expect(setMachines).toHaveBeenCalledTimes(1);
    const nextMachines = setMachines.mock.calls[0][0] as Machine[];
    expect(nextMachines.some((m) => m.id === "3")).toBe(true);
  });
});

