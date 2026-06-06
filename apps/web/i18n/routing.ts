import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["de", "fr", "it", "en"],
  defaultLocale: "de",
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
