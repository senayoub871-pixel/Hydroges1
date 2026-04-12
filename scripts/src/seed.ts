import { pbkdf2Sync, randomBytes } from "crypto";
import { db } from "@workspace/db";
import { usersTable, documentsTable } from "@workspace/db/schema";

function generateSalt(): string {
  return randomBytes(16).toString("hex");
}

function hashPassword(password: string, salt: string): string {
  return pbkdf2Sync(password, salt, 10000, 32, "sha256").toString("hex");
}

async function seed() {
  console.log("Seeding database...");

  await db.delete(documentsTable);
  await db.delete(usersTable);

  const DEFAULT_PASSWORD = "Admin123!";

  const usersToInsert = [
    { name: "Ahmed Benali", email: "ahmed.benali@hydroges.dz", department: "Direction Générale", avatarInitials: "AB", loginId: "ahmed.benali", role: "Directeur Général" },
    { name: "Fatima Zohra", email: "fatima.zohra@hydroges.dz", department: "Ressources Humaines", avatarInitials: "FZ", loginId: "fatima.zohra", role: "Chef Bureau RH" },
    { name: "Karim Mansouri", email: "karim.mansouri@hydroges.dz", department: "Finance & Comptabilité", avatarInitials: "KM", loginId: "karim.mansouri", role: "Chef Service Finance" },
    { name: "Sara Hadj", email: "sara.hadj@hydroges.dz", department: "Informatique", avatarInitials: "SH", loginId: "sara.hadj", role: "Chef Bureau Informatique" },
    { name: "Hassan Boudiaf", email: "hassan.boudiaf@hydroges.dz", department: "Operations", avatarInitials: "HB", loginId: "hassan.boudiaf", role: "Chef Service Operations" },
    { name: "Nadia Belkaid", email: "nadia.belkaid@hydroges.dz", department: "Hydraulique", avatarInitials: "NB", loginId: "nadia.belkaid", role: "Directrice de l'Hydraulique" },
    { name: "Omar Kheloufi", email: "omar.kheloufi@hydroges.dz", department: "Travaux", avatarInitials: "OK", loginId: "omar.kheloufi", role: "Ingénieur Subdivisionnaire" },
    { name: "Leila Bouhali", email: "leila.bouhali@hydroges.dz", department: "Juridique", avatarInitials: "LB", loginId: "leila.bouhali", role: "Chef Service Juridique" },
  ];

  const insertValues = usersToInsert.map(u => {
    const salt = generateSalt();
    const hash = hashPassword(DEFAULT_PASSWORD, salt);
    return {
      ...u,
      companyNumber: "0125.6910.0681",
      passwordHash: hash,
      passwordSalt: salt,
    };
  });

  const [ahmed, fatima, karim, sara, hassan, nadia, omar, leila] = await db
    .insert(usersTable)
    .values(insertValues)
    .returning();

  await db.insert(documentsTable).values([
    {
      title: "Rapport Mensuel - Mars 2026",
      content: `RAPPORT MENSUEL\nMars 2026\n\nCe rapport présente un résumé complet des activités du mois de mars 2026.\n\n1. RÉSUMÉ EXÉCUTIF\nLes performances globales de l'entreprise ont été satisfaisantes pour ce mois. Nous avons atteint nos objectifs principaux et identifié plusieurs opportunités d'amélioration.\n\n2. INDICATEURS CLÉS\n- Chiffre d'affaires: 15,2 M DZD\n- Projets complétés: 8\n- Projets en cours: 12\n- Nouveaux clients: 3\n\n3. PROBLÈMES RENCONTRÉS\nQuelques retards ont été observés dans le département des opérations. Des mesures correctives ont été mises en place.\n\n4. PERSPECTIVES\nLe mois d'avril s'annonce prometteur avec plusieurs contrats en cours de finalisation.\n\nCordialement,\nAhmed Benali\nDirecteur Général`,
      status: "sent",
      senderId: ahmed.id,
      senderName: ahmed.name,
      recipientId: fatima.id,
      recipientName: fatima.name,
      recipientEmail: fatima.email,
      fileType: "PDF",
      fileSize: "245 KB",
      category: "Rapport",
    },
    {
      title: "Contrat de Maintenance - Équipements",
      content: `CONTRAT DE MAINTENANCE\n\nEntre les soussignés:\n\nHYDROGES S.P.A.\nSiège social: Alger, Algérie\nReprésentée par: Ahmed Benali\n\nEt:\n\nTechno Services SARL\nReprésentée par: Directeur Commercial\n\nOBJET DU CONTRAT:\nLe présent contrat a pour objet la maintenance préventive et corrective des équipements industriels de HYDROGES.\n\nDURÉE:\n12 mois à compter du 1er Avril 2026\n\nPRIX:\n500,000 DZD HT par an\n\nCONDITIONS:\n- Intervention sous 24h en cas de panne critique\n- Maintenance préventive mensuelle\n- Rapport d'intervention détaillé\n\nSigné à Alger, le 22 Mars 2026`,
      status: "sent",
      senderId: karim.id,
      senderName: karim.name,
      recipientId: ahmed.id,
      recipientName: ahmed.name,
      recipientEmail: ahmed.email,
      fileType: "DOCX",
      fileSize: "180 KB",
      category: "Contrat",
    },
    {
      title: "Note de Service - Politique de Congés 2026",
      content: `NOTE DE SERVICE\n\nDe: Direction des Ressources Humaines\nÀ: Tout le Personnel\nDate: 22 Mars 2026\nObjet: Politique de Congés 2026\n\nChers Collègues,\n\nNous vous informons des nouvelles dispositions concernant les congés annuels pour l'exercice 2026.\n\n1. DROITS AUX CONGÉS\nChaque employé dispose de 30 jours de congé annuel payé.\n\n2. PROCÉDURE DE DEMANDE\n- Les demandes doivent être soumises au minimum 15 jours avant la date souhaitée\n- Toutes les demandes doivent être validées par le responsable direct\n- Les demandes se font via le système informatique\n\nCordialement,\nFatima Zohra\nDirectrice des Ressources Humaines`,
      status: "scheduled",
      senderId: fatima.id,
      senderName: fatima.name,
      recipientId: hassan.id,
      recipientName: hassan.name,
      recipientEmail: hassan.email,
      scheduledAt: new Date("2026-04-01T09:00:00"),
      fileType: "PDF",
      fileSize: "120 KB",
      category: "Note de Service",
    },
    {
      title: "Analyse Budgétaire Q1 2026",
      content: `ANALYSE BUDGÉTAIRE\nPremier Trimestre 2026\n\nPRÉPARÉ PAR: Département Finance & Comptabilité\nDATE: Mars 2026\n\nRÉSUMÉ\nCe document présente l'analyse détaillée du budget du premier trimestre 2026.\n\nREVENUS\n- Janvier 2026: 4,8 M DZD\n- Février 2026: 5,1 M DZD\n- Mars 2026: 5,3 M DZD\n- TOTAL Q1: 15,2 M DZD\n\nDÉPENSES\n- Total: 12,0 M DZD\n\nRÉSULTAT BRUT: 3,2 M DZD`,
      status: "draft",
      senderId: karim.id,
      senderName: karim.name,
      recipientId: ahmed.id,
      recipientName: ahmed.name,
      recipientEmail: ahmed.email,
      fileType: "XLSX",
      fileSize: "320 KB",
      category: "Finance",
    },
    {
      title: "Invitation - Réunion Stratégique Q2",
      content: `INVITATION À LA RÉUNION\n\nObjet: Réunion Stratégique Q2 2026\nDate: Lundi 30 Mars 2026\nHeure: 10h00 - 12h00\nLieu: Salle de Conférence A, 3ème étage\n\nChers Collègues,\n\nJe vous invite à participer à notre réunion stratégique pour le deuxième trimestre 2026.\n\nCordialement,\nAhmed Benali\nDirecteur Général`,
      status: "sent",
      senderId: ahmed.id,
      senderName: ahmed.name,
      recipientId: hassan.id,
      recipientName: hassan.name,
      recipientEmail: hassan.email,
      fileType: "PDF",
      fileSize: "95 KB",
      category: "Communication",
    },
    {
      title: "Procédure de Sécurité Informatique",
      content: `PROCÉDURE DE SÉCURITÉ INFORMATIQUE\n\nDépartement: Informatique\nVersion: 2.1\nDate: Mars 2026\n\nOBJECTIF\nCe document définit les règles et procédures de sécurité informatique.\n\n1. POLITIQUE DES MOTS DE PASSE\n- Longueur minimale: 12 caractères\n- Renouvellement tous les 90 jours\n\n2. ACCÈS AUX SYSTÈMES\n- Chaque employé dispose d'un compte unique\n- Partage de compte formellement interdit\n\nApprouvé par: Direction Générale`,
      status: "sent",
      senderId: sara.id,
      senderName: sara.name,
      recipientId: fatima.id,
      recipientName: fatima.name,
      recipientEmail: fatima.email,
      fileType: "PDF",
      fileSize: "210 KB",
      category: "Procédure",
    },
    {
      title: "Avenant au Contrat de Travail - Karim Mansouri",
      content: `AVENANT AU CONTRAT DE TRAVAIL\n\nEntre:\nHYDROGES S.P.A., représentée par Ahmed Benali, Directeur Général\n\nEt:\nKarim Mansouri, Chef Service Finance & Comptabilité\n\nOBJET:\nLe présent avenant modifie le contrat de travail initial afin de refléter la nouvelle classification et la revalorisation salariale accordée suite à l'évaluation annuelle.\n\nARTICLE 1 - POSTE\nM. Karim Mansouri est confirmé dans ses fonctions de Chef Service Finance & Comptabilité.\n\nARTICLE 2 - RÉMUNÉRATION\nSon salaire mensuel brut est porté à 185 000 DZD à compter du 1er Avril 2026.\n\nCe document requiert la signature du destinataire pour validation.\n\nFait à Alger, le 24 Mars 2026\nAhmed Benali\nDirecteur Général`,
      status: "pending_validation",
      senderId: ahmed.id,
      senderName: ahmed.name,
      recipientId: karim.id,
      recipientName: karim.name,
      recipientEmail: karim.email,
      fileType: "PDF",
      fileSize: "155 KB",
      category: "Contrat",
    },
    {
      title: "Validation - Plan de Formation 2026",
      content: `DEMANDE DE VALIDATION\n\nObjet: Plan de Formation du Personnel 2026\n\nMadame la Directrice des Ressources Humaines,\n\nJe vous soumets ci-joint le plan de formation annuel pour validation et signature.\n\nCE PLAN COMPREND:\n- Formation en gestion de projet (15 agents)\n- Formation en hygiène et sécurité (tous les agents)\n- Formation en outils bureautiques (8 agents)\n- Formation en langue française (5 agents)\n\nBUDGET TOTAL PRÉVISIONNEL: 2 400 000 DZD\n\nMerci de bien vouloir valider ce document par votre signature afin de procéder aux inscriptions.\n\nCordialement,\nHassan Boudiaf\nChef Service Operations`,
      status: "pending_validation",
      senderId: hassan.id,
      senderName: hassan.name,
      recipientId: fatima.id,
      recipientName: fatima.name,
      recipientEmail: fatima.email,
      fileType: "DOCX",
      fileSize: "198 KB",
      category: "Formation",
    },
    {
      title: "Accord de Confidentialité - Projet Infrastructure",
      content: `ACCORD DE CONFIDENTIALITÉ\n\nEntre:\nHYDROGES S.P.A.\nReprésentée par: Nadia Belkaid, Directrice de l'Hydraulique\n\nEt:\nOmar Kheloufi, Ingénieur Subdivisionnaire\n\nARTICLE 1 - OBJET\nLe présent accord a pour objet de définir les conditions dans lesquelles les informations relatives au Projet d'Infrastructure Hydraulique 2026-2027 seront traitées.\n\nARTICLE 2 - ENGAGEMENTS\nLes parties s'engagent à:\n- Ne pas divulguer les informations confidentielles à des tiers\n- Utiliser ces informations uniquement dans le cadre du projet\n- Protéger les documents avec les mesures de sécurité appropriées\n\nARTICLE 3 - DURÉE\nCet accord est valable pour une durée de 3 ans.\n\nVotre signature est requise pour valider cet accord.\n\nFait à Alger, le 24 Mars 2026`,
      status: "pending_validation",
      senderId: nadia.id,
      senderName: nadia.name,
      recipientId: omar.id,
      recipientName: omar.name,
      recipientEmail: omar.email,
      fileType: "PDF",
      fileSize: "142 KB",
      category: "Juridique",
    },
  ]);

  console.log("Database seeded successfully!");
  console.log("Default password for all seeded accounts: Admin123!");
}

seed().catch(console.error).finally(() => process.exit(0));
