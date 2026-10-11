export type Role = "parent" | "host" | "admin";
export type Status =
  "requested" | "accepted" | "completed" | "declined" | "cancelled";
export type Host = {
  id: string;
  name: string;
  title: string;
  image: string;
  bio: string;
  rate: number;
  languages: string[];
  services: string[];
  neighborhood: string;
  tags: string[];
  approved: boolean;
};
export type Booking = {
  id: string;
  parent_id: string;
  host_id: string;
  service: string;
  starts_at: string;
  ends_at: string;
  status: Status;
  amount: number;
  payment_status: string;
  care_notes: string;
  child_age_range: string;
  parent_name: string;
};
export type Message = {
  photo_url?: string;
  photo_path?: string;
  id: string;
  booking_id: string;
  sender_id: string;
  body: string;
  type: "chat" | "update";
  created_at: string;
};
export type Review = {
  id: string;
  booking_id: string;
  reviewer_id: string;
  rating: number;
  body: string;
};
export type SupportCase = {
  id: string;
  subject: string;
  body: string;
  status: string;
  user_id: string;
};
export const services = [
  "Childcare",
  "Companionship",
  "Cooking",
  "Rides",
  "Errands",
  "Lessons",
];
export const hosts: Host[] = [
  {
    id: "eleanor",
    name: "Eleanor Bennett",
    title: "A little patience. A lot of stories.",
    image: "/images/eleanor.jpg",
    bio: "A retired librarian, enthusiastic gardener, and lifelong believer in the magic of a good story. I love helping little minds grow through reading, creative play, and unhurried afternoons.",
    rate: 24,
    languages: ["English", "Spanish"],
    services: ["Childcare", "Lessons"],
    neighborhood: "Maplewood",
    tags: ["Reading together", "Creative afternoons", "Patient & gentle"],
    approved: true,
  },
  {
    id: "arthur",
    name: "Arthur Mitchell",
    title: "Making things. Making memories.",
    image: "/images/arthur.jpg",
    bio: "After thirty years of teaching, I still believe the best lessons start with curiosity. From birdhouses to nature walks, I help children discover the joy of making something with their own hands.",
    rate: 26,
    languages: ["English"],
    services: ["Lessons", "Companionship", "Errands"],
    neighborhood: "Oak Creek",
    tags: ["Hands-on learning", "Nature walks", "Curious minds"],
    approved: true,
  },
  {
    id: "maria",
    name: "Maria Santos",
    title: "Good food brings us together.",
    image: "/images/maria.jpg",
    bio: "My kitchen has always been a gathering place. I share family recipes, a little Spanish, and the kind of warmth that makes a new neighborhood feel like home.",
    rate: 22,
    languages: ["English", "Spanish"],
    services: ["Cooking", "Childcare", "Companionship"],
    neighborhood: "Willow Park",
    tags: ["Home cooking", "Bilingual care", "Family traditions"],
    approved: true,
  },
  {
    id: "clara",
    name: "Clara Henderson",
    title: "There is an artist in everyone.",
    image: "/images/clara.jpg",
    bio: "A watercolor artist who finds inspiration in ordinary moments. I offer gentle creative afternoons, companionship, and practical help around the neighborhood.",
    rate: 25,
    languages: ["English", "French"],
    services: ["Lessons", "Rides", "Errands"],
    neighborhood: "Maplewood",
    tags: ["Art & imagination", "Thoughtful company", "Music lover"],
    approved: true,
  },
];
const nextDate = (days: number, hour: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
export function initialData() {
  return {
    bookings: [
      {
        id: "GV-2041",
        parent_id: "parent-demo",
        host_id: "eleanor",
        parent_name: "Sarah Jenkins",
        service: "Childcare",
        starts_at: nextDate(1, 15),
        ends_at: nextDate(1, 18),
        status: "accepted" as Status,
        amount: 72,
        payment_status: "paid",
        care_notes:
          "Enjoys reading and watercolor. Please confirm pickup in messages.",
        child_age_range: "6–8 years",
      },
      {
        id: "GV-2042",
        parent_id: "parent-demo",
        host_id: "arthur",
        parent_name: "Sarah Jenkins",
        service: "Lessons",
        starts_at: nextDate(3, 10),
        ends_at: nextDate(3, 12),
        status: "requested" as Status,
        amount: 52,
        payment_status: "unpaid",
        care_notes: "Interested in nature and building things.",
        child_age_range: "6–8 years",
      },
      {
        id: "GV-2040",
        parent_id: "parent-demo",
        host_id: "eleanor",
        parent_name: "Sarah Jenkins",
        service: "Lessons",
        starts_at: nextDate(-4, 15),
        ends_at: nextDate(-4, 17),
        status: "completed" as Status,
        amount: 48,
        payment_status: "paid",
        care_notes: "Reading together.",
        child_age_range: "6–8 years",
      },
    ],
    messages: [
      {
        id: "m1",
        booking_id: "GV-2041",
        sender_id: "eleanor",
        body: "Hello Sarah! Looking forward to our afternoon together. I have a few lovely books picked out.",
        type: "chat" as const,
        created_at: new Date().toISOString(),
      },
      {
        id: "m2",
        booking_id: "GV-2041",
        sender_id: "parent-demo",
        body: "That sounds wonderful. Thank you, Eleanor!",
        type: "chat" as const,
        created_at: new Date().toISOString(),
      },
      {
        id: "m3",
        booking_id: "GV-2040",
        sender_id: "eleanor",
        body: "A lovely afternoon of reading and drawing. We finished two chapters together!",
        type: "update" as const,
        created_at: nextDate(-4, 16),
      },
    ] as Message[],
    reviews: [] as Review[],
    cases: [] as SupportCase[],
    saved: [] as string[],
    readMarkers: {} as Record<string, string>,
    availability: [] as Availability[],
    hosts,
  };
}
export type Availability = {
  id: string;
  host_id: string;
  starts_at: string;
  ends_at: string;
};
export type AppData = ReturnType<typeof initialData>;
export const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
export const dateLabel = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
export const timeLabel = (date: string) =>
  new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
export function overlaps(
  a: Pick<Booking, "starts_at" | "ends_at">,
  b: Pick<Booking, "starts_at" | "ends_at">,
) {
  return (
    new Date(a.starts_at) < new Date(b.ends_at) &&
    new Date(b.starts_at) < new Date(a.ends_at)
  );
}
export function canTransition(b: Booking, next: Status, role: Role) {
  return (
    (role === "host" &&
      b.status === "requested" &&
      ["accepted", "declined"].includes(next)) ||
    (b.status === "accepted" &&
      b.payment_status === "paid" &&
      next === "completed" &&
      ["parent", "host"].includes(role)) ||
    (["requested", "accepted"].includes(b.status) &&
      b.payment_status !== "paid" &&
      next === "cancelled" &&
      ["parent", "host"].includes(role))
  );
}
