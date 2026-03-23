import { getFirestore } from "firebase/firestore";
import { app } from "./config";

export const db = getFirestore(app);

export const COLLECTIONS = {
  courses: "courses",
  registrations: "registrations",
  enquiries: "enquiries",
  authAuditLogs: "authAuditLogs",
  loginRateLimits: "loginRateLimits",
  blog: "blog",
  categories: "categories",
  settings: "settings",
  instructors: "instructors",
  students: "students",
  testimonials: "testimonials",
  cases: "cases",
} as const;
