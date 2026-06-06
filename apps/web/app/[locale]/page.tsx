import { useTranslations } from "next-intl";
import { Button, Card } from "@yesnow/ui";

export default function HomePage() {
  const t = useTranslations("common");
  const tCal = useTranslations("calendar");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <Card variant="on-cream" className="max-w-md w-full text-center space-y-6 shadow-md">
        <div className="space-y-4">
          {/* Logo aligning with the brand identity */}
          <div className="flex justify-center items-center gap-2 select-none">
            <span className="text-primary text-3xl font-display font-bold">
              hum<span className="text-near-black">AI</span>ne
            </span>
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">
            {t("welcome")}
          </h1>
          <p className="text-near-black font-sans text-base leading-relaxed">
            Swiss service industry platform (HQ & Marketplace). We build trust and technological sophistication.
          </p>
        </div>

        <div className="border-t border-secondary/30 pt-6 flex flex-col gap-3">
          <Button variant="primary" size="md">
            {tCal("title")}
          </Button>
          <Button variant="secondary" size="md">
            {t("confirm")}
          </Button>
        </div>
      </Card>
    </main>
  );
}
