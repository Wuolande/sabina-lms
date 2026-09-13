"use client";

import * as React from "react";

interface LogoContextType {
  logoUrl: string;
  setLogoUrl: (url: string) => void;
}

const LogoContext = React.createContext<LogoContextType>({
  logoUrl: "",
  setLogoUrl: () => {},
});

export function LogoProvider({
  initialLogoUrl = "",
  children,
}: {
  initialLogoUrl?: string;
  children: React.ReactNode;
}) {
  const [logoUrl, setLogoUrl] = React.useState<string>(initialLogoUrl);

  React.useEffect(() => {
    setLogoUrl(initialLogoUrl);
  }, [initialLogoUrl]);

  return (
    <LogoContext.Provider value={{ logoUrl, setLogoUrl }}>
      {children}
    </LogoContext.Provider>
  );
}

export function useLogo() {
  return React.useContext(LogoContext);
}
