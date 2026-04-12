import { Router, type IRouter } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "../middlewares/auth";

function getSupabase() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_KEY"];
  if (!url || !key) throw new Error("SUPABASE_URL or SUPABASE_SERVICE_KEY not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

const router: IRouter = Router();

// GET /api/external/complaints — reads from Supabase `claims` table
router.get("/complaints", requireAuth, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("claims")
      .select("id, first_name, last_name, wilaya, commune, complaint, attachment_url, attachment_name, status, notes, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch claims");
    res.status(500).json({ error: "Impossible de récupérer les réclamations" });
  }
});

// PATCH /api/external/complaints/:id/status
router.patch("/complaints/:id/status", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body as { status: string };
    const allowed = ["pending", "reviewed", "closed"];
    if (!allowed.includes(status)) {
      res.status(400).json({ error: "Statut invalide" });
      return;
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("claims")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) { res.status(404).json({ error: "Réclamation introuvable" }); return; }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to update claim status");
    res.status(500).json({ error: "Impossible de mettre à jour le statut" });
  }
});

// PATCH /api/external/complaints/:id/notes
router.patch("/complaints/:id/notes", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { notes } = req.body as { notes: string };

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("claims")
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) { res.status(404).json({ error: "Réclamation introuvable" }); return; }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to update claim notes");
    res.status(500).json({ error: "Impossible de mettre à jour les notes" });
  }
});

// GET /api/external/marches — reads from Supabase `market` table
router.get("/marches", requireAuth, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("market")
      .select("id, first_name, last_name, email, phone, wilaya, commune, project_title, project_type, project_description, budget, attachment_url, attachment_name, status, notes, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch market entries");
    res.status(500).json({ error: "Impossible de récupérer les marchés" });
  }
});

// PATCH /api/external/marches/:id/status
router.patch("/marches/:id/status", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body as { status: string };
    const allowed = ["pending", "reviewed", "accepted", "rejected"];
    if (!allowed.includes(status)) {
      res.status(400).json({ error: "Statut invalide" });
      return;
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("market")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) { res.status(404).json({ error: "Entrée introuvable" }); return; }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to update market status");
    res.status(500).json({ error: "Impossible de mettre à jour le statut" });
  }
});

// PATCH /api/external/marches/:id/notes
router.patch("/marches/:id/notes", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { notes } = req.body as { notes: string };

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("market")
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) { res.status(404).json({ error: "Entrée introuvable" }); return; }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to update market notes");
    res.status(500).json({ error: "Impossible de mettre à jour les notes" });
  }
});

export default router;
