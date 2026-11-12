import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";
import { tokenFor, uniqueEmail } from "./db";

const PASSWORD = "Learn2026x";

async function register(page: Page, role: "student" | "tutor", email: string) {
  await page.goto(`/register${role === "tutor" ? "?role=tutor" : ""}`);
  await page.getByLabel("First name").fill("Test");
  await page.getByLabel("Last name").fill(role === "tutor" ? "Tutor" : "Student");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: role === "tutor" ? "Create tutor account" : "Create student account" }).click();
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
}

async function confirm(page: Page, email: string) {
  const token = await tokenFor(email, "_verificationtoken");
  expect(token, "verification token").toBeTruthy();
  await page.goto(`/verify-email?token=${token}`);
  await expect(page.getByRole("heading", { name: "You're all set" })).toBeVisible();
}

async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("student: sign up, confirm, sign in, portal, settings, password change", async ({ page }) => {
  const email = uniqueEmail("student");
  await register(page, "student", email);

  // Can't sign in before confirming.
  await login(page, email);
  await expect(page.getByRole("alert").filter({ hasText: "confirm your email" })).toBeVisible();

  await confirm(page, email);
  await login(page, email);
  await page.waitForURL("**/student");
  await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening), Test/ })).toBeVisible();

  // Students can't open the tutor portal or the admin.
  await page.goto("/tutor");
  await page.waitForURL("**/student");

  // Sections not rebuilt yet show the "being rebuilt" panel, not a broken page.
  await page.goto("/student/lessons");
  await expect(page.getByRole("heading", { name: "My lessons is being rebuilt" })).toBeVisible();

  // Settings: profile details.
  await page.goto("/student/settings");
  await page.getByLabel("Phone").fill("+254 712 345 678");
  await page.getByLabel("Country").fill("Kenya");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();

  // Settings: profile photo (Cloudflare R2 in production, local disk in development).
  const png = await sharp({ create: { width: 96, height: 96, channels: 3, background: "#14209C" } }).png().toBuffer();
  await page.locator('input[type="file"]').setInputFiles({ name: "me.png", mimeType: "image/png", buffer: png });
  await expect(page.getByRole("button", { name: "Change photo" })).toBeVisible();

  // Settings: password change, then sign in with the new password.
  await page.getByLabel("Current password").fill(PASSWORD);
  await page.getByLabel("New password").fill("Newer2026x");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByText("Password changed.")).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).last().click();
  await page.waitForURL("**/login");
  await login(page, email, "Newer2026x");
  await page.waitForURL("**/student");
});

test("tutor: sign up and land in the tutor portal", async ({ page }) => {
  const email = uniqueEmail("tutor");
  await register(page, "tutor", email);
  await confirm(page, email);
  await login(page, email);
  await page.waitForURL("**/tutor");
  await expect(page.getByText("Submit your tutor application")).toBeVisible();
  await page.goto("/student");
  await page.waitForURL("**/tutor");
});

test("forgot and reset password", async ({ page }) => {
  const email = uniqueEmail("reset");
  await register(page, "student", email);
  await confirm(page, email);

  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status").filter({ hasText: "reset link is on its way" })).toBeVisible();

  const token = await tokenFor(email, "reset_password_token");
  expect(token).toBeTruthy();
  await page.goto(`/reset-password?token=${token}`);
  await page.getByLabel("New password", { exact: true }).fill("Reset2026x");
  await page.getByLabel("Repeat new password").fill("Reset2026x");
  await page.getByRole("button", { name: "Save and sign in" }).click();
  await page.waitForURL("**/student");
});

test("signed-out visitors are sent to sign in", async ({ page }) => {
  await page.goto("/student/settings");
  await page.waitForURL(/\/login\?redirect=%2Fstudent%2Fsettings/);
});
