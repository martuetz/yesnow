import { useTranslations } from "next-intl";
import { Button, Card } from "@yesnow/ui";

export default function HomePage() {
  const t = useTranslations("common");
  const tCal = useTranslations("calendar");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-bg">
      <Card className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-bold tracking-tight text-gray-900">
            {t("welcome")}
          </h1>
          <p className="text-gray-500 text-sm">
            Swiss service industry platform (HQ & Marketplace)
          </p>
        </div>

        <div className="border-t border-gray-100 pt-6 flex flex-col gap-3">
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
