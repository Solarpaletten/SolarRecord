"use client";

interface RecordingSolarCoreProps {
  solar_core_id?: string | null;
}

export default function RecordingSolarCore({ solar_core_id }: RecordingSolarCoreProps) {
  
  if (!solar_core_id) return null;

  return (
    <div className="pt-3 border-t text-xs flex justify-between">
      <span className="text-gray-500">Solar Core ID:</span>
      <span className="font-mono text-blue-600">{solar_core_id}</span>
    </div>
  );
}

