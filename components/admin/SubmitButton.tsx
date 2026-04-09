"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ label = "Salvar" }: { label?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Salvando..." : label}
    </button>
  );
}
