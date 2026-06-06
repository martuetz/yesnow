import { create } from "zustand";

export interface Service {
  id: string;
  name: { de: string; fr: string; it: string; en: string };
  duration: number; // minutes
  price: number; // CHF
  category: string;
}

export interface Staff {
  id: string;
  name: string;
  title: string;
  color: string;
  avatar: string; // Initials
}

export interface Appointment {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceId: string;
  staffId: string;
  startTime: string; // ISO String
  endTime: string; // ISO String
  status: "pending" | "confirmed" | "checked_in" | "completed" | "cancelled";
  paymentStatus: "unpaid" | "paid";
  paymentMethod?: "card" | "twint" | "cash";
  price: number;
  tipAmount?: number;
  notes?: string;
}

interface DemoState {
  services: Service[];
  staff: Staff[];
  appointments: Appointment[];
  addAppointment: (appointment: Omit<Appointment, "id" | "status" | "paymentStatus">) => Appointment;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  cancelAppointment: (id: string) => void;
  checkoutAppointment: (id: string, paymentMethod: "card" | "twint" | "cash", tipAmount: number) => void;
}

// Helper to generate ISO strings relative to today
const getTodayTime = (hours: number, minutes: number) => {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

export const useDemoStore = create<DemoState>((set) => ({
  services: [
    {
      id: "srv-1",
      name: {
        de: "Herrenschnitt & Styling",
        fr: "Coupe Homme & Coiffage",
        it: "Taglio Uomo & Piega",
        en: "Men's Cut & Styling",
      },
      duration: 30,
      price: 45,
      category: "Haircut",
    },
    {
      id: "srv-2",
      name: {
        de: "Damenschnitt & Föhnen",
        fr: "Coupe Femme & Brushing",
        it: "Taglio Donna & Piega",
        en: "Women's Cut & Blowdry",
      },
      duration: 60,
      price: 85,
      category: "Haircut",
    },
    {
      id: "srv-3",
      name: {
        de: "Haarfärbung komplett",
        fr: "Coloration Complète",
        it: "Colore Completo",
        en: "Full Hair Coloring",
      },
      duration: 90,
      price: 130,
      category: "Color",
    },
    {
      id: "srv-4",
      name: {
        de: "Mèches / Balayage",
        fr: "Mèches / Balayage",
        it: "Mèches / Balayage",
        en: "Highlights / Balayage",
      },
      duration: 120,
      price: 160,
      category: "Color",
    },
    {
      id: "srv-5",
      name: {
        de: "Bartpflege & Rasur",
        fr: "Taille de Barbe & Rasage",
        it: "Cura Barba & Rasatura",
        en: "Beard Grooming & Shave",
      },
      duration: 30,
      price: 35,
      category: "Grooming",
    },
  ],

  staff: [
    {
      id: "staff-1",
      name: "Maria Müller",
      title: "Senior Stylist",
      color: "staff-1",
      avatar: "MM",
    },
    {
      id: "staff-2",
      name: "Luca Bernasconi",
      title: "Master Colorist",
      color: "staff-2",
      avatar: "LB",
    },
    {
      id: "staff-3",
      name: "Sarah Gervaise",
      title: "Junior Barber",
      color: "staff-3",
      avatar: "SG",
    },
  ],

  appointments: [
    {
      id: "apt-1",
      clientName: "Hans Meier",
      clientEmail: "hans@meier.ch",
      clientPhone: "+41 79 123 45 67",
      serviceId: "srv-1",
      staffId: "staff-1",
      startTime: getTodayTime(9, 0),
      endTime: getTodayTime(9, 30),
      status: "confirmed",
      paymentStatus: "unpaid",
      price: 45,
      notes: "Kaffee mit Milch bevorzugt.",
    },
    {
      id: "apt-2",
      clientName: "Sophie Dubois",
      clientEmail: "sophie@dubois.fr",
      clientPhone: "+41 78 987 65 43",
      serviceId: "srv-2",
      staffId: "staff-2",
      startTime: getTodayTime(10, 0),
      endTime: getTodayTime(11, 0),
      status: "confirmed",
      paymentStatus: "unpaid",
      price: 85,
    },
    {
      id: "apt-3",
      clientName: "Giovanni Rossi",
      clientEmail: "giovanni@rossi.it",
      clientPhone: "+41 76 543 21 09",
      serviceId: "srv-5",
      staffId: "staff-3",
      startTime: getTodayTime(11, 30),
      endTime: getTodayTime(12, 0),
      status: "confirmed",
      paymentStatus: "unpaid",
      price: 35,
      notes: "Nassrasur.",
    },
    {
      id: "apt-4",
      clientName: "Anna Keller",
      clientEmail: "anna.keller@gmx.ch",
      clientPhone: "+41 79 333 44 55",
      serviceId: "srv-3",
      staffId: "staff-1",
      startTime: getTodayTime(13, 0),
      endTime: getTodayTime(14, 30),
      status: "completed",
      paymentStatus: "paid",
      paymentMethod: "twint",
      price: 130,
      tipAmount: 10,
    },
  ],

  addAppointment: (appointment) => {
    const id = `apt-${Date.now()}`;
    const newApt: Appointment = {
      ...appointment,
      id,
      status: "confirmed",
      paymentStatus: "unpaid",
    };
    set((state) => ({
      appointments: [...state.appointments, newApt],
    }));
    return newApt;
  },

  updateAppointment: (id, updates) => {
    set((state) => ({
      appointments: state.appointments.map((apt) =>
        apt.id === id ? { ...apt, ...updates } : apt
      ),
    }));
  },

  cancelAppointment: (id) => {
    set((state) => ({
      appointments: state.appointments.map((apt) =>
        apt.id === id ? { ...apt, status: "cancelled" } : apt
      ),
    }));
  },

  checkoutAppointment: (id, paymentMethod, tipAmount) => {
    set((state) => ({
      appointments: state.appointments.map((apt) =>
        apt.id === id
          ? {
              ...apt,
              status: "completed",
              paymentStatus: "paid",
              paymentMethod,
              tipAmount,
            }
          : apt
      ),
    }));
  },
}));
