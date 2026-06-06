"use client";

import React, { useState, useMemo, useRef } from "react";
import { useLocale } from "next-intl";
import { useDemoStore, Appointment, Staff, Service } from "../store/demoStore";

interface MerchantCalendarProps {
  highlightedAppointmentId?: string | null;
  onClearHighlight?: () => void;
}

export default function MerchantCalendar({ 
  highlightedAppointmentId, 
  onClearHighlight 
}: MerchantCalendarProps) {
  const locale = useLocale() as "en" | "de" | "fr" | "it";
  const { services, staff, appointments, addAppointment, updateAppointment, cancelAppointment, checkoutAppointment } = useDemoStore();

  // Selected date for the merchant dashboard
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  });

  // Drawer / Modal states
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCheckoutPOS, setShowCheckoutPOS] = useState(false);

  // Quick Add Form state
  const [quickAddStaffId, setQuickAddStaffId] = useState("");
  const [quickAddServiceId, setQuickAddServiceId] = useState("");
  const [quickAddClientName, setQuickAddClientName] = useState("");
  const [quickAddClientEmail, setQuickAddClientEmail] = useState("");
  const [quickAddClientPhone, setQuickAddClientPhone] = useState("");
  const [quickAddHour, setQuickAddHour] = useState("09:00");
  const [quickAddNotes, setQuickAddNotes] = useState("");

  // POS State
  const [posTipOption, setPosTipOption] = useState<"none" | "5" | "10" | "15" | "custom">("none");
  const [posCustomTip, setPosCustomTip] = useState("");
  const [posPaymentMethod, setPosPaymentMethod] = useState<"card" | "twint" | "cash">("twint");

  // Grid container reference for click-to-add
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Get current active appointment details
  const activeApt = useMemo(() => {
    return appointments.find((apt) => apt.id === selectedAptId) || null;
  }, [appointments, selectedAptId]);

  // Handle highlights from the consumer flow
  React.useEffect(() => {
    if (highlightedAppointmentId) {
      setSelectedAptId(highlightedAppointmentId);
      // Auto scroll to page top/center if needed
      if (onClearHighlight) {
        // Find appointment date
        const apt = appointments.find(a => a.id === highlightedAppointmentId);
        if (apt) {
          const aptDate = apt.startTime.split("T")[0];
          setSelectedDate(aptDate);
        }
        onClearHighlight();
      }
    }
  }, [highlightedAppointmentId, appointments, onClearHighlight]);

  // Standard business hours: 08:00 to 19:00
  const calendarHours = useMemo(() => {
    const hours = [];
    for (let h = 8; h <= 18; h++) {
      hours.push(h);
    }
    return hours;
  }, []);

  // Filter appointments for the selected date (excluding cancelled ones from grid display)
  const visibleAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const aptDate = apt.startTime.split("T")[0];
      return aptDate === selectedDate && apt.status !== "cancelled";
    });
  }, [appointments, selectedDate]);

  // Cancelled appointments for the sidebar review
  const cancelledAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const aptDate = apt.startTime.split("T")[0];
      return aptDate === selectedDate && apt.status === "cancelled";
    });
  }, [appointments, selectedDate]);

  // Daily statistics
  const stats = useMemo(() => {
    const todayApts = appointments.filter(apt => apt.startTime.split("T")[0] === selectedDate && apt.status !== "cancelled");
    const completed = todayApts.filter(apt => apt.status === "completed");
    const checkedIn = todayApts.filter(apt => apt.status === "checked_in");
    
    const revenue = completed.reduce((acc, apt) => {
      const price = apt.price || 0;
      const tip = apt.tipAmount || 0;
      return acc + price + tip;
    }, 0);

    return {
      total: todayApts.length,
      completed: completed.length,
      checkedIn: checkedIn.length,
      revenue,
    };
  }, [appointments, selectedDate]);

  // Calendar Coordinates Helpers
  // 1 hour = 80px. 1 minute = 1.333px. Baseline is 08:00
  const hourHeight = 80;
  const minuteHeight = hourHeight / 60;
  const startHourOffset = 8; // Calendar starts at 08:00

  const getCoordinates = (startTimeISO: string, endTimeISO: string) => {
    const start = new Date(startTimeISO);
    const end = new Date(endTimeISO);

    const startMin = start.getHours() * 60 + start.getMinutes();
    const calendarStartMin = startHourOffset * 60;

    const top = Math.max(0, (startMin - calendarStartMin) * minuteHeight);
    
    const durationMin = (end.getTime() - start.getTime()) / 60000;
    const height = Math.max(30, durationMin * minuteHeight);

    return { top, height };
  };

  // Grid click handler to trigger "Quick Add"
  const handleGridClick = (staffId: string, e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent triggering when clicking on an actual appointment card
    if ((e.target as HTMLElement).closest(".appointment-card")) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top; // Click offset relative to staff column
    
    const clickMin = clickY / minuteHeight;
    const clickTotalMin = clickMin + (startHourOffset * 60);

    // Snap to nearest 30-minute block
    const snappedTotalMin = Math.floor(clickTotalMin / 30) * 30;
    const hour = Math.floor(snappedTotalMin / 60);
    const minute = snappedTotalMin % 60;

    const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

    // Pre-populate quick add
    setQuickAddStaffId(staffId);
    setQuickAddHour(timeStr);
    setQuickAddServiceId(services[0].id);
    setQuickAddClientName("");
    setQuickAddClientEmail("");
    setQuickAddClientPhone("");
    setQuickAddNotes("");

    setShowAddModal(true);
  };

  // Handle Quick Add Submit
  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddClientName || !quickAddStaffId || !quickAddServiceId) return;

    const service = services.find((s) => s.id === quickAddServiceId);
    if (!service) return;

    const [hours, minutes] = quickAddHour.split(":").map(Number);
    const start = new Date(selectedDate);
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start.getTime() + service.duration * 60000);

    addAppointment({
      clientName: quickAddClientName,
      clientEmail: quickAddClientEmail || `${quickAddClientName.toLowerCase().replace(/\s+/g, "")}@example.ch`,
      clientPhone: quickAddClientPhone || "+41 79 000 00 00",
      serviceId: quickAddServiceId,
      staffId: quickAddStaffId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      price: service.price,
      notes: quickAddNotes,
    });

    setShowAddModal(false);
  };

  // POS Calculations
  const posCalculations = useMemo(() => {
    if (!activeApt) return { subtotal: 0, tip: 0, total: 0 };
    const subtotal = activeApt.price;
    let tip = 0;

    if (posTipOption === "5") tip = subtotal * 0.05;
    else if (posTipOption === "10") tip = subtotal * 0.10;
    else if (posTipOption === "15") tip = subtotal * 0.15;
    else if (posTipOption === "custom") tip = parseFloat(posCustomTip) || 0;

    return {
      subtotal,
      tip: Math.round(tip * 20) / 20, // Round to nearest 0.05 CHF
      total: subtotal + (Math.round(tip * 20) / 20),
    };
  }, [activeApt, posTipOption, posCustomTip]);

  // Handle POS Complete
  const handlePOSComplete = () => {
    if (!selectedAptId) return;
    checkoutAppointment(selectedAptId, posPaymentMethod, posCalculations.tip);
    setShowCheckoutPOS(false);
    setShowAddModal(false); // Make sure background overlays are clean
  };

  // Re-assign or reschedule details inside drawer
  const handleReschedule = (field: "staffId" | "time" | "date", value: string) => {
    if (!activeApt) return;
    
    const updates: Partial<Appointment> = {};
    
    if (field === "staffId") {
      updates.staffId = value;
    } else if (field === "date") {
      const oldStart = new Date(activeApt.startTime);
      const oldEnd = new Date(activeApt.endTime);
      
      const newStart = new Date(value);
      newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0);
      
      const newEnd = new Date(value);
      newEnd.setHours(oldEnd.getHours(), oldEnd.getMinutes(), 0, 0);

      updates.startTime = newStart.toISOString();
      updates.endTime = newEnd.toISOString();
    } else if (field === "time") {
      const [h, m] = value.split(":").map(Number);
      const durationMin = (new Date(activeApt.endTime).getTime() - new Date(activeApt.startTime).getTime()) / 60000;
      
      const datePart = activeApt.startTime.split("T")[0];
      const newStart = new Date(datePart);
      newStart.setHours(h, m, 0, 0);
      
      const newEnd = new Date(newStart.getTime() + durationMin * 60000);
      
      updates.startTime = newStart.toISOString();
      updates.endTime = newEnd.toISOString();
    }

    updateAppointment(activeApt.id, updates);
  };

  // Time slots for rescheduling dropdown
  const timeOptions = useMemo(() => {
    const list = [];
    for (let h = 8; h <= 18; h++) {
      list.push(`${String(h).padStart(2, "0")}:00`);
      list.push(`${String(h).padStart(2, "0")}:30`);
    }
    return list;
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-150 overflow-hidden font-sans">
      
      {/* Merchant Header Bar */}
      <div className="bg-gray-900 text-white p-5 border-b border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
              <h2 className="text-xl font-bold tracking-tight font-display">yesnow HQ Scheduler</h2>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Live Salon Operations Dashboard</p>
          </div>

          {/* Date Selector and Navigation */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                const prev = new Date(selectedDate);
                prev.setDate(prev.getDate() - 1);
                setSelectedDate(prev.toISOString().split("T")[0]);
              }}
              className="p-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 cursor-pointer"
            >
              ←
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-sm px-3 py-1.5 rounded-lg text-white font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button 
              onClick={() => {
                const next = new Date(selectedDate);
                next.setDate(next.getDate() + 1);
                setSelectedDate(next.toISOString().split("T")[0]);
              }}
              className="p-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 cursor-pointer"
            >
              →
            </button>
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-lg cursor-pointer transition-colors"
            >
              Today
            </button>
          </div>
        </div>

        {/* Live Operations Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 border-t border-gray-800 pt-4">
          <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Bookings Today</span>
            <span className="block text-2xl font-bold mt-1 text-gray-100">{stats.total} slots</span>
          </div>
          <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Checked In</span>
            <span className="block text-2xl font-bold mt-1 text-blue-400">{stats.checkedIn} clients</span>
          </div>
          <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Completed POS</span>
            <span className="block text-2xl font-bold mt-1 text-green-400">{stats.completed} paid</span>
          </div>
          <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Revenue Today</span>
            <span className="block text-2xl font-bold mt-1 text-emerald-300">CHF {stats.revenue.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Main Calendar Viewport */}
      <div className="flex flex-col lg:flex-row min-h-[500px] bg-bg relative">
        
        {/* Time Grid View */}
        <div className="flex-1 overflow-x-auto p-4 scrollbar-thin">
          <div className="min-w-[700px] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            
            {/* Staff Header Row */}
            <div className="flex border-b border-gray-200 bg-gray-50 text-gray-700">
              {/* Corner Empty cell for time labels */}
              <div className="w-16 border-r border-gray-200 flex-shrink-0" />
              
              {/* Stylist Columns Headers */}
              {staff.map((member) => (
                <div key={member.id} className="flex-1 p-3 text-center border-r border-gray-200 last:border-r-0 flex flex-col items-center justify-center gap-1.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                    member.color === "staff-1" ? "bg-blue-600" :
                    member.color === "staff-2" ? "bg-purple-600" : "bg-pink-600"
                  }`}>
                    {member.avatar}
                  </div>
                  <div>
                    <span className="block font-bold text-gray-900 text-sm">{member.name}</span>
                    <span className="block text-xxs text-gray-500 font-medium uppercase tracking-wider">{member.title}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Scheduler Grid Area */}
            <div className="flex relative" style={{ height: `${calendarHours.length * hourHeight}px` }}>
              
              {/* Hour Grid Lines (Overlay) */}
              <div className="absolute inset-0 pointer-events-none z-0">
                {calendarHours.map((_, idx) => (
                  <div 
                    key={idx} 
                    className="absolute left-0 right-0 border-t border-gray-150" 
                    style={{ top: `${idx * hourHeight}px`, height: `${hourHeight}px` }}
                  >
                    {/* Half hour dashed divider */}
                    <div className="absolute top-[40px] left-16 right-0 border-t border-dashed border-gray-100" />
                  </div>
                ))}
              </div>

              {/* Time Labels Column */}
              <div className="w-16 border-r border-gray-200 flex-shrink-0 bg-gray-50/70 select-none z-10 text-right pr-2 font-semibold text-gray-400 text-xxs flex flex-col justify-between">
                {calendarHours.map((hour, idx) => (
                  <div 
                    key={hour} 
                    className="absolute"
                    style={{ top: `${idx * hourHeight + 6}px` }}
                  >
                    {String(hour).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {/* Staff Column Grid Columns */}
              {staff.map((member) => {
                const staffApts = visibleAppointments.filter((a) => a.staffId === member.id);
                
                return (
                  <div 
                    key={member.id} 
                    onClick={(e) => handleGridClick(member.id, e)}
                    className="flex-1 border-r border-gray-200 last:border-r-0 relative h-full select-none cursor-cell hover:bg-blue-50/10 transition-colors"
                  >
                    {/* Render Appointment Cards inside this column */}
                    {staffApts.map((apt) => {
                      const coords = getCoordinates(apt.startTime, apt.endTime);
                      const service = services.find((s) => s.id === apt.serviceId);
                      const isHighlighted = apt.id === selectedAptId;

                      return (
                        <div
                          key={apt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAptId(apt.id);
                          }}
                          className={`appointment-card absolute left-2 right-2 p-2.5 rounded-lg border-l-4 font-sans text-xs transition-all shadow-sm cursor-pointer z-20 flex flex-col justify-between overflow-hidden hover:scale-102 hover:shadow-md ${
                            isHighlighted ? "ring-2 ring-primary ring-offset-1 z-30 scale-102" : ""
                          } ${
                            apt.status === "completed" 
                              ? "bg-gray-100 border-l-gray-400 text-gray-500 opacity-70"
                              : apt.status === "checked_in"
                                ? "bg-blue-50 border-l-blue-600 text-blue-900 border border-blue-200/60"
                                : member.color === "staff-1"
                                  ? "bg-blue-50 border-l-blue-600 text-blue-900 border border-blue-100"
                                  : member.color === "staff-2"
                                    ? "bg-purple-50 border-l-purple-600 text-purple-900 border border-purple-100"
                                    : "bg-pink-50 border-l-pink-600 text-pink-900 border border-pink-100"
                          }`}
                          style={{ 
                            top: `${coords.top}px`, 
                            height: `${coords.height}px` 
                          }}
                        >
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="font-bold block truncate max-w-[85%]">{apt.clientName}</span>
                              {apt.status === "completed" && (
                                <span className="text-xxs text-green-700 bg-green-50 px-1 rounded">✓ Paid</span>
                              )}
                              {apt.status === "checked_in" && (
                                <span className="flex h-2 w-2 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-semibold opacity-80 block truncate mt-0.5">
                              {service?.name[locale] || "Styling"}
                            </span>
                          </div>

                          {/* Detail bottom details if height permits */}
                          {coords.height >= 55 && (
                            <div className="flex justify-between items-center text-[10px] mt-1 opacity-75 font-medium border-t border-black/5 pt-1">
                              <span>
                                {new Date(apt.startTime).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              <span>CHF {apt.price}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Cancelled Bookings Panel */}
        <div className="w-full lg:w-64 bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-200 p-4 space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Cancelled Today ({cancelledAppointments.length})</h3>
          
          {cancelledAppointments.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No cancelled bookings today.</p>
          ) : (
            <div className="space-y-2 max-h-40 lg:max-h-none overflow-y-auto">
              {cancelledAppointments.map((apt) => {
                const service = services.find(s => s.id === apt.serviceId);
                return (
                  <div key={apt.id} className="bg-white border border-gray-200 p-3 rounded-lg flex flex-col gap-1.5 shadow-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-gray-600 line-through truncate max-w-[70%]">
                        {apt.clientName}
                      </span>
                      <button 
                        onClick={() => updateAppointment(apt.id, { status: "confirmed" })}
                        className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
                      >
                        Restore
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500">
                      {service?.name[locale]} • {new Date(apt.startTime).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick instructions indicator */}
          <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-lg text-xs text-blue-900 space-y-2 mt-4">
            <h4 className="font-bold flex items-center gap-1.5 text-blue-950">
              💡 Demo Tip
            </h4>
            <p className="leading-relaxed opacity-90">
              Click anywhere on a stylist's calendar grid column to instantly open a <strong>Quick Add</strong> scheduling card. Click cards to check in clients or trigger a cash register payment.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL 1: Click-to-add Quick Booking */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-150 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in duration-200">
            <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold font-display text-base">Quick-Schedule Client</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white text-lg font-bold">×</button>
            </div>
            
            <form onSubmit={handleQuickAddSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Stylist *</label>
                  <select
                    value={quickAddStaffId}
                    onChange={(e) => setQuickAddStaffId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                  >
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Time Slot *</label>
                  <select
                    value={quickAddHour}
                    onChange={(e) => setQuickAddHour(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                  >
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Select Service *</label>
                <select
                  value={quickAddServiceId}
                  onChange={(e) => setQuickAddServiceId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium"
                >
                  {services.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name[locale]} (CHF {s.price} • {s.duration} min)
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-3">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide">Client Details</label>
                
                <div>
                  <label className="block text-xxs font-bold text-gray-500 uppercase mb-1">Client Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter customer name"
                    value={quickAddClientName}
                    onChange={(e) => setQuickAddClientName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xxs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+41 79 ..."
                      value={quickAddClientPhone}
                      onChange={(e) => setQuickAddClientPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xxs font-bold text-gray-500 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="client@mail.ch"
                      value={quickAddClientEmail}
                      onChange={(e) => setQuickAddClientEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xxs font-bold text-gray-500 uppercase mb-1">Internal Notes</label>
                  <textarea
                    rows={2}
                    placeholder="E.g. Wants tea, hair concerns..."
                    value={quickAddNotes}
                    onChange={(e) => setQuickAddNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary hover:bg-blue-700 text-white font-bold rounded-lg text-sm cursor-pointer shadow-md"
                >
                  Schedule Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER / SIDE OVERLAY: Appointment Detail & Control Drawer */}
      {activeApt && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-gray-150 shadow-2xl z-40 flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="bg-gray-900 text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-xxs uppercase tracking-wider bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded font-bold">
                  Details View
                </span>
                <h3 className="font-bold text-lg font-display mt-1">Appointment Controls</h3>
              </div>
              <button 
                onClick={() => setSelectedAptId(null)}
                className="text-gray-400 hover:text-white text-xl font-bold p-1 cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Main Client Info Header Card */}
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-150">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {activeApt.clientName.split(" ").map(w => w[0]).join("")}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">{activeApt.clientName}</h4>
                  <p className="text-xs text-gray-500">{activeApt.clientPhone} • {activeApt.clientEmail}</p>
                </div>
              </div>

              {/* Status Badge Select Grid */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide">Client Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateAppointment(activeApt.id, { status: "confirmed" })}
                    className={`py-2 text-xs font-bold border rounded-lg transition-colors cursor-pointer ${
                      activeApt.status === "confirmed"
                        ? "bg-amber-50 border-amber-400 text-amber-800"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    ● Scheduled
                  </button>
                  <button
                    onClick={() => updateAppointment(activeApt.id, { status: "checked_in" })}
                    className={`py-2 text-xs font-bold border rounded-lg transition-colors cursor-pointer ${
                      activeApt.status === "checked_in"
                        ? "bg-blue-50 border-blue-400 text-blue-800"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    ● Checked In
                  </button>
                </div>
              </div>

              {/* Service Details Card */}
              <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-150">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide">Scheduled Service</label>
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-bold text-gray-900">
                      {services.find((s) => s.id === activeApt.serviceId)?.name[locale] || "Styling"}
                    </span>
                    <span className="block text-xs text-gray-500 mt-0.5">
                      Duration: {services.find((s) => s.id === activeApt.serviceId)?.duration} mins
                    </span>
                  </div>
                  <strong className="text-gray-900 text-base">CHF {activeApt.price.toFixed(2)}</strong>
                </div>
                {activeApt.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-[10px] font-bold uppercase text-gray-400">Client Request Notes</span>
                    <p className="text-xs text-gray-600 italic mt-0.5">{activeApt.notes}</p>
                  </div>
                )}
              </div>

              {/* Dynamic Rescheduling Control Section */}
              <div className="space-y-3 border-t border-gray-200 pt-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide">Reschedule & Relocate</label>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Reassign Stylist</label>
                    <select
                      value={activeApt.staffId}
                      onChange={(e) => handleReschedule("staffId", e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white font-semibold"
                    >
                      {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Time Slot</label>
                    <select
                      value={new Date(activeApt.startTime).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                      onChange={(e) => handleReschedule("time", e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white font-semibold"
                    >
                      {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">Reschedule Date</label>
                  <input
                    type="date"
                    value={activeApt.startTime.split("T")[0]}
                    onChange={(e) => handleReschedule("date", e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Drawer Actions Footer */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
            {/* Cancel Booking Button */}
            <button
              onClick={() => {
                cancelAppointment(activeApt.id);
                setSelectedAptId(null);
              }}
              className="px-4 py-3 border border-red-200 hover:bg-red-50 text-red-600 font-bold rounded-lg text-sm transition-colors cursor-pointer flex-1 text-center"
            >
              Cancel Appointment
            </button>

            {/* POS Checkout Button */}
            {activeApt.status !== "completed" ? (
              <button
                onClick={() => {
                  setPosTipOption("none");
                  setPosCustomTip("");
                  setShowCheckoutPOS(true);
                }}
                className="px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm transition-all cursor-pointer shadow-md flex-1 text-center flex items-center justify-center gap-1.5"
              >
                Checkout POS
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
            ) : (
              <div className="px-5 py-3 bg-gray-200 text-gray-500 font-bold rounded-lg text-sm flex-1 text-center flex items-center justify-center gap-1">
                Completed
              </div>
            )}
          </div>
        </div>
      )}

      {/* OVERLAY MODAL 2: Point of Sale (POS) Checkout */}
      {showCheckoutPOS && activeApt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-150 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-green-600 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="font-bold font-display text-base">Point of Sale (POS)</h3>
              </div>
              <button 
                onClick={() => setShowCheckoutPOS(false)} 
                className="text-white/80 hover:text-white text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Bill Details */}
            <div className="p-5 space-y-5">
              <div>
                <h4 className="text-xxs font-bold text-gray-400 uppercase tracking-wide">Client</h4>
                <p className="font-bold text-gray-900 text-base">{activeApt.clientName}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Service performed by {staff.find((s) => s.id === activeApt.staffId)?.name}
                </p>
              </div>

              {/* Service Fee item */}
              <div className="border-t border-b border-gray-150 py-3 flex justify-between items-center text-sm">
                <div>
                  <span className="font-bold text-gray-900">
                    {services.find((s) => s.id === activeApt.serviceId)?.name[locale]}
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">Base Fee</span>
                </div>
                <span className="font-bold text-gray-900">CHF {activeApt.price.toFixed(2)}</span>
              </div>

              {/* Swiss Tip Selector */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide">Add Gratuity (Tip)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "No Tip", value: "none" },
                    { label: "5%", value: "5" },
                    { label: "10%", value: "10" },
                    { label: "15%", value: "15" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPosTipOption(opt.value as any)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        posTipOption === opt.value
                          ? "bg-green-50 border-green-500 text-green-700 font-extrabold shadow-sm scale-102"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Custom Tip Input */}
                <button
                  type="button"
                  onClick={() => setPosTipOption("custom")}
                  className={`w-full py-2 text-xs font-bold border rounded-lg transition-colors cursor-pointer ${
                    posTipOption === "custom"
                      ? "bg-green-50 border-green-500 text-green-700"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {posTipOption === "custom" ? "✏ Custom Gratuity Selected" : "✏ Enter Custom Gratuity Amount"}
                </button>

                {posTipOption === "custom" && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500 font-bold">CHF</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      step="0.05"
                      value={posCustomTip}
                      onChange={(e) => setPosCustomTip(e.target.value)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm w-full font-bold focus:outline-none focus:border-green-500"
                    />
                  </div>
                )}
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "TWINT", value: "twint" },
                    { label: "Card", value: "card" },
                    { label: "Cash", value: "cash" },
                  ].map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPosPaymentMethod(method.value as any)}
                      className={`py-3 text-xs font-bold rounded-lg border transition-all cursor-pointer uppercase ${
                        posPaymentMethod === method.value
                          ? "bg-green-50 border-green-500 text-green-700 font-extrabold shadow-sm scale-102"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkout Calculation Card */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-2.5 font-semibold text-sm">
                <div className="flex justify-between items-center text-gray-500">
                  <span>Subtotal:</span>
                  <span>CHF {posCalculations.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-500">
                  <span>Gratuity (Tip):</span>
                  <span>CHF {posCalculations.tip.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
                  <span>Grand Total:</span>
                  <span className="text-green-700 text-lg">CHF {posCalculations.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer triggers completion */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => setShowCheckoutPOS(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePOSComplete}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm transition-all cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
              >
                Charge CHF {posCalculations.total.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
