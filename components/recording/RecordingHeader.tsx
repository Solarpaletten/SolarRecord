"use client";

interface RecordingHeaderProps {
  id: string;
  createdAt: string;
  synced?: boolean;
}

export default function RecordingHeader({
  id,
  createdAt,
  synced,
}: RecordingHeaderProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg truncate">
          Recording {id}
        </h3>

        {synced && (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-white bg-opacity-20">
            🔗 Synced
          </span>
        )}
      </div>

      <p className="text-blue-100 text-sm">
        {formatDate(createdAt)}
      </p>
    </div>
  );
}