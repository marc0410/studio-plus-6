import { expect, test, type Page } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const emailSuffix = process.env.PLAYWRIGHT_TEST_EMAIL_SUFFIX || process.env.SEED_EMAIL_SUFFIX || "@studio-plus-dev.test";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const devProjectOnly = (() => {
  try {
    const appHost = new URL(process.env.APP_URL || "").hostname;
    return new URL(supabaseUrl || "").hostname === "yhibcwknnunpoguwekkm.supabase.co"
      && (appHost === "dev.studioplusci.com" || appHost === "localhost");
  } catch {
    return false;
  }
})();
const canAuthenticateRoles = Boolean(devProjectOnly && supabaseUrl && anonKey && serviceKey);

// Mint one-time sessions only against the known dev project. This sends no emails and changes no passwords or profiles.
async function signIn(page: Page, role: "client" | "staff" | "manager" | "admin") {
  if (!canAuthenticateRoles) throw new Error("Les scénarios de rôles exigent les identifiants du projet Supabase dev.");
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
  const email = `${role}${emailSuffix}`.toLowerCase();
  const admin = createClient(supabaseUrl!, serviceKey!, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: generated, error: generateError } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (generateError || !generated.properties.hashed_token) throw new Error(`Lien de session dev indisponible pour le rôle ${role}.`);

  const sessionCookies: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];
  const auth = createServerClient(supabaseUrl!, anonKey!, {
    cookies: {
      getAll: () => [],
      setAll: (cookies) => { sessionCookies.push(...cookies); },
    },
  });
  const { data: verified, error: verifyError } = await auth.auth.verifyOtp({ token_hash: generated.properties.hashed_token, type: "magiclink" });
  if (verifyError || !verified.session) throw new Error(`Session de test dev refusée pour le rôle ${role}.`);

  await page.context().addCookies(sessionCookies.map(({ name, value, options = {} }) => ({
    name,
    value,
    domain: new URL(baseURL).hostname,
    path: typeof options.path === "string" ? options.path : "/",
    httpOnly: options.httpOnly === true,
    secure: options.secure === true,
    sameSite: options.sameSite === "strict" ? "Strict" as const : options.sameSite === "none" ? "None" as const : "Lax" as const,
    ...(typeof options.maxAge === "number" ? { expires: Math.floor(Date.now() / 1000) + options.maxAge } : {}),
  })));
  await page.goto(role === "client" ? "/espace" : role === "staff" ? "/equipe" : "/gestion");
}

async function expectActiveLink(page: Page, navigation: string, label: string) {
  await expect(page.getByRole("navigation", { name: navigation }).getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
}

async function expectNoMobileOverflow(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflows).toBe(false);
}

