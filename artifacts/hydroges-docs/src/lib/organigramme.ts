export interface OrgService {
  label: string;
  postes: string[];
}

export const ORGANIGRAMME: OrgService[] = [
  {
    label: "Direction",
    postes: [
      "Directeur des Ressources en Eau de la Wilaya de Tlemcen",
    ],
  },
  {
    label: "Service de la Mobilisation des Ressources en Eau",
    postes: [
      "Chef de Service de la Mobilisation des Ressources en Eau",
      "Chef Bureau de la Mobilisation des Eaux Superficielles",
      "Chef Bureau de la Mobilisation des Eaux Souterraines",
      "Chef Bureau du Suivi de la Gestion et de l'Exploitation des Ouvrages de Mobilisation des Eaux et de la Protection du Domaine Public",
      "Employé",
    ],
  },
  {
    label: "Service de l'Alimentation en Eau Potable",
    postes: [
      "Chef de Service de l'Alimentation en Eau Potable",
      "Chef Bureau des Études et de la Programmation des Projets",
      "Chef Bureau du Suivi de la Réalisation des Projets",
      "Chef Bureau du Service Public de l'Alimentation en Eau",
      "Employé",
    ],
  },
  {
    label: "Service de l'Assainissement",
    postes: [
      "Chef de Service de l'Assainissement",
      "Chef Bureau des Études et de la Programmation des Projets",
      "Chef Bureau du Suivi de la Réalisation des Projets",
      "Chef Bureau du Service Public d'Assainissement et de la Protection de la Ressource",
      "Employé",
    ],
  },
  {
    label: "Service de l'Hydraulique Agricole",
    postes: [
      "Chef de Service de l'Hydraulique Agricole",
      "Chef Bureau des Études et des Travaux",
      "Chef Bureau du Suivi de la Gestion et de l'Exploitation",
      "Employé",
    ],
  },
  {
    label: "Service de l'Administration des Moyens",
    postes: [
      "Chef de Service de l'Administration des Moyens",
      "Chef Bureau du Budget, de la Comptabilité et du Patrimoine",
      "Chef Bureau du Contentieux, de la Réglementation et des Marchés Publics",
      "Chef Bureau des Ressources Humaines et de la Formation",
      "Employé",
    ],
  },
];

export const ALL_SERVICES = ORGANIGRAMME.map((s) => s.label);

export function getPostesForService(service: string): string[] {
  return ORGANIGRAMME.find((s) => s.label === service)?.postes ?? [];
}
