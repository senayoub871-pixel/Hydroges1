import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFrenchDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'sent': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'pending_validation': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'received': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'failed': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case 'sent': return 'Envoyé';
    case 'scheduled': return 'Programmé';
    case 'pending_validation': return 'En attente';
    case 'draft': return 'Brouillon';
    case 'received': return 'Reçu';
    case 'failed': return 'Échoué';
    default: return status;
  }
}
