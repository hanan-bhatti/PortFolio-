"use client";

/**
 * @file components/admin/ResumeAdmin.tsx
 * @description React component for ResumeAdmin.tsx under the admin category.
 * 
 * @exports
 * - ResumeAdmin (default): Main React component or function
 */

import { useState, useTransition, useCallback } from "react";
import Link from "next/link";
import SkillIcon from "@/components/ui/SkillIcon";
import EditorialModal from "./EditorialModal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { UploadButton } from "@/lib/uploadthing";
import { compressImages } from "@/lib/image-compress";
import Image from "next/image";

type Settings = Record<string, string>;
type EducationItem = {
  id: string;
  degree: string;
  institution: string;
  field: string | null;
  startYear: string;
  endYear: string | null;
  current: boolean;
  description: string | null;
  order: number;
};
type CertItem = {
  id: string;
  name: string;
  issuer: string;
  year: string | null;
  url: string | null;
  order: number;
};
type ExperienceItem = {
  id: string;
  role: string;
  company: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string;
  order: number;
};
type SkillItem = {
  id: string;
  name: string;
  icon: string | null;
  level: number;
  category: string;
  order: number;
};

const TABS = ["Personal", "Experience", "Education", "Skills", "Certifications", "Downloads"] as const;
type Tab = (typeof TABS)[number];

// ─── Drag handle ────────────────────────────────────────────────────────────
function DragHandle({ listeners, attributes }: { listeners: any; attributes: any }) {
  return (
    <span
      {...listeners}
      {...attributes}
      style={{ cursor: "grab", color: "var(--text-muted)", fontSize: 18, paddingRight: 8, touchAction: "none" }}
      title="Drag to reorder"
    >
      ⠿
    </span>
  );
}

