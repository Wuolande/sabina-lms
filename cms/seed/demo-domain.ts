/** Every demo account uses this email domain, so demo data can be found and removed in one go. */
export const DEMO_DOMAIN = "demo.sabinaedge.com";
export const isDemoEmail = (email: unknown) => typeof email === "string" && email.toLowerCase().endsWith(`@${DEMO_DOMAIN}`);
