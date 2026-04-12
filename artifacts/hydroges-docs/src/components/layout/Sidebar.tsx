import { useLocation } from "wouter";
import { useState } from "react";
import { ComposeModal } from "@/components/documents/ComposeModal";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";

const navItems = [
  { href: "/inbox",     label: "Listes des documents" },
  { href: "/pending",   label: "Documents en cours de validation" },
  { href: "/sent",      label: "Documents envoyés" },
  { href: "/scheduled", label: "Envois programmés" },
  { href: "/outbox",    label: "Boite d'envoi" },
  { href: "/drafts",    label: "Brouillons" },
  { href: "/market",    label: "Marché d'un projet" },
  { href: "/claims",    label: "Réclamations" },
  { href: "/settings",  label: "Paramètres" },
];

export function Sidebar() {
  const [location, navigate] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <>
      {/* Sidebar panel */}
      <div
        style={{
          width: collapsed ? 0 : "17rem",
          minWidth: collapsed ? 0 : "17rem",
          overflow: "hidden",
          transition: "width 0.25s ease, min-width 0.25s ease",
          background: "white",
          borderRight: "2px solid #dde0f0",
          display: "flex",
          flexDirection: "column",
          zIndex: 10,
        }}
      >
        <nav style={{ flex: 1, paddingTop: "0.5rem" }}>
          {navItems.map((item) => {
            const isActive = location === item.href || (location === "/" && item.href === "/inbox");
            const isHovered = hoveredItem === item.href;
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "0.7rem 1.25rem",
                  fontSize: "0.875rem",
                  fontWeight: isActive ? 700 : 600,
                  color: "#1e1b6b",
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                  borderBottom: "1px solid #eceef8",
                  borderLeft: isActive ? "3px solid #5b4d90" : "3px solid transparent",
                  background: isActive
                    ? "linear-gradient(90deg, #ebe9f6, #f5f4fb)"
                    : isHovered
                    ? "#f5f4fb"
                    : "transparent",
                  cursor: "pointer",
                  transition: "background 0.15s, border-left-color 0.15s",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Collapse toggle tab */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          position: "absolute",
          left: collapsed ? 0 : "17rem",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 20,
          width: "1.4rem",
          height: "2.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "white",
          border: "1.5px solid #dde0f0",
          borderLeft: "none",
          borderRadius: "0 6px 6px 0",
          boxShadow: "2px 0 6px rgba(30,27,107,0.08)",
          cursor: "pointer",
          transition: "left 0.25s ease",
          color: "#7b72b0",
        }}
      >
        {collapsed ? <ChevronRight style={{ width: 14, height: 14 }} /> : <ChevronLeft style={{ width: 14, height: 14 }} />}
      </button>

      {/* Floating "Nouveau document" button */}
      <button
        onClick={() => setIsComposeOpen(true)}
        style={{
          position: "fixed",
          bottom: "1.75rem",
          right: "1.75rem",
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "#5b4d90",
          color: "white",
          border: "none",
          borderRadius: "2rem",
          padding: "0.65rem 1.4rem",
          fontSize: "0.9rem",
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 4px 18px rgba(91,77,144,0.35)",
          transition: "background 0.15s, transform 0.1s, box-shadow 0.15s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "#4a3d80";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 24px rgba(91,77,144,0.45)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "#5b4d90";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 18px rgba(91,77,144,0.35)";
        }}
      >
        <Pencil style={{ width: 16, height: 16 }} />
        Nouveau document
      </button>

      <ComposeModal open={isComposeOpen} onOpenChange={setIsComposeOpen} />
    </>
  );
}
