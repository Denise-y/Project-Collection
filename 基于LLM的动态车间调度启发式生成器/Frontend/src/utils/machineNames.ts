/**
 * Matches backend get_machine_display_name:
 * - Numeric IDs 1..26 map to A..Z (e.g. "1" -> "Machine A")
 * - Otherwise use "Machine <id>"
 */
export function getMachineDisplayName(machineId: string): string {
  const n = parseInt(machineId, 10);
  if (!Number.isNaN(n) && n >= 1 && n <= 26) {
    return `Machine ${String.fromCharCode(64 + n)}`;
  }
  return `Machine ${machineId}`;
}