test.describe("espaces par rôle — navigation et affichage", () => {
  test("les quatre hôtes locaux gardent leur domaine et servent la bonne connexion", async ({ page }) => {
    for (const [host, expectedReturn] of [
      ["app.localhost:3000", "/espace"],
      ["team.localhost:3000", "/equipe"],
      ["admin.localhost:3000", "/gestion"],
    ] as const) {
      await page.goto(`http://${host}/`);
      await expect(page).toHaveURL(new RegExp(`^http://${host}/connexion\\?return_to=`));
      await expect(page.getByLabel("Votre e-mail")).toBeVisible();
      expect(new URL(page.url()).searchParams.get("return_to")).toBe(expectedReturn);
    }
  });

  test("les quatre espaces demandent une authentification avant affichage", async ({ page }) => {
    for (const route of ["/espace", "/equipe", "/gestion", "/gestion/utilisateurs"]) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/connexion\?return_to=/);
      await expect(page.getByLabel("Votre e-mail")).toBeVisible();
    }
  });

  test("CLIENT arrive dans son espace et voit une interface claire et navigable", async ({ page }) => {
    test.skip(!canAuthenticateRoles, "Les identifiants du projet Supabase dev sont requis pour ouvrir les comptes de rôle.");
    await signIn(page, "client");
    await expect(page).toHaveURL(/\/espace(?:$|\/)/);
    const themeToggle = page.getByRole("button", { name: "Changer de thème" }).first();
    await expect(themeToggle).toBeVisible();
    const initialTheme = await page.evaluate(() => localStorage.getItem("studio-plus-portal-theme"));
    if (initialTheme === "dark") {
      await themeToggle.click();
      await expect(themeToggle).toHaveAttribute("aria-pressed", "false");
    } else {
      await expect(themeToggle).toHaveAttribute("aria-pressed", "false");
    }
    await themeToggle.click();
    await expect(themeToggle).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => page.evaluate(() => localStorage.getItem("studio-plus-portal-theme"))).toBe("dark");
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("data-portal-theme", "dark");
    await expect(page.getByRole("button", { name: "Changer de thème" }).first()).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Changer de thème" }).first().click();
    await expect(page.locator("html")).toHaveAttribute("data-portal-theme", "light");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Problème de chargement");
    await expect(page.locator(".workspace-page, .portal-page").first()).toBeVisible();
    await expectNoMobileOverflow(page);
  });

  test("STAFF accède à son agenda avec un menu actif", async ({ page }) => {
    test.skip(!canAuthenticateRoles, "Les identifiants du projet Supabase dev sont requis pour ouvrir les comptes de rôle.");
    await signIn(page, "staff");
    await expect(page.getByRole("button", { name: "Changer de thème" })).toBeVisible();
    await expect(page).toHaveURL(/\/equipe$/);
    await expect(page.getByRole("navigation", { name: "Navigation équipe" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Aujourd’hui" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    for (const [href, label] of [["/equipe/seances", "Séances"], ["/equipe/parametres", "Mon compte"]]) {
      await page.goto(href);
      await expectActiveLink(page, "Navigation équipe", label);
      await expect(page.locator("main")).toBeVisible();
    }
    await expectNoMobileOverflow(page);
  });

  test("MANAGER accède au pilotage, sans liens réservés à l’administration", async ({ page }) => {
    test.skip(!canAuthenticateRoles, "Les identifiants du projet Supabase dev sont requis pour ouvrir les comptes de rôle.");
    await signIn(page, "manager");
    await expect(page.getByRole("button", { name: "Changer de thème" })).toBeVisible();
    await expect(page).toHaveURL(/\/gestion$/);
    await expect(page.getByRole("navigation", { name: "Navigation gestion" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Vue d’ensemble" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("link", { name: "Utilisateurs" })).toHaveCount(0);
    for (const [href, label] of [["/gestion/reservations", "Réservations"], ["/gestion/statistiques", "Statistiques"], ["/gestion/emails", "E-mails"]]) {
      await page.goto(href);
      await expectActiveLink(page, "Navigation gestion", label);
      await expect(page.locator("main")).toBeVisible();
    }
    await expectNoMobileOverflow(page);
  });

  test("ADMIN accède aux utilisateurs et garde le bon état actif", async ({ page }) => {
    test.skip(!canAuthenticateRoles, "Les identifiants du projet Supabase dev sont requis pour ouvrir les comptes de rôle.");
    await signIn(page, "admin");
    await expect(page.getByRole("button", { name: "Changer de thème" })).toBeVisible();
    await page.goto("/gestion/utilisateurs");
    await expect(page.getByRole("navigation", { name: "Navigation gestion" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Utilisateurs" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goto("/gestion/reglages");
    await expectActiveLink(page, "Navigation gestion", "Réglages");
    await expect(page.locator("main")).toBeVisible();
    await expectNoMobileOverflow(page);
  });

  test("les espaces gestion et administration refusent les rôles insuffisants", async ({ page }) => {
    test.skip(!canAuthenticateRoles, "Les identifiants du projet Supabase dev sont requis pour ouvrir les comptes de rôle.");
    await signIn(page, "manager");
    await page.goto("/gestion/utilisateurs");
    await expect(page).toHaveURL(/\/non-autorise/);
    await signIn(page, "staff");
    await page.goto("/gestion");
    await expect(page).toHaveURL(/\/non-autorise/);
  });
});
