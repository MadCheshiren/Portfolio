export type CredentialItem = {
  id: string;
  code: string;
  title: string;
  shortTitle: string;
  issuer: string;
  category: string;
  description: string;
  highlights: string[];
  image: string;
  accentHex: string;
  wallX: number;
  wallY: number;
  wallTilt: number;
};

export const CREDENTIALS_CATALOG: CredentialItem[] = [
  {
    id: "oracle-java-fundamentals",
    code: "CERT // 01",
    title: "Java Fundamentals",
    shortTitle: "Oracle Java",
    issuer: "Oracle Academy",
    category: "Oracle Certified Professional",
    description:
      "Core Java programming concepts, object-oriented architecture, and application development fundamentals certified by Oracle Academy.",
    highlights: [
      "Object-Oriented System Design",
      "Control Flow & Exception Safety",
      "Java SE Core Foundations",
    ],
    image: "/certs/oracle-java-fundamentals.webp",
    accentHex: "#933B5B",
    wallX: -1.78,
    wallY: 2.66,
    wallTilt: 0.025,
  },
  {
    id: "tesda-completion",
    code: "CERT // 02",
    title: "Certificate of Completion",
    shortTitle: "TESDA Competency",
    issuer: "TESDA",
    category: "Competency Assessment",
    description:
      "Technical Education and Skills Development Authority — industry-relevant technical training, cybersecurity fundamentals, and competency certification.",
    highlights: [
      "Cybersecurity & Identity Basics",
      "Infrastructure Compliance",
      "National Competency Assessment",
    ],
    image: "/certs/tesda-completion.webp",
    accentHex: "#4d6b57",
    wallX: 1.78,
    wallY: 2.66,
    wallTilt: -0.025,
  },
];
