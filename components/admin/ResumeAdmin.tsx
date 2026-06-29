"use client";

/**
 * @file components/admin/ResumeAdmin.tsx
 * @description React component for ResumeAdmin.tsx under the admin category.
 * 
 * @exports
 * - ResumeAdmin (default): Main React component or function
 */

import { useState, useTransition, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import SkillIcon from "@/components/ui/SkillIcon";
import EditorialModal from "./EditorialModal";
import {
  FiArrowUp,
  FiArrowDown,
  FiTrash2,
  FiPlus,
  FiX,
  FiSmartphone,
  FiMonitor,
  FiTablet,
  FiCalendar,
  FiMapPin,
  FiCheckCircle,
  FiXCircle,
  FiChevronDown,
  FiChevronUp,
  FiActivity,
  FiGlobe,
  FiShield,
  FiInfo,
} from "react-icons/fi";
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
    <div className="resume-field flex-1" key={key}>
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
            const url = res?.[0]?.ufsUrl ?? res?.[0]?.url;
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
          <Image src={form[key]} alt={label} width={90} height={90} style={{ objectFit: "cover", border: "1px solid var(--border)" }} />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Photos Row at the Top */}
      <div className="flex flex-col md:flex-row gap-6 p-5 border border-[#262626] bg-[#0c0c0c]/60">
        {photoField("resume_photo_url", "Profile Photo (for resume)")}
        {photoField("resume_hero_photo_url", "Hero Photo (alternate)")}
      </div>

      {/* Inputs Grid */}
      <div className="space-y-4">
        {/* Row 1: Full Name & Job Title */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="resume-field">
            <label className="resume-label">Full Name</label>
            <input
              className="resume-input"
              value={form.resume_name ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, resume_name: e.target.value }))}
            />
          </div>
          <div className="resume-field">
            <label className="resume-label">Job Title / Headline</label>
            <input
              className="resume-input"
              value={form.resume_title ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, resume_title: e.target.value }))}
            />
          </div>
        </div>

        {/* Row 2: Email, Phone, Location */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="resume-field">
            <label className="resume-label">Email</label>
            <input
              className="resume-input"
              value={form.resume_email ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, resume_email: e.target.value }))}
            />
          </div>
          <div className="resume-field">
            <label className="resume-label">Phone</label>
            <input
              className="resume-input"
              value={form.resume_phone ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, resume_phone: e.target.value }))}
            />
          </div>
          <div className="resume-field">
            <label className="resume-label">Location</label>
            <input
              className="resume-input"
              value={form.resume_location ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, resume_location: e.target.value }))}
            />
          </div>
        </div>

        {/* Row 3: Professional Summary */}
        <div className="resume-field">
          <label className="resume-label">Professional Summary</label>
          <textarea
            className="resume-input"
            rows={5}
            value={form.resume_summary ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, resume_summary: e.target.value }))}
          />
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between border-t border-[#262626] pt-5 mt-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Resume Status</span>
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, resume_enabled: p.resume_enabled === "true" ? "false" : "true" }))}
            className={`px-3 py-1.5 border text-xs font-mono font-bold uppercase transition-colors rounded-none cursor-pointer ${
              form.resume_enabled === "true"
                ? "bg-green/10 border-green/30 text-green"
                : "bg-red-950/20 border-red-500/20 text-red-400"
            }`}
          >
            {form.resume_enabled === "true" ? "✓ Enabled" : "✗ Disabled"}
          </button>
        </div>
        <button className="resume-btn-primary cursor-pointer font-mono text-xs font-bold uppercase tracking-wider px-5 py-2.5 bg-amber text-black hover:bg-amber/90 disabled:opacity-50 transition-colors" onClick={save} disabled={saving}>
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
type Download = {
  id: string;
  visitorIp: string | null;
  // enriched geo
  country: string | null;
  city: string | null;
  region: string | null;
  timezone: string | null;
  isp: string | null;
  lat: number | null;
  lng: number | null;
  // raw UA
  userAgent: string | null;
  // parsed UA (from DB)
  deviceType: string | null;
  deviceVendor: string | null;
  deviceModel: string | null;
  browserName: string | null;
  browserVersion: string | null;
  osName: string | null;
  osVersion: string | null;
  cpuArch: string | null;
  // timestamps
  downloadedAt: string;
  verifiedAt: string | null;
  verifyCount: number;
};