// ─── Sortable Education Row ──────────────────────────────────────────────────
function SortableEducationRow({
  item,
  onDelete,
  onEdit,
}: {
  item: EducationItem;
  onDelete: (id: string) => void;
  onEdit: (item: EducationItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="resume-row">
      <DragHandle listeners={listeners} attributes={attributes} />
      <div style={{ flex: 1 }}>
        <span style={{ fontWeight: 600, color: "#fff" }}>{item.degree}</span>
        <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>@ {item.institution}</span>
        {item.field && <span style={{ color: "var(--text-muted)", marginLeft: 4 }}>· {item.field}</span>}
        <span style={{ color: "var(--text-muted)", marginLeft: 8, fontSize: 12 }}>
          {item.startYear} – {item.current ? "Present" : item.endYear}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="resume-btn-ghost" onClick={() => onEdit(item)}>Edit</button>
        <button className="resume-btn-danger" onClick={() => onDelete(item.id)}>Delete</button>
      </div>
    </div>
  );
}

// ─── Sortable Cert Row ───────────────────────────────────────────────────────
function SortableCertRow({
  item,
  onDelete,
  onEdit,
}: {
  item: CertItem;
  onDelete: (id: string) => void;
  onEdit: (item: CertItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="resume-row">
      <DragHandle listeners={listeners} attributes={attributes} />
      <div style={{ flex: 1 }}>
        <span style={{ fontWeight: 600, color: "#fff" }}>{item.name}</span>
        <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>· {item.issuer}</span>
        {item.year && <span style={{ color: "var(--text-muted)", marginLeft: 8, fontSize: 12 }}>{item.year}</span>}
        {item.url && (
          <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8, color: "var(--amber)", fontSize: 12 }}>
            ↗ Link
          </a>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="resume-btn-ghost" onClick={() => onEdit(item)}>Edit</button>
        <button className="resume-btn-danger" onClick={() => onDelete(item.id)}>Delete</button>
      </div>
    </div>
  );
}

// ─── Personal Tab ────────────────────────────────────────────────────────────
function PersonalTab({ settings, onSaved }: { settings: Settings; onSaved: (s: Settings) => void }) {
  const [form, setForm] = useState<Settings>(settings);
  const [saving, startSave] = useTransition();

  const save = () => {
    startSave(async () => {
      const res = await fetch("/api/admin/resume/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        onSaved(form);
        toast.success("Saved");
      } else {
        toast.error("Failed to save");
      }
    });
  };

  const field = (key: string, label: string, type: "text" | "textarea" | "toggle" = "text") => (
    <div className="resume-field" key={key}>
      <label className="resume-label">{label}</label>
      {type === "textarea" ? (
        <textarea
          className="resume-input"
          rows={4}
          value={form[key] ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        />
      ) : type === "toggle" ? (
        <button
          type="button"
          onClick={() => setForm((p) => ({ ...p, [key]: p[key] === "true" ? "false" : "true" }))}
          style={{
            padding: "6px 16px",
            border: "1px solid var(--border)",
            background: form[key] === "true" ? "var(--amber)" : "transparent",
            color: form[key] === "true" ? "#000" : "var(--text-muted)",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {form[key] === "true" ? "Enabled" : "Disabled"}
        </button>
      ) : (
        <input
          className="resume-input"
          value={form[key] ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        />
      )}
    </div>
  );

  const photoField = (key: string, label: string) => (
    <div className="resume-field" key={key}>
      <label className="resume-label">{label}</label>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input
          className="resume-input"
          style={{ flex: 1, minWidth: 200 }}
          value={form[key] ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
          placeholder="https://..."
        />
        <UploadButton
          endpoint="imageUploader"
          onBeforeUploadBegin={async (files: File[]) => {
            toast.loading("Compressing and uploading image...", { id: `resume-upload-${key}` });
            return compressImages(files);
          }}
          onClientUploadComplete={(res) => {
            const url = res?.[0]?.url;
            if (url) {
              setForm((p) => ({ ...p, [key]: url }));
              toast.success("Image uploaded successfully", { id: `resume-upload-${key}` });
            }
          }}
          onUploadError={(err) => {
            toast.error(`Upload failed: ${err.message}`, { id: `resume-upload-${key}` });
          }}
          appearance={{ button: { background: "var(--amber)", color: "#000", fontWeight: 700, fontSize: 12, padding: "6px 14px", border: "none", cursor: "pointer" }, allowedContent: { display: "none" } }}
        />
      </div>
      {form[key] && (
        <div style={{ marginTop: 8 }}>
          <Image src={form[key]} alt={label} width={80} height={80} style={{ objectFit: "cover", border: "1px solid var(--border)" }} />
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {field("resume_enabled", "Resume Page Enabled", "toggle")}
      {field("resume_name", "Full Name")}
      {field("resume_title", "Job Title / Headline")}
      {field("resume_email", "Email")}
      {field("resume_phone", "Phone")}
      {field("resume_location", "Location")}
      {field("resume_summary", "Professional Summary", "textarea")}
      {photoField("resume_photo_url", "Profile Photo (for resume)")}
      {photoField("resume_hero_photo_url", "Hero Photo (alternate)")}

      <div style={{ paddingTop: 8 }}>
        <button className="resume-btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save Personal Info"}
        </button>
      </div>
    </div>
  );
}

// ─── Experience Tab ──────────────────────────────────────────────────────────
function ExperienceTab({ experience }: { experience: ExperienceItem[] }) {
  return (
    <div>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>
        Manage experience entries from the{" "}
        <Link href="/admin/experience" style={{ color: "var(--amber)" }}>Experience admin page</Link>.
        They are automatically included in your resume.
      </p>
      {experience.length === 0 && (
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No experience entries yet.</p>
      )}
      {experience.map((exp) => (
        <div key={exp.id} className="resume-row" style={{ marginBottom: 8, cursor: "default" }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 600, color: "#fff" }}>{exp.role}</span>
            <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>@ {exp.company}</span>
            {exp.location && <span style={{ color: "var(--text-muted)", marginLeft: 8, fontSize: 12 }}>· {exp.location}</span>}
          </div>
          <Link href="/admin/experience" className="resume-btn-ghost" style={{ textDecoration: "none" }}>Edit</Link>
        </div>
      ))}
    </div>
  );
}

// ─── Education Tab ───────────────────────────────────────────────────────────
function EducationTab({ initial }: { initial: EducationItem[] }) {
  const [items, setItems] = useState(initial);
  const [editItem, setEditItem] = useState<EducationItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, startSave] = useTransition();
  const [form, setForm] = useState({ degree: "", institution: "", field: "", startYear: "", endYear: "", current: false, description: "" });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const resetForm = () => {
    setForm({ degree: "", institution: "", field: "", startYear: "", endYear: "", current: false, description: "" });
    setEditItem(null);
    setShowForm(false);
  };

  const openEdit = (item: EducationItem) => {
    setForm({
      degree: item.degree,
      institution: item.institution,
      field: item.field ?? "",
      startYear: item.startYear,
      endYear: item.endYear ?? "",
      current: item.current,
      description: item.description ?? "",
    });
    setEditItem(item);
    setShowForm(true);
  };

  const handleSave = () => {
    startSave(async () => {
      if (!form.degree.trim() || !form.institution.trim() || !form.startYear.trim()) {
        toast.error("Degree, institution and start year are required");
        return;
      }
      const url = editItem ? `/api/admin/resume/education/${editItem.id}` : "/api/admin/resume/education";
      const method = editItem ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, order: editItem?.order ?? items.length }),
      });
      if (!res.ok) { toast.error("Failed to save"); return; }
      const saved = await res.json();
      if (editItem) {
        setItems((prev) => prev.map((i) => (i.id === saved.id ? saved : i)));
      } else {
        setItems((prev) => [...prev, saved]);
      }
      toast.success(editItem ? "Updated" : "Added");
      resetForm();
    });
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    startSave(async () => {
      const res = await fetch(`/api/admin/resume/education/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== deleteId));
        toast.success("Deleted");
      } else {
        toast.error("Failed to delete");
      }
    });
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex).map((item, idx) => ({ ...item, order: idx }));
      // persist order
      Promise.all(
        reordered.map((item) =>
          fetch(`/api/admin/resume/education/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: item.order }),
          })
        )
      ).catch(() => toast.error("Failed to save order"));
      return reordered;
    });
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="resume-btn-primary" onClick={() => setShowForm(true)}>+ Add Education</button>
      </div>

      {showForm && (
        <div className="resume-form-card">
          <h3 style={{ color: "#fff", fontWeight: 700, marginBottom: 16 }}>{editItem ? "Edit Education" : "Add Education"}</h3>
          {["degree", "institution", "field"].map((k) => (
            <div className="resume-field" key={k}>
              <label className="resume-label" style={{ textTransform: "capitalize" }}>{k}{k === "field" ? " (optional)" : ""}</label>
              <input className="resume-input" value={(form as any)[k]} onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))} />
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="resume-field">
              <label className="resume-label">Start Year</label>
              <input className="resume-input" value={form.startYear} onChange={(e) => setForm((p) => ({ ...p, startYear: e.target.value }))} placeholder="2020" />
            </div>
            <div className="resume-field">
              <label className="resume-label">End Year</label>
              <input className="resume-input" value={form.endYear} disabled={form.current} onChange={(e) => setForm((p) => ({ ...p, endYear: e.target.value }))} placeholder="2024" />
            </div>
          </div>
          <div className="resume-field">
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "var(--text-muted)", fontSize: 13 }}>
              <input type="checkbox" checked={form.current} onChange={(e) => setForm((p) => ({ ...p, current: e.target.checked, endYear: "" }))} />
              Currently studying here
            </label>
          </div>
          <div className="resume-field">
            <label className="resume-label">Description (optional)</label>
            <textarea className="resume-input" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="resume-btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            <button className="resume-btn-ghost" onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}

      {items.length === 0 && !showForm && <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No education entries yet.</p>}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <SortableEducationRow key={item.id} item={item} onDelete={handleDelete} onEdit={openEdit} />
          ))}
        </SortableContext>
      </DndContext>

      <EditorialModal
        isOpen={deleteId !== null}
        type="danger"
        title="Delete Education Entry?"
        description="Are you sure you want to permanently delete this education entry from your resume? This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

