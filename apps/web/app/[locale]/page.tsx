"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import ConsumerBooking from "@/components/ConsumerBooking";
import MerchantCalendar from "@/components/MerchantCalendar";

export default function HomePage() {
  const t = useTranslations("common");
  const tCal = useTranslations("calendar");
  const locale = useLocale();
  const router = useRouter();

  // Tab State: "consumer" | "merchant"
  const [activeTab, setActiveTab] = useState<"consumer" | "merchant">("consumer");
  
  // Highlighting state for showing synced appointments
  const [highlightedAptId, setHighlightedAptId] = useState<string | null>(null);

  // Callback when booking is created in consumer view
  const handleBookingCreated = (appointmentId: string) => {
    // Save the ID to highlight it in the merchant calendar
    setHighlightedAptId(appointmentId);
    // Switch tab to merchant
    setActiveTab("merchant");
  };

  // Locale changer
  const handleLocaleChange = (newLocale: string) => {
    router.push(`/${newLocale}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Top Demo Explainer Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white py-2.5 px-4 text-xs font-semibold shadow-inner flex flex-col sm:flex-row items-center justify-center gap-2 select-none">
        <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
          Interactive Demo
        </span>
        <p className="text-center">
          Shared real-time state: Book an appointment on the Consumer side, and watch it instantly populate the Merchant schedule!
        </p>
      </div>

      {/* Main Navbar */}
      <header className="bg-white border-b border-gray-150 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <span className="text-blue-600 font-display font-extrabold text-2xl tracking-tighter select-none">
              yesnow<span className="text-gray-400 font-light">.ch</span>
            </span>
            <span className="hidden sm:inline-flex bg-blue-50 text-blue-700 text-xxs font-bold px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
              Swiss-Made
            </span>
          </div>

          {/* Tab Selector Buttons */}
          <div className="bg-gray-100 p-1.5 rounded-xl border border-gray-200 flex items-center shadow-inner">
            <button
              onClick={() => setActiveTab("consumer")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === "consumer"
                  ? "bg-white text-blue-600 shadow-sm font-extrabold"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              🛍 Consumer View
            </button>
            <button
              onClick={() => setActiveTab("merchant")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === "merchant"
                  ? "bg-white text-blue-600 shadow-sm font-extrabold"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              💼 Merchant HQ
            </button>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1.5">
            {["de", "fr", "it", "en"].map((l) => (
              <button
                key={l}
                onClick={() => handleLocaleChange(l)}
                className={`w-7 h-7 rounded-lg text-xxs font-bold uppercase transition-all cursor-pointer flex items-center justify-center ${
                  locale === l
                    ? "bg-gray-900 text-white shadow-md font-black"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

        </div>
      </header>

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === "consumer" ? (
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2 mb-4">
              <h1 className="text-3xl font-display font-extrabold text-gray-900 tracking-tight">
                {t("welcome")}
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                Discover local Swiss salons, spas, and barber shops. Book your appointment in seconds and pay securely with TWINT or credit cards.
              </p>
            </div>
            
            <div className="animate-in fade-in duration-300">
              <ConsumerBooking onBookingSuccess={handleBookingCreated} />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2 mb-4">
              <h1 className="text-3xl font-display font-extrabold text-gray-900 tracking-tight">
                {tCal("title")} Dashboard
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                A unified platform for Swiss service providers. Track scheduling, check in clients, handle internal notes, and manage billing POS checkout.
              </p>
            </div>

            <div className="animate-in fade-in duration-300">
              <MerchantCalendar 
                highlightedAppointmentId={highlightedAptId}
                onClearHighlight={() => setHighlightedAptId(null)}
              />
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-150 py-6 text-center text-xs text-gray-400 mt-12 font-medium select-none">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>© 2026 yesnow.ch. Swiss scheduling & POS platform.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">DE/FR/IT/EN</a>
            <span>•</span>
            <a href="#" className="hover:underline">TWINT Integrated</a>
            <span>•</span>
            <a href="#" className="hover:underline">nFADP Compliant Data</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
