"use client";

interface Props {
  action: (id: string) => Promise<void>;
  id: string;
  label?: string;
}

export function DeleteButton({ action, id, label = "Excluir" }: Props) {
  async function handleDelete() {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    await action(id);
  }

  return (
    <button
      onClick={handleDelete}
      className="text-xs text-red-600 hover:text-red-800 font-medium transition-colors"
    >
      {label}
    </button>
  );
}
