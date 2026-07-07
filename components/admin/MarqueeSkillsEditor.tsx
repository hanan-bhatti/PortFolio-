"use client";

import React, { useState, useEffect } from "react";
import { FiPlus, FiTrash2, FiCpu } from "react-icons/fi";
import * as SiIcons from "react-icons/si";
import * as FaIcons from "react-icons/fa6";
import * as LuIcons from "react-icons/lu";
import InfoTooltip from "./InfoTooltip";
import ScrollingMarquee from "@/components/ui/ScrollingMarquee";

interface SkillItem {
  name: string;
  icon: string;
}

interface MarqueeSkillsEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarqueeSkillsEditor({ value, onChange }: MarqueeSkillsEditorProps) {
  const [items, setItems] = useState<SkillItem[]>([]);

  useEffect(() => {
    try {
      if (value && value.startsWith("[")) {
        setItems(JSON.parse(value));
      } else if (value) {
        const parsed = value
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
          .map((s) => ({ name: s, icon: "" }));
        setItems(parsed);
      } else {
        setItems([]);
      }
    } catch (e) {
      setItems([]);
    }
  }, [value]);

  const updateItems = (newItems: SkillItem[]) => {
    setItems(newItems);
    onChange(JSON.stringify(newItems));
  };

  const handleAdd = () => {
    updateItems([...items, { name: "", icon: "" }]);
  };

  const handleRemove = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    updateItems(newItems);
  };

  const handleChange = (index: number, field: keyof SkillItem, val: string) => {
    const newItems = [...items];
    if (newItems[index]) {
      newItems[index][field] = val;
      updateItems(newItems);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <FiCpu className="w-3.5 h-3.5 text-zinc-550" /> Marquee Skills
          <InfoTooltip content="Add tools and their react-icons name (e.g. SiReact, FaNodeJs)." />
        </label>
        <button
          type="button"
          onClick={handleAdd}
          className="text-[10px] font-mono uppercase tracking-widest text-amber border border-amber/30 px-2 py-1 hover:bg-amber/10 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <FiPlus className="w-3 h-3" /> Add Skill
        </button>
      </div>

      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 bg-[#0a0a0a] border border-[#262626] p-2">
            <input
              type="text"
              value={item.name}
              onChange={(e) => handleChange(i, "name", e.target.value)}
              placeholder="e.g. React"
              className="flex-1 bg-transparent border-b border-[#333] px-2 py-1 text-[13px] text-zinc-200 outline-none focus:border-amber transition-colors font-sans"
            />
            <input
              type="text"
              list="si-icons-list"
              value={item.icon}
              onChange={(e) => handleChange(i, "icon", e.target.value)}
              placeholder="Icon (e.g. SiReact)"
              className="w-40 bg-transparent border-b border-[#333] px-2 py-1 text-[13px] text-zinc-200 outline-none focus:border-amber transition-colors font-mono"
            />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="text-red-400/70 hover:text-red-400 p-1 cursor-pointer"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-[11px] text-zinc-500 font-mono italic">No skills added yet.</p>
        )}
      </div>

      <datalist id="si-icons-list">
        {Object.keys(SiIcons).map((iconName) => (
          <option key={iconName} value={iconName} />
        ))}
        {Object.keys(FaIcons).map((iconName) => (
          <option key={iconName} value={iconName} />
        ))}
        {Object.keys(LuIcons).map((iconName) => (
          <option key={iconName} value={iconName} />
        ))}
      </datalist>

      <div className="w-full pointer-events-none mt-4 rounded-md overflow-hidden border border-[#262626]">
        <ScrollingMarquee skills={JSON.stringify(items)} />
      </div>
    </div>
  );
}
