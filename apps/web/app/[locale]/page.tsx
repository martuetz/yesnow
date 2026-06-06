import { useTranslations } from "next-intl";
import { Button, Card } from "@yesnow/ui";

export default function HomePage() {
  const t = useTranslations("common");
  const tCal = useTranslations("calendar");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-bg">
      <Card className="max-w-md w-full text-center space-y-6">
        <div className="space-y-4">
          <div className="flex justify-center items-center gap-2 select-none">
            <span className="text-primary text-3xl font-display font-bold tracking-tight">
              yesnow
            </span>
          </div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-text-primary">
            {t("welcome")}
          </h1>
          <p className="text-text-secondary font-sans text-base leading-relaxed">
            Swiss service industry platform (HQ & Marketplace). Simple to start, powerful to grow into.
          </p>
        </div>

        <div className="border-t border-gray-150 pt-6 flex flex-col gap-3">
          <Button variant="primary" size="md">
            {tCal("title")}
          </Button>
          <Button variant="outline" size="md">
            {t("cancel")}
          </Button>
        </div>
      </Card>
    </main>
  );
}
