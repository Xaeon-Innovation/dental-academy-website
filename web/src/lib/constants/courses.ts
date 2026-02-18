export const COURSES = [
  {
    slug: "iplace-irestore",
    id: "iplace-irestore",
    title: "iPlace // iRestore",
    description: "Single and Multiple implants intensive course.",
    cpd: "60 Hrs of CPD",
    provider: "Kaleidoscope Dental Academy",
  },
  {
    slug: "full-arch-intensive",
    id: "full-arch-intensive",
    title: "FULL ARCH INTENSIVE",
    description: "(All-on-X)",
    cpd: "46hrs of CPD",
    provider: "Kaleidoscope Dental Academy",
  },
] as const;

export function getCourseBySlug(slug: string) {
  return COURSES.find((c) => c.slug === slug) ?? null;
}

export type CourseAgendaDay = {
  day: string;
  date: string;
  title: string;
  time: string;
  items: string[];
};

export type CourseDetail = {
  overview: string[];
  learningPoints: string[];
  agenda: CourseAgendaDay[];
  requirements: string[];
  instructor: {
    name: string;
    credentials: string;
    bio: string;
    badges: string[];
    imageUrl?: string;
  };
  instructors?: Array<{
    name: string;
    credentials: string;
    bio: string;
    badges: string[];
    imageUrl?: string;
  }>;
  registrationBadge?: string;
  duration: string;
  location: string;
  maxParticipants?: number;
  dateRange: string;
  pricing?: {
    earlyBird?: {
      amount: string;
      until: string;
    };
    standard: {
      amount: string;
      from: string;
    };
    singleOccupancyUpgrade?: string;
  };
  packageIncludes?: string[];
};

