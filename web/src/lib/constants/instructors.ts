export type Instructor = {
  name: string;
  credentials: string;
  tagline: string;
  imageUrl: string;
};

export const INSTRUCTORS: Instructor[] = [
  {
    name: "Dr. Sameh Mohyeldin",
    credentials: "BDS, MSc",
    tagline: "Oral surgery & implantology · 15+ years",
    imageUrl: "/images/instructors/dr-sameh-mohyeldin.png",
  },
  {
    name: "Dr. Sherif Elsharkawy",
    credentials: "BDS, MSc, MPros RCS Ed, MRD RCSEng, PhD",
    tagline: "Consultant Prosthodontist, King's College London",
    imageUrl: "/images/instructors/dr-sherif-elsharkawy.png",
  },
  {
    name: "Dr. Hisham Warda",
    credentials: "BDS, MSc, PhD",
    tagline: "Periodontology & implantology · Digital dentistry",
    imageUrl: "/images/instructors/dr-hisham-warda.png",
  },
  {
    name: "Dr. David Veige",
    credentials: "DD, BDS, MJDF, MSc. Implantology, MClindent. Prosthodontics",
    tagline: "Full-arch reconstruction · Guided surgery",
    imageUrl: "/images/instructors/dr-david-veige.png",
  },
];
