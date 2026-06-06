"use client";

import React, { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import { useDemoStore, Service, Staff, Appointment } from "../store/demoStore";

interface ConsumerBookingProps {
  onBookingSuccess?: (appointmentId: string) => void;
}

export default function ConsumerBooking({ onBookingSuccess }: ConsumerBookingProps) {
  const locale = useLocale() as "en" | "de" | "fr" | "it";
  const { services, staff, appointments, addAppointment } = useDemoStore();

  // Booking Wizard State
  const [step, setStep] = useState<number>(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null); // "any" or staff.id
  
  // Date State - Default to today
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  });

  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  // Customer Details
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientNotes, setClientNotes] = useState("");

  // Payment Details
  const [paymentMethod, setPaymentMethod] = useState<"twint" | "card" | null>(null);
  const [paymentStep, setPaymentStep] = useState<"select" | "processing" | "twint-qr">("select");
  const [twintTimer, setTwintTimer] = useState<NodeJS.Timeout | null>(null);

  // Card details
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  // Created appointment tracking
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

  // Active Service Details
  const selectedService = useMemo(() => {
    return services.find((s) => s.id === selectedServiceId) || null;
  }, [services, selectedServiceId]);

  // Generate 7 upcoming days for the date selector
  const daysList = useMemo(() => {
    const list = [];
    const weekdayNames = {
      en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      de: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
      fr: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
      it: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"],
    };
    
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      list.push({
        dateString: dateStr,
        dayOfMonth: d.getDate(),
        dayOfWeek: weekdayNames[locale][d.getDay()],
        isToday: i === 0,
      });
    }
    return list;
  }, [locale]);

  // Generate time slots (every 30 mins, 08:00 - 18:30)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      slots.push(`${String(hour).padStart(2, "0")}:00`);
      if (hour !== 18) {
        slots.push(`${String(hour).padStart(2, "0")}:30`);
      }
    }
    return slots;
  }, []);

  // Helper to check if a specific staff member is available at a specific date & time for a given service duration
  const checkStaffAvailable = (staffId: string, dateStr: string, timeStr: string, durationMin: number) => {
    // Construct proposed slot start and end dates
    const [hours, minutes] = timeStr.split(":").map(Number);
    const slotStart = new Date(dateStr);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + durationMin * 60000);

    // Check against all active appointments
    const overlapping = appointments.filter((apt) => {
      if (apt.staffId !== staffId) return false;
      if (apt.status === "cancelled") return false;

      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);

      // Overlap logic: StartA < EndB && StartB < EndA
      return slotStart < aptEnd && aptStart < slotEnd;
    });

    return overlapping.length === 0;
  };

  // Determine availability status for each time slot
  const slotAvailability = useMemo(() => {
    if (!selectedService) return {};
    
    const availability: Record<string, { available: boolean; assignedStaffId?: string }> = {};

    timeSlots.forEach((slot) => {
      if (selectedStaffId && selectedStaffId !== "any") {
        const isFree = checkStaffAvailable(selectedStaffId, selectedDate, slot, selectedService.duration);
        availability[slot] = { available: isFree, assignedStaffId: selectedStaffId };
      } else {
        // "Any staff" selected. Find first available staff member
        const freeStaff = staff.find((member) => 
          checkStaffAvailable(member.id, selectedDate, slot, selectedService.duration)
        );
        
        availability[slot] = {
          available: !!freeStaff,
          assignedStaffId: freeStaff?.id,
        };
      }
    });

    return availability;
  }, [selectedService, selectedDate, selectedStaffId, staff, appointments, timeSlots]);

  // Actions
  const handleServiceSelect = (id: string) => {
    setSelectedServiceId(id);
    setStep(2);
  };

  const handleStaffSelect = (id: string) => {
    setSelectedStaffId(id);
    setSelectedTime(null);
    setStep(3);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(4);
    // Pre-populate mock details to ease testing
    if (!clientName) {
      setClientName("Marc Lehmann");
      setClientEmail("marc.lehmann@bluewin.ch");
      setClientPhone("+41 79 482 19 88");
      setClientNotes("Prefer German/English. Looking forward!");
    }
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !clientPhone) return;
    setStep(5);
  };

  const simulatePayment = () => {
    if (!selectedService || !selectedTime) return;

    setPaymentStep("processing");

    // Simulate delay
    setTimeout(() => {
      // Find final staff ID
      let finalStaffId = selectedStaffId;
      if (selectedStaffId === "any" || !selectedStaffId) {
        // Get the assigned staff ID from slotAvailability
        finalStaffId = slotAvailability[selectedTime]?.assignedStaffId || staff[0].id;
      }

      // Calculate start and end ISO times
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const start = new Date(selectedDate);
      start.setHours(hours, minutes, 0, 0);
      const end = new Date(start.getTime() + selectedService.duration * 60000);

      const aptData = {
        clientName,
        clientEmail,
        clientPhone,
        serviceId: selectedService.id,
        staffId: finalStaffId!,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        price: selectedService.price,
        notes: clientNotes,
      };

      const newApt = addAppointment(aptData);
      setCreatedAppointment(newApt);
      setStep(6);
    }, 2000);
  };

  const startTwintFlow = () => {
    setPaymentMethod("twint");
    setPaymentStep("twint-qr");

    // Auto approve TWINT after 4 seconds if they don't click manually
    const timer = setTimeout(() => {
      simulatePayment();
    }, 4000);
    setTwintTimer(timer);
  };

  const cancelTwintFlow = () => {
    if (twintTimer) {
      clearTimeout(twintTimer);
      setTwintTimer(null);
    }
    setPaymentStep("select");
    setPaymentMethod(null);
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentMethod("card");
    simulatePayment();
  };

  const handleReset = () => {
    setStep(1);
    setSelectedServiceId(null);
    setSelectedStaffId(null);
    setSelectedTime(null);
    setPaymentMethod(null);
    setPaymentStep("select");
    setCreatedAppointment(null);
  };

  const handleGoToCalendar = () => {
    if (onBookingSuccess && createdAppointment) {
      onBookingSuccess(createdAppointment.id);
    }
  };

  // Label translations helper
  const t = {
    service: { en: "Select Service", de: "Service auswählen", fr: "Choisir un service", it: "Seleziona servizio" },
    staff: { en: "Choose Stylist", de: "Mitarbeiter wählen", fr: "Choisir un styliste", it: "Scegli lo stilista" },
    time: { en: "Date & Time", de: "Datum & Uhrzeit", fr: "Date & Heure", it: "Data e Ora" },
    details: { en: "Your Details", de: "Ihre Angaben", fr: "Vos coordonnées", it: "I tuoi dati" },
    payment: { en: "Payment", de: "Zahlung", fr: "Paiement", it: "Pagamento" },
    success: { en: "Confirmed!", de: "Bestätigt!", fr: "Confirmé !", it: "Confermato !" },
    back: { en: "Back", de: "Zurück", fr: "Retour", it: "Indietro" },
    anyStaff: { en: "Any available stylist", de: "Beliebiger Mitarbeiter", fr: "N'importe quel styliste", it: "Qualsiasi stilista" },
    anyStaffSub: { en: "Faster booking availability", de: "Schnellere Terminverfügbarkeit", fr: "Disponibilité plus rapide", it: "Maggiore disponibilità" },
    duration: { en: "min", de: "Min", fr: "min", it: "min" },
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-gray-150 overflow-hidden font-sans">
      {/* Marketplace Shop Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-6 text-white relative">
        <div className="flex justify-between items-start">
          <div>
            <span className="bg-blue-500/30 text-blue-100 text-xs px-2.5 py-1 rounded-full font-medium tracking-wide uppercase">
              Zürich Center
            </span>
            <h2 className="text-2xl font-bold tracking-tight mt-2 font-display">Salon Bellezza</h2>
            <p className="text-blue-100/90 text-sm mt-1 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Bahnhofstrasse 84, 8001 Zürich
            </p>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm text-right">
            <span className="text-amber-300 font-bold">★ 4.9</span>
            <span className="text-white/80 text-xs block">124 reviews</span>
          </div>
        </div>

        {/* Wizard Progress Bar */}
        <div className="mt-8 flex items-center justify-between text-xs font-semibold text-blue-200">
          {[1, 2, 3, 4, 5, 6].map((s) => {
            const stepLabels = [t.service[locale], t.staff[locale], t.time[locale], t.details[locale], t.payment[locale], t.success[locale]];
            const isActive = step === s;
            const isCompleted = step > s;
            return (
              <div key={s} className="flex flex-col items-center flex-1 relative">
                {/* Connector Line */}
                {s > 1 && (
                  <div 
                    className={`absolute right-1/2 left-[-50%] top-3 h-0.5 -translate-y-1/2 z-0 transition-colors duration-300 ${
                      isCompleted ? "bg-white" : "bg-blue-500/50"
                    }`}
                  />
                )}
                
                <span 
                  className={`w-6.5 h-6.5 rounded-full flex items-center justify-center font-bold text-xs border-2 z-10 transition-all duration-300 ${
                    isActive 
                      ? "bg-white text-blue-600 border-white scale-110 shadow-md" 
                      : isCompleted 
                        ? "bg-blue-100 text-blue-600 border-blue-100" 
                        : "bg-blue-700 text-blue-300 border-blue-500"
                  }`}
                >
                  {isCompleted ? "✓" : s}
                </span>
                <span className={`mt-1.5 hidden sm:block ${isActive ? "text-white" : "text-blue-200/70"}`}>
                  {stepLabels[s - 1]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wizard Step Content */}
      <div className="p-6 min-h-[400px]">
        {/* STEP 1: Select Service */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 font-display flex items-center gap-2">
              <span className="w-1.5 h-4 bg-primary rounded-full"></span>
              {t.service[locale]}
            </h3>
            
            <div className="grid gap-3">
              {services.map((service) => (
                <div 
                  key={service.id}
                  onClick={() => handleServiceSelect(service.id)}
                  className="group p-4 bg-white hover:bg-gray-50 border border-gray-200 hover:border-blue-300 rounded-xl transition-all duration-200 cursor-pointer flex justify-between items-center shadow-sm"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wide">
                      {service.category}
                    </span>
                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {service.name[locale] || service.name["en"]}
                    </h4>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {service.duration} {t.duration[locale]}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900">
                      CHF {service.price.toFixed(2)}
                    </span>
                    <span className="block text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Book Now →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Select Staff */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 font-display flex items-center gap-2">
                <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                {t.staff[locale]}
              </h3>
              <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 font-medium">
                ← {t.back[locale]}
              </button>
            </div>

            <div className="grid gap-3">
              {/* Option: Any Staff */}
              <div 
                onClick={() => handleStaffSelect("any")}
                className="p-4 bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 hover:border-blue-300 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-4 shadow-sm"
              >
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg border border-blue-200">
                  ★
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{t.anyStaff[locale]}</h4>
                  <p className="text-sm text-gray-500">{t.anyStaffSub[locale]}</p>
                </div>
                <div className="ml-auto text-blue-600 font-bold">→</div>
              </div>

              {/* Individual staff */}
              {staff.map((member) => (
                <div 
                  key={member.id}
                  onClick={() => handleStaffSelect(member.id)}
                  className="p-4 bg-white hover:bg-gray-50 border border-gray-200 hover:border-blue-300 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-4 shadow-sm"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-base ${
                    member.color === "staff-1" ? "bg-blue-600" :
                    member.color === "staff-2" ? "bg-purple-600" : "bg-pink-600"
                  }`}>
                    {member.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{member.name}</h4>
                    <p className="text-sm text-gray-500">{member.title}</p>
                  </div>
                  <div className="ml-auto text-blue-600 font-bold">→</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Date & Time Picker */}
        {step === 3 && selectedService && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 font-display flex items-center gap-2">
                <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                {t.time[locale]}
              </h3>
              <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 font-medium">
                ← {t.back[locale]}
              </button>
            </div>

            {/* Selected Booking Summary Bar */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-150 flex items-center justify-between text-sm">
              <div>
                <span className="text-gray-500">Service:</span>{" "}
                <strong className="text-gray-900">{selectedService.name[locale]}</strong>
              </div>
              <div>
                <span className="text-gray-500">Stylist:</span>{" "}
                <strong className="text-gray-900">
                  {selectedStaffId === "any" ? t.anyStaff[locale] : staff.find(s => s.id === selectedStaffId)?.name}
                </strong>
              </div>
            </div>

            {/* Horizontal Date Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Select Date
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {daysList.map((day) => (
                  <button
                    key={day.dateString}
                    onClick={() => {
                      setSelectedDate(day.dateString);
                      setSelectedTime(null);
                    }}
                    type="button"
                    className={`flex-1 min-w-[70px] py-3 px-2 rounded-xl flex flex-col items-center justify-center border transition-all ${
                      selectedDate === day.dateString
                        ? "bg-primary border-primary text-white shadow-md scale-105"
                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-xs uppercase font-bold opacity-80">{day.dayOfWeek}</span>
                    <span className="text-lg font-bold mt-1">{day.dayOfMonth}</span>
                    {day.isToday && (
                      <span className={`text-[9px] px-1 py-0.5 rounded-full mt-1 uppercase font-bold ${
                        selectedDate === day.dateString ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"
                      }`}>
                        Today
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Grid Selector */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                  Available Times
                </label>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-white border border-gray-200 rounded"></span> Available
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-gray-100 border border-gray-200 rounded"></span> Booked
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((slot) => {
                  const info = slotAvailability[slot] || { available: false };
                  const isSelected = selectedTime === slot;
                  
                  return (
                    <button
                      key={slot}
                      onClick={() => info.available && handleTimeSelect(slot)}
                      disabled={!info.available}
                      type="button"
                      className={`py-3 text-sm font-semibold rounded-lg border text-center transition-all ${
                        !info.available
                          ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed line-through"
                          : isSelected
                            ? "bg-primary border-primary text-white shadow-md scale-102"
                            : "bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Client Info */}
        {step === 4 && selectedService && selectedTime && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 font-display flex items-center gap-2">
                <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                {t.details[locale]}
              </h3>
              <button onClick={() => setStep(3)} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 font-medium">
                ← {t.back[locale]}
              </button>
            </div>

            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Marc Lehmann"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 font-medium text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="e.g. +41 79 123 45 67"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 font-medium text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="e.g. name@domain.ch"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 font-medium text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  Special Notes / Requests (Optional)
                </label>
                <textarea
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any specific requests..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 font-medium text-sm resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors cursor-pointer shadow-md"
                >
                  Continue to Payment
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 5: Payment */}
        {step === 5 && selectedService && selectedTime && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 font-display flex items-center gap-2">
                <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                {t.payment[locale]}
              </h3>
              <button onClick={() => setStep(4)} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 font-medium">
                ← {t.back[locale]}
              </button>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Booking Summary</h4>
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-gray-900">{selectedService.name[locale]}</span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    with {selectedStaffId === "any" ? t.anyStaff[locale] : staff.find(s => s.id === selectedStaffId)?.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    🗓 {selectedDate} at {selectedTime} ({selectedService.duration} min)
                  </p>
                </div>
                <span className="font-bold text-gray-900 text-lg">CHF {selectedService.price.toFixed(2)}</span>
              </div>
            </div>

            {paymentStep === "select" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Select your preferred payment method. Payment is simulated for demo purposes.</p>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* TWINT Button */}
                  <button
                    onClick={startTwintFlow}
                    className="p-5 border-2 border-gray-200 hover:border-green-500 rounded-xl bg-white flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                      {/* TWINT stylized letters */}
                      <span className="text-green-600 font-extrabold text-lg tracking-tighter">TWINT</span>
                    </div>
                    <div>
                      <span className="block font-bold text-gray-900">Pay with TWINT</span>
                      <span className="block text-xs text-gray-500 mt-0.5">Swiss Direct Mobile</span>
                    </div>
                  </button>

                  {/* Credit Card Button */}
                  <button
                    onClick={() => {
                      setPaymentMethod("card");
                      setPaymentStep("processing"); // Immediately prompt credit card form
                    }}
                    className="p-5 border-2 border-gray-200 hover:border-blue-500 rounded-xl bg-white flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                      <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <span className="block font-bold text-gray-900">Credit Card</span>
                      <span className="block text-xs text-gray-500 mt-0.5">Visa, Mastercard</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* TWINT QR Flow */}
            {paymentStep === "twint-qr" && (
              <div className="flex flex-col items-center justify-center text-center py-6 space-y-4">
                <div className="bg-green-50 p-4 rounded-2xl border border-green-200 relative">
                  {/* Mock QR Code */}
                  <div className="w-40 h-40 bg-white border border-gray-200 rounded-xl p-2 flex items-center justify-center relative overflow-hidden">
                    {/* Pulsing overlay scan line */}
                    <div className="absolute left-0 right-0 h-1 bg-green-500 opacity-60 top-0 animate-bounce" />
                    
                    {/* Simulated QR blocks */}
                    <div className="w-full h-full grid grid-cols-5 grid-rows-5 gap-1 opacity-80">
                      {[...Array(25)].map((_, i) => {
                        const filled = (i * 7 + 13) % 3 === 0 || (i < 5 && i !== 2) || (i > 20 && i !== 22) || i % 6 === 0;
                        return (
                          <div 
                            key={i} 
                            className={`rounded-xs ${
                              filled 
                                ? "bg-gray-900" 
                                : i === 12 
                                  ? "bg-green-500" // Green anchor dot
                                  : "bg-transparent"
                            }`} 
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h4 className="font-bold text-gray-900 text-lg">Scan to Pay with TWINT</h4>
                  <p className="text-sm text-gray-500 max-w-sm">
                    Open your Swiss TWINT app and scan the QR code. Or simulate mobile app auto-approval.
                  </p>
                </div>

                <div className="flex gap-3 w-full max-w-xs pt-2">
                  <button
                    onClick={cancelTwintFlow}
                    className="flex-1 py-2.5 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={simulatePayment}
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm cursor-pointer shadow-md"
                  >
                    Simulate Success
                  </button>
                </div>
              </div>
            )}

            {/* Credit Card Flow / Processing */}
            {paymentMethod === "card" && paymentStep === "processing" && (
              <form onSubmit={handleCardSubmit} className="space-y-4">
                <h4 className="font-bold text-gray-900 text-sm">Enter Credit Card Details</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="4242 •••• •••• 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 font-medium text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 font-medium text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                        CVC
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="123"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 font-medium text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentStep("select");
                      setPaymentMethod(null);
                    }}
                    className="flex-1 py-2.5 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-primary hover:bg-blue-700 text-white font-bold rounded-lg text-sm cursor-pointer shadow-md"
                  >
                    Confirm & Pay
                  </button>
                </div>
              </form>
            )}

            {/* Global Loader overlay for processing */}
            {paymentStep === "processing" && paymentMethod && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center space-y-4 max-w-xs text-center border border-gray-150">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <div>
                    <h4 className="font-bold text-gray-900">Processing Payment...</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Simulating bank verification and booking registration.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 6: Confirmation Screen */}
        {step === 6 && selectedService && selectedTime && (
          <div className="flex flex-col items-center justify-center text-center py-8 space-y-6">
            <div className="w-16 h-16 bg-green-100 border border-green-200 text-green-600 rounded-full flex items-center justify-center shadow-inner">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight text-gray-900 font-display">
                {t.success[locale]}
              </h3>
              <p className="text-gray-500 text-sm max-w-md">
                Your appointment at Salon Bellezza has been successfully booked. A confirmation email was sent to <strong>{clientEmail}</strong>.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-gray-50 border border-gray-150 p-4 rounded-xl w-full max-w-md text-left space-y-3">
              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Booking Receipt</span>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Paid</span>
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-gray-500">Service:</span>
                <span className="font-semibold text-gray-900 text-right">{selectedService.name[locale]}</span>
                
                <span className="text-gray-500">Professional:</span>
                <span className="font-semibold text-gray-900 text-right">
                  {staff.find(s => s.id === (createdAppointment?.staffId || selectedStaffId))?.name || "Stylist"}
                </span>

                <span className="text-gray-500">Date & Time:</span>
                <span className="font-semibold text-gray-900 text-right">{selectedDate} @ {selectedTime}</span>

                <span className="text-gray-500">Payment:</span>
                <span className="font-semibold text-gray-900 text-right uppercase">{paymentMethod || "Direct"}</span>

                <span className="text-gray-500 font-bold text-base pt-2 border-t border-dashed border-gray-200">Total Charged:</span>
                <span className="font-bold text-gray-900 text-right text-base pt-2 border-t border-dashed border-gray-200">
                  CHF {selectedService.price.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md pt-4">
              <button
                onClick={handleReset}
                className="flex-1 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg text-sm transition-colors cursor-pointer"
              >
                Book Another Appointment
              </button>
              <button
                onClick={handleGoToCalendar}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-all cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
              >
                View in Merchant Calendar
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
