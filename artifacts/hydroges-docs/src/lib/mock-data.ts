import type { User } from "@workspace/api-client-react";

// Known employees for the recipient selector in compose modal
export const mockUsers: User[] = [
  { id: 1,  name: "Ahmed Benali",   email: "ahmed.benali@hydroges.dz",   department: "Direction Générale",     avatarInitials: "AB" },
  { id: 2,  name: "Fatima Zohra",   email: "fatima.zohra@hydroges.dz",   department: "Ressources Humaines",    avatarInitials: "FZ" },
  { id: 3,  name: "Karim Mansouri", email: "karim.mansouri@hydroges.dz", department: "Finance",                 avatarInitials: "KM" },
  { id: 4,  name: "Sara Hadj",      email: "sara.hadj@hydroges.dz",      department: "Informatique",            avatarInitials: "SH" },
  { id: 5,  name: "Hassan Boudiaf", email: "hassan.boudiaf@hydroges.dz", department: "Operations",              avatarInitials: "HB" },
  { id: 6,  name: "Nadia Belkaid",  email: "nadia.belkaid@hydroges.dz",  department: "Hydraulique",             avatarInitials: "NB" },
  { id: 7,  name: "Omar Kheloufi",  email: "omar.kheloufi@hydroges.dz",  department: "Travaux",                 avatarInitials: "OK" },
  { id: 8,  name: "Leila Bouhali",  email: "leila.bouhali@hydroges.dz",  department: "Juridique",               avatarInitials: "LB" },
];

// No pre-seeded documents — only real user interactions are shown
export const mockDocuments: never[] = [];
