import type { ReactNode } from "react";
import { SignInTextProvider } from "@/components/auth/SignInText";
import { siteChrome, siteText } from "@/cms/content/server";

/** Gives the sign-in, sign-up and password screens their wording from the admin. */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const [text, site] = await Promise.all([siteText(), siteChrome()]);
  return <SignInTextProvider value={{ siteName: site.name, ...text.signIn }}>{children}</SignInTextProvider>;
}
