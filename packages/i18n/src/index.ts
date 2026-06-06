import de from "../locales/de.json";
import en from "../locales/en.json";
import fr from "../locales/fr.json";
import it from "../locales/it.json";

export const locales = { de, en, fr, it } as const;
export type Locale = keyof typeof locales;
export const supportedLocales: Locale[] = ["de", "en", "fr", "it"];

export const defaultLocale: Locale = "de";

export function getTranslation(locale: Locale) {
  return locales[locale] || locales[defaultLocale];
}