// ─── Skills Tab ──────────────────────────────────────────────────────────────
function SkillsTab({ skills }: { skills: SkillItem[] }) {
  return (
    <div>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>
        Manage skills from the{" "}
        <Link href="/admin/skills" style={{ color: "var(--amber)" }}>Skills admin page</Link>.
        They are automatically included in your resume.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
        {skills.map((s) => (
          <div key={s.id} style={{ padding: "10px 14px", border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#fff", fontWeight: 600, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
                {s.icon && <SkillIcon name={s.icon} size={14} className="text-green" />}
                {s.name}
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{s.level}%</span>
            </div>
            <div style={{ marginTop: 6, background: "var(--border)", height: 3 }}>
              <div style={{ background: "var(--amber)", height: "100%", width: `${s.level}%` }} />
            </div>
            <span style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 4, display: "block" }}>{s.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Certifications Tab ──────────────────────────────────────────────────────
function CertificationsTab({ initial }: { initial: CertItem[] }) {
  const [items, setItems] = useState(initial);
  const [editItem, setEditItem] = useState<CertItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, startSave] = useTransition();
  const [form, setForm] = useState({ name: "", issuer: "", year: "", url: "" });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const resetForm = () => {
    setForm({ name: "", issuer: "", year: "", url: "" });
    setEditItem(null);
    setShowForm(false);
  };

  const openEdit = (item: CertItem) => {
    setForm({ name: item.name, issuer: item.issuer, year: item.year ?? "", url: item.url ?? "" });
    setEditItem(item);
    setShowForm(true);
  };

  const handleSave = () => {
    startSave(async () => {
      if (!form.name.trim() || !form.issuer.trim()) { toast.error("Name and issuer are required"); return; }
      const url = editItem ? `/api/admin/resume/certifications/${editItem.id}` : "/api/admin/resume/certifications";
      const method = editItem ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, order: editItem?.order ?? items.length }),
      });
      if (!res.ok) { toast.error("Failed to save"); return; }
      const saved = await res.json();
      if (editItem) {
        setItems((prev) => prev.map((i) => (i.id === saved.id ? saved : i)));
      } else {
        setItems((prev) => [...prev, saved]);
      }
      toast.success(editItem ? "Updated" : "Added");
      resetForm();
    });
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    startSave(async () => {
      const res = await fetch(`/api/admin/resume/certifications/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== deleteId));
        toast.success("Deleted");
      } else {
        toast.error("Failed to delete");
      }
    });
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex).map((item, idx) => ({ ...item, order: idx }));
      Promise.all(
        reordered.map((item) =>
          fetch(`/api/admin/resume/certifications/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: item.order }),
          })
        )
      ).catch(() => toast.error("Failed to save order"));
      return reordered;
    });
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="resume-btn-primary" onClick={() => setShowForm(true)}>+ Add Certification</button>
      </div>

      {showForm && (
        <div className="resume-form-card">
          <h3 style={{ color: "#fff", fontWeight: 700, marginBottom: 16 }}>{editItem ? "Edit Certification" : "Add Certification"}</h3>
          {([["name", "Certificate Name"], ["issuer", "Issuing Organization"], ["year", "Year (optional)"], ["url", "URL (optional)"]] as [string, string][]).map(([k, l]) => (
            <div className="resume-field" key={k}>
              <label className="resume-label">{l}</label>
              <input className="resume-input" value={(form as any)[k]} onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))} />
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="resume-btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            <button className="resume-btn-ghost" onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}

      {items.length === 0 && !showForm && <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No certifications yet.</p>}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <SortableCertRow key={item.id} item={item} onDelete={handleDelete} onEdit={openEdit} />
          ))}
        </SortableContext>
      </DndContext>

      <EditorialModal
        isOpen={deleteId !== null}
        type="danger"
        title="Delete Certification?"
        description="Are you sure you want to permanently delete this certification from your resume? This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