function DownloadsTab({ initial }: { initial: Download[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const fmt = (d: string | null) => d ? new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : null;

  const getDeviceIcon = (t: string | null) => {
    if (t === "mobile") return <FiSmartphone className="w-3.5 h-3.5 shrink-0" />;
    if (t === "tablet") return <FiTablet className="w-3.5 h-3.5 shrink-0" />;
    return <FiMonitor className="w-3.5 h-3.5 shrink-0" />;
  };

  const getDeviceLabel = (t: string | null) => {
    if (t === "mobile") return "Mobile";
    if (t === "tablet") return "Tablet";
    return "Desktop";
  };

  const deviceColor = (t: string | null) =>
    t === "mobile" ? "border-amber/20 bg-amber/5 text-amber" : t === "tablet" ? "border-green/20 bg-green/5 text-green" : "border-zinc-800 bg-zinc-900 text-zinc-400";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#262626] pb-3">
        <div className="flex items-center gap-2">
          <FiActivity className="w-4 h-4 text-amber" />
          <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
            Resume Downloads Log
          </span>
          <span className="px-1.5 py-0.5 border border-zinc-800 bg-zinc-900/50 text-[10px] font-mono text-zinc-500 font-bold uppercase">
            {initial.length} Tracked
          </span>
        </div>
        <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
          Click any row to expand details
        </span>
      </div>

      {initial.length === 0 && (
        <p className="text-zinc-500 font-mono text-xs italic py-8 text-center uppercase">No downloads recorded yet.</p>
      )}

      {/* Cards */}
      <div className="space-y-2">
        {initial.map((d) => {
          const isOpen = expanded === d.id;
          const verifyFirst = fmt(d.verifiedAt);
          const dt = d.deviceType ?? "desktop";

          return (
            <div key={d.id} className={`border transition-colors ${isOpen ? "border-zinc-700 bg-zinc-900/25" : "border-[#262626] bg-[#0c0c0c] hover:border-zinc-700"}`}>

              {/* ── Summary Row (always visible) ── */}
              <button
                onClick={() => setExpanded(isOpen ? null : d.id)}
                className="w-full grid grid-cols-1 md:grid-cols-5 gap-3 p-4 items-center justify-between text-left cursor-pointer focus:outline-none font-mono text-xs border-0 bg-transparent"
              >
                {/* Date */}
                <span className="text-zinc-500 flex items-center gap-1.5 text-[11px] font-mono">
                  <FiCalendar className="w-3.5 h-3.5 text-zinc-700" />
                  {new Date(d.downloadedAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                </span>

                {/* IP */}
                <span className="text-white font-mono font-bold tracking-tight md:text-center">
                  {d.visitorIp ?? "—"}
                </span>

                {/* Location */}
                <span className="text-zinc-455 flex items-center gap-1.5 truncate max-w-[200px]" title={[d.city, d.region, d.country].filter(Boolean).join(", ") || "—"}>
                  <FiMapPin className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                  <span className="truncate">{[d.city, d.region, d.country].filter(Boolean).join(", ") || "—"}</span>
                </span>

                {/* Device badge */}
                <div className="flex md:justify-center">
                  <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border ${deviceColor(dt)}`}>
                    {getDeviceIcon(dt)}
                    <span>{getDeviceLabel(dt)}</span>
                  </span>
                </div>

                {/* Verify status & Chevron */}
                <div className="flex items-center justify-between md:justify-end gap-3">
                  {verifyFirst ? (
                    <span className="inline-flex items-center gap-1 text-green text-[9px] font-bold uppercase tracking-widest border border-green/20 bg-green/5 px-2 py-0.5">
                      <FiCheckCircle className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-zinc-500 text-[9px] uppercase tracking-widest border border-zinc-800 px-2 py-0.5">
                      <FiXCircle className="w-3 h-3 text-zinc-650" />
                      <span>Not Opened</span>
                    </span>
                  )}
                  {isOpen ? <FiChevronUp className="w-4 h-4 text-zinc-500" /> : <FiChevronDown className="w-4 h-4 text-zinc-500" />}
                </div>
              </button>

              {/* ── Expanded Detail Panel ── */}
              {isOpen && (
                <div className="px-4 pb-5 pt-3 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-[#262626] font-mono text-xs text-zinc-400">

                  {/* GEO BLOCK */}
                  <div className="space-y-3">
                    <p className="text-amber text-[9px] font-bold uppercase tracking-widest border-b border-[#262626]/40 pb-1.5 flex items-center gap-1.5">
                      <FiGlobe className="w-3.5 h-3.5" /> Geo Intelligence
                    </p>
                    <table className="w-full border-collapse">
                      <tbody>
                        {[
                          ["IP", <span key="ip" className="font-bold text-white font-mono">{d.visitorIp ?? "—"}</span>],
                          ["City", d.city ?? "—"],
                          ["Region", d.region ?? "—"],
                          ["Country", d.country ?? "—"],
                          ["Timezone", d.timezone ?? "—"],
                          ["ISP / Org", d.isp ?? "—"],
                          ["Coordinates", d.lat && d.lng
                            ? <a key="coords" href={`https://www.google.com/maps?q=${d.lat},${d.lng}`} target="_blank" rel="noopener noreferrer" className="text-amber hover:underline inline-flex items-center gap-1">
                                {d.lat.toFixed(4)}, {d.lng.toFixed(4)} ↗
                              </a>
                            : "—"
                          ],
                        ].map(([label, value]) => (
                          <tr key={String(label)} className="border-b border-[#262626]/20">
                            <td className="py-2.5 text-zinc-500 font-bold uppercase tracking-widest text-[9px] w-[35%] align-top">
                              {label}
                            </td>
                            <td className="py-2.5 pl-3 text-zinc-350 text-[11px]">
                              {value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* DEVICE BLOCK */}
                  <div className="space-y-3">
                    <p className="text-green text-[9px] font-bold uppercase tracking-widest border-b border-[#262626]/40 pb-1.5 flex items-center gap-1.5">
                      <FiMonitor className="w-3.5 h-3.5" /> Device Intelligence
                    </p>
                    <table className="w-full border-collapse">
                      <tbody>
                        {[
                          ["Type", <span key="type" className="font-bold text-white uppercase">{getDeviceLabel(dt)}</span>],
                          ["Vendor", d.deviceVendor ?? "—"],
                          ["Model", d.deviceModel ?? "—"],
                          ["Browser", d.browserName && d.browserVersion ? `${d.browserName} ${d.browserVersion}` : d.browserName ?? "—"],
                          ["OS", d.osName && d.osVersion ? `${d.osName} ${d.osVersion}` : d.osName ?? "—"],
                          ["CPU Arch", d.cpuArch ?? "—"],
                          ["Raw UA", <span key="ua" title={d.userAgent ?? ""} className="text-[10px] text-zinc-600 font-mono break-all line-clamp-2 leading-relaxed">{d.userAgent ?? "—"}</span>],
                        ].map(([label, value]) => (
                          <tr key={String(label)} className="border-b border-[#262626]/20">
                            <td className="py-2.5 text-zinc-500 font-bold uppercase tracking-widest text-[9px] w-[35%] align-top">
                              {label}
                            </td>
                            <td className="py-2.5 pl-3 text-zinc-350 text-[11px]">
                              {value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* VERIFY BLOCK (full width) */}
                  <div className="col-span-1 md:col-span-2 border-t border-[#262626] pt-4 mt-2">
                    <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest pb-2 flex items-center gap-1.5">
                      <FiShield className="w-3.5 h-3.5 text-zinc-650" /> Verification Link Activity Logs
                    </p>
                    {verifyFirst ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3.5 border border-[#262626] bg-black/40">
                        <div>
                          <p className="text-zinc-600 text-[8px] uppercase tracking-widest mb-1">Status</p>
                          <p className="text-green text-xs font-bold uppercase tracking-wider">✓ Verified</p>
                        </div>
                        <div>
                          <p className="text-zinc-600 text-[8px] uppercase tracking-widest mb-1">First Opened</p>
                          <p className="text-white text-xs font-bold">{verifyFirst}</p>
                        </div>
                        <div>
                          <p className="text-zinc-600 text-[8px] uppercase tracking-widest mb-1">Total Hits</p>
                          <p className="text-white text-xs font-bold">{d.verifyCount} visits</p>
                        </div>
                        <div>
                          <p className="text-zinc-600 text-[8px] uppercase tracking-widest mb-1">Download ID</p>
                          <p className="text-zinc-500 text-[10px] font-mono select-all truncate">{d.id}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 border border-dashed border-[#262626] bg-black/10">
                        <FiInfo className="w-3.5 h-3.5 text-zinc-600" />
                        <p className="text-zinc-600 text-xs italic">
                          Recipient has not clicked/opened the verification link yet.
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          );
        })}
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = (searchParams.get("tab") as Tab) || "Personal";
  const [currentSettings, setCurrentSettings] = useState(settings);

  const setActiveTab = (tab: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div>
      {/* Tabs */}
      <div className="relative border-b border-[#262626] mb-7">
        {/* Right Fade indicator on mobile */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black via-black/80 to-transparent pointer-events-none z-10 md:hidden" />
        
        <div className="flex flex-row flex-nowrap overflow-x-auto scrollbar-none gap-px bg-[#262626]/20 font-mono text-[11px] font-bold uppercase tracking-wider min-w-0 pr-8 md:pr-0">
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-5 py-3 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? "border-[#F59E0B] bg-[#0c0c0c] text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-[#0c0c0c]/40"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
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
