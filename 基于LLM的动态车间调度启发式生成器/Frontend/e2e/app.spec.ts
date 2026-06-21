import { expect, test } from "@playwright/test";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8000";

type Step = { machine: string; duration: number };
type Job = { id: string; steps: Step[] };

/** Generate a schedule payload with n jobs (3-5 steps each, 5-60 sec). For E2E we use a smaller count so the run finishes in time. */
function makeLargePayload(nJobs: number): { jobs: Job[]; goal: string } {
  const machines = ["1", "2", "3", "4", "5"];
  const jobs: Job[] = [];
  for (let i = 0; i < nJobs; i++) {
    const nSteps = 3 + (i % 3);
    const steps: Step[] = [];
    for (let s = 0; s < nSteps; s++) {
      steps.push({
        machine: machines[(i + s) % machines.length],
        duration: 5 + ((i * 7 + s) % 56),
      });
    }
    jobs.push({ id: `Job-${i + 1}`, steps });
  }
  return {
    jobs,
    goal: "Minimize makespan while avoiding long idle periods on any machine.",
  };
}

test("user can register, sign in, run a schedule, and open history", async ({ page }) => {
  const suffix = `${Date.now()}`;
  const username = `e2e_user_${suffix}`;
  const email = `${username}@example.com`;
  const password = "pass1234";
  const goal = "Prioritize jobs with the shortest processing time to minimize makespan.";

  await page.goto("/");

  await expect(page.getByText("IntelliSched")).toBeVisible();

  await page.getByRole("tab", { name: "Register" }).click();
  await page.getByLabel("Register username").fill(username);
  await page.getByLabel("Register email").fill(email);
  await page.getByLabel("Register password").fill(password);
  await page.getByLabel("Register confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByLabel("Login username")).toHaveValue(username);

  await page.getByLabel("Login password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText(`Signed in as ${username}`)).toBeVisible();

  await page.getByLabel("Optimization objective").fill(goal);
  await page.getByRole("button", { name: "Run Schedule" }).click();

  // KPI card should be visible with makespan value
  await expect(
    page.getByRole("heading", { name: "Key Performance Indicators (KPI)" })
  ).toBeVisible();
  await expect(page.getByText("seconds (Makespan)")).toBeVisible();

  // Gantt chart card should be visible
  await expect(
    page.getByRole("heading", { name: "Gantt Chart - Schedule Results" })
  ).toBeVisible();

  await page.getByRole("button", { name: "History" }).click();
  await expect(page.getByText("Schedule History")).toBeVisible();

  const firstHistoryRow = page.locator("table tbody tr").first();
  await expect(firstHistoryRow).toBeVisible();
  await firstHistoryRow.getByRole("button", { name: "Open" }).click();

  await expect(page.getByText("Stored payloads")).toBeVisible();
  await expect(page.locator("pre")).toContainText(goal);

  await page.getByRole("button", { name: "Replay in Scheduler" }).click();
  await expect(page.getByRole("button", { name: "Run Schedule" })).toBeVisible();
  await expect(page.getByLabel("Optimization objective")).toHaveValue(goal);

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

test("large job payload: submit via API then view result and gantt in UI", async ({
  page,
  request,
}) => {
  const suffix = `${Date.now()}`;
  const username = `e2e_large_${suffix}`;
  const email = `${username}@example.com`;
  const password = "pass1234";

  await page.goto("/");
  await expect(page.getByText("IntelliSched")).toBeVisible();

  await page.getByRole("tab", { name: "Register" }).click();
  await page.getByLabel("Register username").fill(username);
  await page.getByLabel("Register email").fill(email);
  await page.getByLabel("Register password").fill(password);
  await page.getByLabel("Register confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await page.getByLabel("Login password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText(`Signed in as ${username}`)).toBeVisible();

  const token = await page.evaluate(() => {
    const raw = localStorage.getItem("intellisched.auth.v1");
    return raw ? (JSON.parse(raw) as { token: string }).token : null;
  });
  expect(token).toBeTruthy();

  const payload = makeLargePayload(20);
  const res = await request.post(`${API_BASE}/api/schedule/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data: payload,
  });
  expect(res.ok()).toBeTruthy();

  await page.getByRole("button", { name: "History" }).click();
  await expect(page.getByText("Schedule History")).toBeVisible();

  const firstRow = page.locator("table tbody tr").first();
  await expect(firstRow).toBeVisible();
  await firstRow.getByRole("button", { name: "Open" }).click();

  await expect(page.getByText("Stored payloads")).toBeVisible();
  await expect(page.getByRole("button", { name: "Replay in Scheduler" })).toBeVisible();

  await page.getByRole("button", { name: "Replay in Scheduler" }).click();
  await expect(page.getByRole("button", { name: "Run Schedule" })).toBeVisible();
  // After replay, KPI and Gantt chart should appear for the large schedule as well
  await expect(
    page.getByRole("heading", { name: "Key Performance Indicators (KPI)" })
  ).toBeVisible({ timeout: 5000 });
  await expect(page.getByText("seconds (Makespan)")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Gantt Chart - Schedule Results" })
  ).toBeVisible();
});

test("login with wrong password shows error and stays on login tab", async ({ page }) => {
  const suffix = `${Date.now()}`;
  const username = `e2e_wrong_${suffix}`;
  const email = `${username}@example.com`;
  const password = "pass1234";

  await page.goto("/");
  await expect(page.getByText("IntelliSched")).toBeVisible();

  // Register a new user first
  await page.getByRole("tab", { name: "Register" }).click();
  await page.getByLabel("Register username").fill(username);
  await page.getByLabel("Register email").fill(email);
  await page.getByLabel("Register password").fill(password);
  await page.getByLabel("Register confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  // Try to login with wrong password
  await page.getByLabel("Login username").fill(username);
  await page.getByLabel("Login password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  // Expect an error message and still see the login form
  await expect(page.getByText(/incorrect username or password/i)).toBeVisible({
    timeout: 5000,
  });
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

