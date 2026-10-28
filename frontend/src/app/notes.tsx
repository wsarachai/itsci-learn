"use client";

import { useEffect, useState, type FormEvent } from "react";

type Note = { id: number; text: string; createdAt: string };

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/notes", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setNotes(await res.json());
      setError(null);
    } catch (e) {
      setError(`เรียก API ไม่ได้: ${(e as Error).message}`);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      setText("");
      load();
    } else {
      setError(`บันทึกไม่ได้: HTTP ${res.status}`);
    }
  }

  return (
    <section className="mt-8">
      <form onSubmit={add} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          placeholder="เขียนโน้ต..."
          className="flex-1 rounded border border-zinc-300 px-3 py-2"
        />
        <button className="rounded bg-zinc-900 px-4 py-2 text-white">
          เพิ่ม
        </button>
      </form>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <ul className="mt-6 divide-y divide-zinc-200">
        {notes.map((n) => (
          <li key={n.id} className="py-2">
            {n.text}
            <span className="ml-2 text-xs text-zinc-400">
              {new Date(n.createdAt).toLocaleString("th-TH")}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