const courseDetails: Record<string, CourseDetail> = {
  "iplace-irestore": {
    registrationBadge: "Open Registration",
    dateRange: "15 May – 22 May, 2026",
    duration: "8 Days (3 days theory, 3 days clinical hands-on, 1 UK review day)",
    location: "Theory: Almaza Bay, Egypt | Practical: Alexandria, Egypt | UK Review: Date TBC",
    overview: [
      "This intensive course is designed for general practitioners who want to gain confidence in single and multiple implant placement and restoration. The programme combines 3 days of theoretical lectures with 3 days of supervised clinical hands-on training on live surgeries, followed by a UK-based review and mentoring day.",
      "The all-inclusive package includes flights, 5-star accommodation, meals, and transportation. With 60 verifiable CPD hours, this course meets and exceeds GDC and FGDP Training Standards minimum supervised training for safe implant placement. Emphasis is placed on evidence-based techniques, predictable outcomes, and building practical skills through real clinical experience.",
    ],
    learningPoints: [
      "Implant fundamentals: principles of implant dentistry and surgical case selection",
      "Treatment planning: CBCT interpretation, digital workflows, and guided surgery planning",
      "Surgical techniques: flap design, suturing, aseptic techniques, and surgical setup",
      "Prosthetic concepts: implant fixed bridges planning, impression taking, and intraoral scanning",
      "Advanced procedures: bone grafting principles, soft tissue optimization, and occlusion for implants",
      "Clinical skills: supervised live surgeries, guided and freehand implant placement",
      "Complications management: surgical and prosthodontic complications, maintenance, and troubleshooting",
    ],
    agenda: [
      {
        day: "FRIDAY",
        date: "15 May",
        title: "Arrival & Welcome",
        time: "Evening",
        items: [
          "Arrival in Egypt",
          "Welcome dinner",
        ],
      },
      {
        day: "SATURDAY",
        date: "16 May",
        title: "Theory Day 1 – Almaza Bay",
        time: "Full Day",
        items: [
          "Principles of implant dentistry",
          "Surgical case selection and treatment planning",
          "CBCT interpretation and digital workflows",
          "Guided surgery planning",
          "Aseptic techniques and surgical setup",
        ],
      },
      {
        day: "SUNDAY",
        date: "17 May",
        title: "Theory Day 2 – Almaza Bay",
        time: "Full Day",
        items: [
          "Flap design and suturing",
          "Implant fixed bridges planning",
          "Bone grafting principles and materials",
          "Implant drilling workshop",
          "Soft tissue optimization",
          "Impression taking and intraoral scanning",
        ],
      },
      {
        day: "MONDAY",
        date: "18 May",
        title: "Theory Day 3 – Almaza Bay",
        time: "Full Day",
        items: [
          "Occlusion for implants",
          "Surgical and prosthodontic complications",
          "Maintenance and troubleshooting",
        ],
      },
      {
        day: "TUESDAY",
        date: "19 May",
        title: "Clinical Hands-On Day 1 – Alexandria",
        time: "Full Day",
        items: [
          "Supervised live surgeries",
          "Guided and semi-guided implant placement",
          "Freehand implant placement",
          "Soft and hard tissue management",
        ],
      },
      {
        day: "WEDNESDAY",
        date: "20 May",
        title: "Clinical Hands-On Day 2 – Alexandria",
        time: "Full Day",
        items: [
          "Supervised live surgeries",
          "Guided and semi-guided implant placement",
          "Freehand implant placement",
          "Soft and hard tissue management",
        ],
      },
      {
        day: "THURSDAY",
        date: "21 May",
        title: "Clinical Hands-On Day 3 – Alexandria",
        time: "Full Day",
        items: [
          "Supervised live surgeries",
          "Guided and semi-guided implant placement",
          "Freehand implant placement",
          "Soft and hard tissue management",
        ],
      },
      {
        day: "FRIDAY",
        date: "22 May",
        title: "Departure",
        time: "Morning",
        items: [
          "Departure and transfer to airport",
        ],
      },
      {
        day: "UK REVIEW",
        date: "Date TBC",
        title: "UK-Based Review Day",
        time: "TBC",
        items: [
          "Reflections and feedback",
          "Follow-up mentoring",
          "Case presentations",
        ],
      },
    ],
    requirements: [],
    instructor: {
      name: "Kaleidoscope Faculty",
      credentials: "Expert Implantology Team",
      bio: "Led by experienced implantologists and prosthodontic specialists with extensive clinical and academic backgrounds.",
      badges: ["GDC Registered", "60 CPD Hours"],
    },
    instructors: [
      {
        name: "Dr. Sameh Mohyeldin",
        credentials: "BDS, MSc",
        bio: "Experienced implantologist with over 15 years in oral surgery and implant dentistry. Holds a Master's degree in Oral and Maxillofacial Surgery and completed a five-year surgical residency. Specializes in immediate implant placement, sinus lifting, bone grafting, and full-mouth rehabilitation.",
        badges: ["MSc Oral & Maxillofacial Surgery", "15+ Years Experience"],
        imageUrl: "/images/instructors/dr-sameh-mohyeldin.png",
      },
      {
        name: "Dr. Sherif Elsharkawy",
        credentials: "BDS, MSc, MPros RCS Ed, MRD RCSEng, PhD",
        bio: "Senior Clinical Lecturer and Consultant in Prosthodontics at King's College London, Guy's and St Thomas' NHS Foundation Trust. Main focus areas include full-arch rehabilitation, digital workflows, and implant prosthodontics. Actively involved in research on enamel regeneration and biomaterials.",
        badges: ["King's College London", "Consultant Prosthodontist"],
        imageUrl: "/images/instructors/dr-sherif-elsharkawy.png",
      },
      {
        name: "Dr. Hisham Warda",
        credentials: "BDS, MSc, PhD",
        bio: "Lecturer in Periodontology and Implantology at Alexandria University with over 14 years of clinical experience. Special interests include soft and hard tissue grafting, guided implant placement, and full-arch cases. Runs a fully digital dental clinic in Alexandria and is a member of the American Academy of Facial Esthetics.",
        badges: ["Alexandria University", "Digital Dentistry Specialist"],
        imageUrl: "/images/instructors/dr-hisham-warda.png",
      },
    ],
    pricing: {
      earlyBird: {
        amount: "£6,995",
        until: "31 March 2026",
      },
      standard: {
        amount: "£7,995",
        from: "1 April 2026",
      },
      singleOccupancyUpgrade: "£500",
    },
    packageIncludes: [
      "Flights",
      "5-star accommodation",
      "Meals",
      "Transportation",
    ],
  },
  "full-arch-intensive": {
    registrationBadge: "Open Registration",
    dateRange: "17 May – 22 May, 2026",
    duration: "6 Days (All-inclusive clinical education trip)",
    location: "Alexandria, Egypt",
    overview: [
      "The Full Arch Intensive focuses on the All-on-X concept and full-arch implant reconstructions with immediacy and digital planning. This advanced course emphasizes advanced planning, digital workflows, fully and partially guided surgery, and immediate loading of two arches under direct supervision.",
      "This all-inclusive clinical education trip to Alexandria combines intensive learning with hands-on clinical experience. You will work on fixed two arches with immediate loading under direct supervision, mastering complex full-arch protocols from diagnosis through to definitive prostheses.",
    ],
    learningPoints: [
      "Advanced planning and digital workflows: fully guided workflows, partially guided with stents, and freehand principles",
      "Immediate loading of full arches: fixed two arches with immediate loading under direct supervision",
      "Full-arch immediacy: diagnosis, aesthetic–functional design, and risk governance",
      "Data fusion for planning: IOS–CBCT registration and reference prosthesis protocols",
      "Prosthetic-driven positioning: AP spread, tilt strategy, and MUA mapping",
      "Provisional conversion and soft-tissue architecture: chairside workflow to emergence control",
      "Verification to definitive: passive-fit science, MUA-level impressions (analog/digital), and lab mastery",
      "Stackable systems engineering: reduction design, pin geometry, and intra-op verification",
      "Immediate function decision science: stability metrics, load algorithms, and fail-safe pathways",
    ],
    agenda: [
      {
        day: "SUNDAY",
        date: "17 May",
        title: "Arrival & Welcome",
        time: "Evening",
        items: [
          "Arrival in Alexandria",
          "Welcome dinner",
        ],
      },
      {
        day: "MONDAY",
        date: "18 May",
        title: "Full-Arch Intensive Training Day",
        time: "Full Day",
        items: [
          "Full-Arch Immediacy: Diagnosis, Aesthetic–Functional Design & Risk Governance",
          "Data Fusion for Planning: IOS–CBCT Registration & Reference Prosthesis Protocols",
          "Prosthetic-Driven Positioning: AP Spread, Tilt Strategy & MUA Mapping",
          "Provisional Conversion & Soft-Tissue Architecture: Chairside Workflow to Emergence Control",
          "Verification to Definitive: Passive-Fit Science, MUA-Level Impressions (Analog/Digital) & Lab Mastery",
          "Stackable Systems Engineering: Reduction Design, Pin Geometry & Intra-op Verification",
          "Immediate Function Decision Science: Stability Metrics, Load Algorithms & Fail-Safe Pathways",
        ],
      },
      {
        day: "TUESDAY",
        date: "19 May",
        title: "Clinical Hands-On Training",
        time: "Full Day",
        items: [
          "Advanced full-arch protocols and clinical practice",
          "Supervised hands-on training",
        ],
      },
      {
        day: "WEDNESDAY",
        date: "20 May",
        title: "Clinical Hands-On Training",
        time: "Full Day",
        items: [
          "Advanced full-arch protocols and clinical practice",
          "Supervised hands-on training",
        ],
      },
      {
        day: "THURSDAY",
        date: "21 May",
        title: "Clinical Hands-On Training",
        time: "Full Day",
        items: [
          "Advanced full-arch protocols and clinical practice",
          "Supervised hands-on training",
        ],
      },
      {
        day: "FRIDAY",
        date: "22 May",
        title: "Departure",
        time: "Morning",
        items: [
          "Breakfast",
          "Airport transfers",
        ],
      },
    ],
    requirements: [],
    instructor: {
      name: "Kaleidoscope Faculty",
      credentials: "Expert Full-Arch Specialists",
      bio: "Led by experienced implantologists and prosthodontic specialists with extensive clinical and academic backgrounds in full-arch reconstruction.",
      badges: ["GDC Registered", "46 CPD Hours"],
    },
    instructors: [
      {
        name: "Dr. Sameh Mohyeldin",
        credentials: "BDS, MSc",
        bio: "Experienced implantologist with over 15 years in oral surgery and implant dentistry. Holds a Master's degree in Oral and Maxillofacial Surgery and completed a five-year surgical residency. Specializes in immediate implant placement, sinus lifting, bone grafting, and full-mouth rehabilitation.",
        badges: ["MSc Oral & Maxillofacial Surgery", "15+ Years Experience"],
        imageUrl: "/images/instructors/dr-sameh-mohyeldin.png",
      },
      {
        name: "Dr. Sherif Elsharkawy",
        credentials: "BDS, MSc, MPros RCS Ed, MRD RCSEng, PhD",
        bio: "Senior Clinical Lecturer and Consultant in Prosthodontics at King's College London, Guy's and St Thomas' NHS Foundation Trust. Main focus areas include full-arch rehabilitation, digital workflows, and implant prosthodontics. Actively involved in research on enamel regeneration and biomaterials.",
        badges: ["King's College London", "Consultant Prosthodontist"],
        imageUrl: "/images/instructors/dr-sherif-elsharkawy.png",
      },
      {
        name: "Dr. Hisham Warda",
        credentials: "BDS, MSc, PhD",
        bio: "Lecturer in Periodontology and Implantology at Alexandria University with over 15 years of clinical experience. Special interests include soft and hard tissue grafting, guided implant placement, and full-arch cases. Runs a fully digital dental clinic in Alexandria and is a member of the American Academy of Facial Esthetics.",
        badges: ["Alexandria University", "Digital Dentistry Specialist"],
        imageUrl: "/images/instructors/dr-hisham-warda.png",
      },
      {
        name: "Dr. David Veige",
        credentials: "DD, BDS, MJDF (RCS Eng.), MSc. Implantology, MClindent. Prosthodontics",
        bio: "Implant dentist with over 15 years of experience, special interest in guided surgery. Trained as a dental technician in Canada, then completed a dental degree in the UK. Completed advanced postgraduate training in implantology and prosthodontics. Extensive experience in planning, surgical, and prosthodontic elements of full jaw implant reconstructions.",
        badges: ["MSc Implantology", "MClindent Prosthodontics"],
        imageUrl: "/images/instructors/dr-david-veige.png",
      },
    ],
    pricing: {
      earlyBird: {
        amount: "£9,995",
        until: "31 March 2026",
      },
      standard: {
        amount: "£11,995",
        from: "1 April 2026",
      },
      singleOccupancyUpgrade: "£500",
    },
    packageIncludes: [
      "Return flights",
      "All ground transport",
      "Meals",
      "5-star accommodation",
    ],
  },
};

export function getCourseDetail(slug: string): CourseDetail | null {
  return courseDetails[slug] ?? null;
}
