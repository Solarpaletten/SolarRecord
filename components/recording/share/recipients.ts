/**
 * SHARE RECIPIENTS (PLACEHOLDER)
 *
 * ⚠️ This file is a contract / anchor.
 * Real logic (commands, AI routing, responses)
 * will be implemented later.
 */

export const RECIPIENTS = {
  dashka: {
    name: "Dashka",
    icon: "🤖",
    email: "dashka@solar.ai",
  },
  claude: {
    name: "Claude",
    icon: "💻",
    email: "claude@solar.ai",
  },
  custom: {
    name: "Custom",
    icon: "📧",
    email: "",
  },
} as const;

export type ShareRecipientKey = keyof typeof RECIPIENTS;
