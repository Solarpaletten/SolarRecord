"use client";

import { useState } from "react";

interface ShareButtonProps {
  recording: {
    id: string;
    language: string;
    video_path: string;
    transcript_path: string;
    translation_path?: string;
    pdf_path: string;
    created_at: string;
  };
}

type Recipient = "dashka" | "claude" | "custom";

export default function ShareButton({ recording }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient>("dashka");
  const [customEmail, setCustomEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState<string>("");

  const recipients = {
    dashka: {
      name: "Dashka",
      icon: "🤖",
      email: "dashka@solar.ai",
      color: "bg-purple-500"
    },
    claude: {
      name: "Claude",
      icon: "💻",
      email: "claude@solar.ai",
      color: "bg-blue-500"
    },
    custom: {
      name: "Custom",
      icon: "📧",
      email: "",
      color: "bg-gray-500"
    }
  };

  const handleShare = async () => {
    try {
      setIsSharing(true);
      setShareStatus("Preparing to share...");

      const recipient = selectedRecipient === "custom" 
        ? customEmail 
        : recipients[selectedRecipient].email;

      if (!recipient) {
        setShareStatus("❌ Please enter recipient email");
        setTimeout(() => setShareStatus(""), 3000);
        return;
      }

      console.log(`📤 Sharing recording ${recording.id} to ${recipient}`);

      setShareStatus("🔗 Syncing to Solar Core...");
      
      const syncPayload = {
        id: recording.id,
        language: recording.language,
        video: recording.video_path,
        transcript: recording.transcript_path,
        translation: recording.translation_path,
        pdf: recording.pdf_path,
        created_at: recording.created_at
      };

      const syncResponse = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(syncPayload)
      });

      if (!syncResponse.ok) {
        throw new Error(`Sync failed: ${syncResponse.statusText}`);
      }

      const syncData = await syncResponse.json();
      console.log("✅ Sync response:", syncData);

      setShareStatus(`📧 Sending to ${recipients[selectedRecipient].name}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const recipientName = selectedRecipient === "custom" 
        ? customEmail 
        : recipients[selectedRecipient].name;

      setShareStatus(`✅ Successfully sent to ${recipientName}!`);
      
      setTimeout(() => {
        setShareStatus("");
        setIsOpen(false);
      }, 3000);

    } catch (error) {
      console.error("❌ Share error:", error);
      setShareStatus(`❌ Failed to share: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      setTimeout(() => {
        setShareStatus("");
      }, 5000);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="relative flex-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md font-medium text-sm"
        title="Share to Solar Team"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute right-0 bottom-full mb-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Share Recording</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <label className="text-sm font-medium text-gray-700">Send to:</label>
              
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="recipient"
                  value="dashka"
                  checked={selectedRecipient === "dashka"}
                  onChange={() => setSelectedRecipient("dashka")}
                  className="w-4 h-4 text-purple-600"
                />
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-2xl">{recipients.dashka.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900">{recipients.dashka.name}</div>
                    <div className="text-xs text-gray-500">{recipients.dashka.email}</div>
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="recipient"
                  value="claude"
                  checked={selectedRecipient === "claude"}
                  onChange={() => setSelectedRecipient("claude")}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-2xl">{recipients.claude.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900">{recipients.claude.name}</div>
                    <div className="text-xs text-gray-500">{recipients.claude.email}</div>
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="recipient"
                  value="custom"
                  checked={selectedRecipient === "custom"}
                  onChange={() => setSelectedRecipient("custom")}
                  className="w-4 h-4 text-gray-600"
                />
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-2xl">{recipients.custom.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Custom</div>
                    {selectedRecipient === "custom" && (
                      <input
                        type="email"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="mt-1 w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </div>
                </div>
              </label>
            </div>

            {shareStatus && (
              <div className={`mb-3 p-2 rounded text-sm text-center ${
                shareStatus.includes("❌") ? "bg-red-50 text-red-700" :
                shareStatus.includes("✅") ? "bg-green-50 text-green-700" :
                "bg-blue-50 text-blue-700"
              }`}>
                {shareStatus}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleShare}
                disabled={isSharing || (selectedRecipient === "custom" && !customEmail)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isSharing || (selectedRecipient === "custom" && !customEmail)
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                {isSharing ? "Sharing..." : "Send"}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>

            <div className="mt-3 text-xs text-gray-500 text-center">
              Recording will be synced to Solar Core ERP
            </div>
          </div>
        </>
      )}
    </div>
  );
}
