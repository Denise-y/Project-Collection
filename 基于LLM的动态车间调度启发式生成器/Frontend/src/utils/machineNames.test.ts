import { describe, expect, it } from "vitest";

/**
 * Author: Minpei LIN (machine name utility tests)
 */

import { getMachineDisplayName } from "./machineNames";

describe("getMachineDisplayName", () => {
  it("maps numeric ids in range 1..26 to alphabetic machine names", () => {
    expect(getMachineDisplayName("1")).toBe("Machine A");
    expect(getMachineDisplayName("26")).toBe("Machine Z");
  });

  it("falls back to the raw identifier for out-of-range or non-numeric ids", () => {
    expect(getMachineDisplayName("27")).toBe("Machine 27");
    expect(getMachineDisplayName("CNC-1")).toBe("Machine CNC-1");
  });
});
