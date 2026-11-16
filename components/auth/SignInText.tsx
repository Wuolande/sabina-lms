"use client";
import { createContext, useContext, type ReactNode } from "react";
import { TEXT_DEFAULTS } from "@/cms/content/text-defaults";

export type SignInText = { siteName: string; student: { badge: string; title: string; text: string; points: string[] }; tutor: { badge: string; title: string; text: string; points: string[] }; chips: { value: string; label: string }[] };

const Ctx = createContext<SignInText>({ siteName: "Sabina Education", ...TEXT_DEFAULTS.signIn });

/** Wording for the sign-in and sign-up screens, from Settings › Page wording (set by the auth layout). */
export function SignInTextProvider({ value, children }: { value: SignInText; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useSignInText = () => useContext(Ctx);
