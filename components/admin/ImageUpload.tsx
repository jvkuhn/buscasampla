"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  label: string;
  name: string;
  defaultValue?: string;
  hint?: string;
}

export function ImageUpload({ label, name, defaultValue = "", hint }: ImageUploadProps) {
  const [url, setUrl] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao enviar imagem");
        return;
      }

      setUrl(data.url);
    } catch {
      setError("Erro de conexão ao enviar imagem");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleRemove() {
    setUrl("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {/* Preview */}
      {url && (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Preview"
            className="h-32 rounded-lg border border-gray-200 object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
          >
            X
          </button>
        </div>
      )}

      {/* URL input + upload button */}
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(""); }}
          placeholder="https://... ou faça upload"
          className={cn(
            "flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
            error ? "border-red-400" : "border-gray-300"
          )}
        />
        <label
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors inline-flex items-center gap-1",
            uploading
              ? "bg-gray-300 text-gray-500 cursor-wait"
              : "bg-blue-600 text-white hover:bg-blue-700"
          )}
        >
          {uploading ? "Enviando..." : "Upload"}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={url} />

      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
