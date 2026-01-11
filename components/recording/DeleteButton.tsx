"use client";

interface DeleteButtonProps {
  id: string;
  onDelete: (id: string) => void;
}

export default function DeleteButton({ id, onDelete }: DeleteButtonProps) {
  return (
    <button
      onClick={() => onDelete(id)}
      className="flex-1 px-4 py-2 rounded-lg
                 bg-gray-100 hover:bg-red-50
                 text-gray-600 hover:text-red-600"
    >
      🗑️ Delete
    </button>
  );
}
