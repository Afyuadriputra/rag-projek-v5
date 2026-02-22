import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:8000";

async function login(page: Page) {
  const resp = await page.goto(`${baseUrl}/login/`, { waitUntil: "domcontentloaded" });
  if (!resp || !resp.ok()) {
    throw new Error(`Backend not reachable at ${baseUrl}. Start Django server before running Playwright.`);
  }
  // Jika sudah auto-login/redirect ke home, lanjutkan.
  if (page.url() === `${baseUrl}/`) return;

  const usernameInput = page
    .locator('[data-testid="login-username"], input[name="username"]')
    .first();
  const passwordInput = page
    .locator('[data-testid="login-password"], input[name="password"]')
    .first();
  const submitButton = page
    .locator('[data-testid="login-submit"], button[type="submit"]')
    .first();

  const hasUiLogin = await usernameInput.isVisible({ timeout: 3000 }).catch(() => false);
  if (hasUiLogin) {
    await usernameInput.fill("mahasiswa_test");
    await passwordInput.fill("password123");
    await submitButton.click();
    await expect(page).toHaveURL(`${baseUrl}/`, { timeout: 20000 });
    return;
  }

  // Fallback: login programatik jika markup login tidak sesuai ekspektasi test.
  const csrfCookie = (await page.context().cookies(baseUrl)).find((c) => c.name === "csrftoken");
  const csrf = csrfCookie?.value || "";
  const loginResp = await page.request.post(`${baseUrl}/login/`, {
    headers: {
      "Content-Type": "application/json",
      ...(csrf ? { "X-CSRFToken": csrf } : {}),
    },
    data: {
      username: "mahasiswa_test",
      password: "password123",
    },
  });

  if (![200, 302, 303].includes(loginResp.status())) {
    throw new Error(`Programmatic login failed with status=${loginResp.status()}`);
  }

  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(`${baseUrl}/`, { timeout: 20000 });
}

test.use({ viewport: { width: 1280, height: 720 } });

test("Phase 4 flow: Chat -> Planner onboarding -> kembali Chat", async ({ page }) => {
  const chatPayloads: Array<Record<string, unknown>> = [];
  const plannerStartPayloads: Array<Record<string, unknown>> = [];

  await page.route("**/api/chat/", async (route) => {
    const reqBody = route.request().postDataJSON() as Record<string, unknown>;
    chatPayloads.push(reqBody);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        type: "chat",
        answer: "Balik ke mode chat.",
        sources: [],
        session_id: 1,
      }),
    });
  });

  await page.route("**/api/planner/start/**", async (route) => {
    const reqBody = (route.request().postDataJSON() ?? {}) as Record<string, unknown>;
    plannerStartPayloads.push(reqBody);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "success",
        planner_run_id: "run-e2e-1",
        wizard_blueprint: { version: "3", steps: [] },
        intent_candidates: [{ id: 1, label: "Rekap IPK", value: "rekap_ipk" }],
        documents_summary: [{ id: 1, title: "KHS TI.pdf" }],
        progress: { current: 1, estimated_total: 4 },
      }),
    });
  });

  await page.route("**/api/sessions/**", async (route) => {
    if (route.request().url().includes("/timeline/")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ timeline: [], pagination: { page: 1, page_size: 100, total: 0, has_next: false } }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ sessions: [], pagination: { page: 1, page_size: 20, total: 0, has_next: false } }),
    });
  });
  await page.route("**/api/documents/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        documents: [
          { id: 1, title: "KHS TI.pdf", is_embedded: true, uploaded_at: "2026-02-22 10:00", size_bytes: 1200 },
        ],
        storage: { used_bytes: 0, quota_bytes: 1024, used_pct: 0 },
      }),
    });
  });

  await login(page);

  await page.getByTestId("mode-planner").click();
  await expect(page.getByText("Setup Dokumen Planner")).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("Selesaikan langkah planner atau klik Analisis Sekarang.")).toBeVisible();

  const openPickerBtn = page.getByTestId("planner-open-doc-picker");
  if (await openPickerBtn.count()) {
    await openPickerBtn.click();
    await expect(page.getByTestId("planner-doc-picker-sheet")).toBeVisible();
    const checkbox = page.getByTestId("planner-doc-checkbox-1");
    if (await checkbox.count()) {
      await checkbox.click();
      await page.getByTestId("planner-doc-picker-confirm").click();
      await expect(page.getByText("Pilih Fokus Pertanyaan")).toBeVisible({ timeout: 15000 });
    } else {
      await page.getByTestId("planner-doc-picker-close").click();
      await expect(page.getByText("Setup Dokumen Planner")).toBeVisible();
    }
  }

  await page.getByTestId("mode-chat").click();
  await page.getByTestId("chat-input").fill("Halo mode chat");
  await page.getByTestId("chat-send").click();
  await expect(page.getByTestId("chat-thread")).toContainText("Balik ke mode chat.");

  expect(chatPayloads.some((p) => p.mode === "chat")).toBeTruthy();
  if (plannerStartPayloads.length > 0) {
    expect(plannerStartPayloads.some((p) => Array.isArray(p.reuseDocIds))).toBeTruthy();
  }
});

test("Phase 4 upload: inline + drag-drop", async ({ page }) => {
  let uploadCount = 0;

  await page.route("**/api/chat/", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ type: "chat", answer: "ok", sources: [], session_id: 1 }),
    });
  });

  await page.route("**/api/sessions/**", async (route) => {
    if (route.request().url().includes("/timeline/")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ timeline: [], pagination: { page: 1, page_size: 100, total: 0, has_next: false } }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ sessions: [], pagination: { page: 1, page_size: 20, total: 0, has_next: false } }),
    });
  });

  await page.route("**/api/documents/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        documents: uploadCount
          ? [{ id: 1, title: "KURIKULUM.pdf", is_embedded: true, uploaded_at: "2026-02-18 18:00", size_bytes: 10 }]
          : [],
        storage: { used_bytes: 0, quota_bytes: 1024, used_pct: 0 },
      }),
    });
  });

  await page.route("**/api/upload/", async (route) => {
    uploadCount += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "success", msg: "Upload OK" }),
    });
  });

  await login(page);

  await page.getByTestId("chat-upload").click();
  await page.getByTestId("upload-input").setInputFiles("e2e/fixtures/KURIKULUM.pdf");
  await expect(page.getByText("Upload OK")).toBeVisible({ timeout: 20000 });

  const dataTransfer = await page.evaluateHandle(() => {
    const dt = new DataTransfer();
    const file = new File(["dummy-pdf-content"], "KURIKULUM.pdf", { type: "application/pdf" });
    dt.items.add(file);
    return dt;
  });
  await page.getByTestId("chat-drop-target").dispatchEvent("dragover", { dataTransfer });
  await page.getByTestId("chat-drop-target").dispatchEvent("drop", { dataTransfer });

  await expect(page.getByText("Upload OK")).toBeVisible({ timeout: 20000 });
  expect(uploadCount).toBeGreaterThanOrEqual(2);
});
