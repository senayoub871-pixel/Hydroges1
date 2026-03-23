import { Link, useLocation, useSearch } from "wouter";
import { cn } from "@/lib/utils";
import { 
  FileText, Clock, Send, FileEdit, Inbox,
  Briefcase, MessageSquareWarning, Settings, ChevronLeft, SendHorizonal
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const [currentPath] = useLocation();
  const currentSearch = useSearch();
  const currentType = new URLSearchParams(currentSearch).get("type");

  const menuItems = [
    { id: "all",       label: "Tous les documents",              icon: FileText,             path: "/",                    type: null },
    { id: "inbox",     label: "Boîte de réception",             icon: Inbox,                path: "/?type=inbox",         type: "inbox" },
    { id: "outbox",    label: "Boîte d'envoi",                   icon: SendHorizonal,        path: "/?type=outbox",        type: "outbox" },
    { id: "sent",      label: "Documents envoyés",               icon: Send,                 path: "/?type=sent",          type: "sent" },
    { id: "pending",   label: "En cours de validation",          icon: Clock,                path: "/?type=pending_validation", type: "pending_validation" },
    { id: "scheduled", label: "Envois programmés",               icon: Clock,                path: "/?type=scheduled",     type: "scheduled" },
    { id: "drafts",    label: "Brouillons",                      icon: FileEdit,             path: "/?type=drafts",        type: "drafts" },
    { id: "market",    label: "Marché d'un projet",              icon: Briefcase,            path: "/market",              type: "__page__" },
    { id: "complaints",label: "Réclamations",                    icon: MessageSquareWarning, path: "/complaints",          type: "__page__" },
    { id: "settings",  label: "Paramètres",                      icon: Settings,             path: "/settings",            type: "__page__" },
  ];

  const isActive = (item: typeof menuItems[0]) => {
    if (item.type === "__page__") return currentPath === item.path;
    if (item.id === "all") return currentPath === "/" && !currentType;
    return currentType === item.type;
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col bg-card border-r border-border/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out h-[calc(100vh-80px)]",
        isOpen ? "w-72" : "w-0 overflow-hidden opacity-0"
      )}
    >
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.id}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative",
                  active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-r-full" />
                )}
                <item.icon className={cn("w-5 h-5 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-primary/70")} />
                <span className="text-sm truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-4 top-6 w-8 h-8 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:shadow-md transition-all z-10"
      >
        <ChevronLeft className={cn("w-4 h-4 transition-transform duration-300", !isOpen && "rotate-180")} />
      </button>
    </aside>
  );
}
