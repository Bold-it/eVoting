export interface Candidate {
  id: string;
  name: string;
  photo: string;
  manifesto: string;
  credentials: string[];
}

export interface Position {
  id: string;
  title: string;
  description: string;
  candidates: Candidate[];
}

// Placeholder candidate portraits (stable, neutral avatars)
const portrait = (seed: string) =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear&backgroundColor=1B4CA0,D61F28&fontWeight=600`;

export const POSITIONS: Position[] = [
  {
    id: "president",
    title: "President",
    description: "Leads the association and represents all members.",
    candidates: [
      {
        id: "pres-1",
        name: "Akosua Mensah",
        photo: portrait("Akosua Mensah"),
        manifesto:
          "Strengthen industry partnerships, expand the COMPSSA mentorship program, and host two major hackathons each semester.",
        credentials: ["Level 300 BSc Computer Science", "Class Rep, 2024", "Lead Organizer, HTU CodeFest"],
      },
      {
        id: "pres-2",
        name: "Kwame Boateng",
        photo: portrait("Kwame Boateng"),
        manifesto:
          "Transparent leadership, weekly office hours for members, and a dedicated COMPSSA career portal for internships.",
        credentials: ["Level 400 BTech IT", "Vice President, Robotics Club", "Google DSC Lead"],
      },
    ],
  },
  {
    id: "vp",
    title: "Vice President",
    description: "Supports the President and oversees internal committees.",
    candidates: [
      {
        id: "vp-1",
        name: "Esinam Dzifa",
        photo: portrait("Esinam Dzifa"),
        manifesto: "Empower committee leads with clear budgets and revive the COMPSSA Sisters in Tech program.",
        credentials: ["Level 300 BSc CS", "Secretary, Women in Tech HTU"],
      },
      {
        id: "vp-2",
        name: "Yaw Ofori",
        photo: portrait("Yaw Ofori"),
        manifesto: "Modernize internal operations with a shared digital workspace for all COMPSSA committees.",
        credentials: ["Level 400 BTech CS", "Project Lead, HTU Open Source"],
      },
    ],
  },
  {
    id: "secretary",
    title: "General Secretary",
    description: "Maintains records, minutes, and official communications.",
    candidates: [
      {
        id: "sec-1",
        name: "Adwoa Asantewaa",
        photo: portrait("Adwoa Asantewaa"),
        manifesto: "Digitize all COMPSSA records and publish meeting minutes within 48 hours.",
        credentials: ["Level 200 BSc CS", "Editor, HTU Tech Bulletin"],
      },
      {
        id: "sec-2",
        name: "Selorm Agbeko",
        photo: portrait("Selorm Agbeko"),
        manifesto: "Build a searchable archive of every COMPSSA event, document, and decision.",
        credentials: ["Level 300 BTech IT", "Assistant Secretary, 2024"],
      },
    ],
  },
  {
    id: "treasurer",
    title: "Treasurer",
    description: "Manages association finances and budget reporting.",
    candidates: [
      {
        id: "tre-1",
        name: "Nana Akua Frimpong",
        photo: portrait("Nana Akua"),
        manifesto: "Monthly public finance reports and a transparent dues-tracking dashboard for every member.",
        credentials: ["Level 300 BSc Accounting & IT", "Financial Secretary, SRC"],
      },
      {
        id: "tre-2",
        name: "Kojo Antwi",
        photo: portrait("Kojo Antwi"),
        manifesto: "Diversify COMPSSA income through sponsored workshops and a branded merch line.",
        credentials: ["Level 400 BTech CS", "Founder, Antwi Digital Services"],
      },
    ],
  },
  {
    id: "organizer",
    title: "Organizing Secretary",
    description: "Plans and coordinates all COMPSSA events and programs.",
    candidates: [
      {
        id: "org-1",
        name: "Linda Owusu",
        photo: portrait("Linda Owusu"),
        manifesto: "Deliver a full semester calendar of bootcamps, game jams, and industry tours.",
        credentials: ["Level 300 BSc CS", "Events Lead, HTU Innovation Week"],
      },
      {
        id: "org-2",
        name: "Mawuli Adzaho",
        photo: portrait("Mawuli Adzaho"),
        manifesto: "Bring our flagship Tech Summit back, with confirmed industry speakers from Accra and beyond.",
        credentials: ["Level 400 BTech IT", "Coordinator, HTU Dev Meetup"],
      },
    ],
  },
];

// Mock valid login pairs. Token shown for demo convenience.
export const VALID_VOTERS: Record<string, { token: string; name: string }> = {
  HTU2024001: { token: "VOTE-7H3K-9P2X", name: "Moses Nyarko" },
  HTU2024002: { token: "VOTE-A1B2-C3D4", name: "Barbara Awuitor" },
  HTU2024003: { token: "VOTE-Z9Y8-X7W6", name: "Kofi Annan" },
};

export const USED_TOKENS = new Set<string>();