// ─── Downloads Tab ───────────────────────────────────────────────────────────
type Download = { id: string; visitorIp: string | null; country: string | null; city: string | null; userAgent: string | null; downloadedAt: string };

function DownloadsTab({ initial }: { initial: Download[] }) {
  return (
    <div>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>
        {initial.length} download{initial.length !== 1 ? "s" : ""} tracked
      </p>
      {initial.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No downloads yet.</p>}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "Inter, sans-serif" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Date", "IP", "Location", "Browser / OS"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "var(--text-muted)", fontWeight: 600, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {initial.map((d) => (
              <tr key={d.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>{new Date(d.downloadedAt).toLocaleString()}</td>
                <td style={{ padding: "10px 12px", color: "#fff" }}>{d.visitorIp ?? "—"}</td>
                <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>{[d.city, d.country].filter(Boolean).join(", ") || "—"}</td>
                <td style={{ padding: "10px 12px", color: "var(--text-muted)", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={d.userAgent ?? ""}>{d.userAgent ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
interface Props {
  settings: Settings;
  education: EducationItem[];
  certifications: CertItem[];
  experience: ExperienceItem[];
  skills: SkillItem[];
  downloads: Download[];
}

export default function ResumeAdmin({ settings, education, certifications, experience, skills, downloads }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Personal");
  const [currentSettings, setCurrentSettings] = useState(settings);

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: 28, overflowX: "auto" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 20px",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid var(--amber)" : "2px solid transparent",
              background: "transparent",
              color: activeTab === tab ? "var(--amber)" : "var(--text-muted)",
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              fontWeight: activeTab === tab ? 700 : 400,
              cursor: "pointer",
              transition: "color 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Personal" && <PersonalTab settings={currentSettings} onSaved={setCurrentSettings} />}
      {activeTab === "Experience" && <ExperienceTab experience={experience} />}
      {activeTab === "Education" && <EducationTab initial={education} />}
      {activeTab === "Skills" && <SkillsTab skills={skills} />}
      {activeTab === "Certifications" && <CertificationsTab initial={certifications} />}
      {activeTab === "Downloads" && <DownloadsTab initial={downloads} />}

      <style>{`
        .resume-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: 1px solid var(--border);
          background: var(--bg-elevated);
          margin-bottom: 8px;
        }
        .resume-form-card {
          padding: 24px;
          border: 1px solid var(--border);
          background: var(--bg-elevated);
        }
        .resume-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
        }
        .resume-label {
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .resume-input {
          background: var(--bg);
          border: 1px solid var(--border);
          color: #fff;
          padding: 8px 12px;
          font-family: Inter, sans-serif;
          font-size: 14px;
          outline: none;
          width: 100%;
          box-sizing: border-box;
          resize: vertical;
        }
        .resume-input:focus {
          border-color: var(--amber);
        }
        .resume-btn-primary {
          background: var(--amber);
          color: #000;
          border: none;
          padding: 8px 20px;
          font-family: Inter, sans-serif;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }
        .resume-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .resume-btn-ghost {
          background: transparent;
          color: var(--text-muted);
          border: 1px solid var(--border);
          padding: 6px 14px;
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .resume-btn-ghost:hover {
          color: #fff;
        }
        .resume-btn-danger {
          background: transparent;
          color: #f87171;
          border: 1px solid #f87171;
          padding: 6px 14px;
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }
        .resume-btn-danger:hover {
          opacity: 0.75;
        }
      `}</style>
    </div>
  );
}
