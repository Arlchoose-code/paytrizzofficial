import type { MessageItem } from "@/types/mail";

/**
 * Extracts only the newly written content of an email, stripping out historical
 * reply quotes (gmail_quote, blockquotes, and "On ... wrote:" patterns).
 */
export function extractCleanBody(msg: MessageItem): string {
  if (msg.body_html && typeof window !== "undefined") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(msg.body_html, "text/html");

      // 1. Remove standard email client quote containers
      doc
        .querySelectorAll(
          ".gmail_quote, blockquote, .quote, [dir='ltr'].gmail_attr, #isForwardContent, #isReplyContent"
        )
        .forEach((el) => el.remove());

      // 2. Remove any lingering "On ... wrote:" or "Pada ... menulis:" header elements
      const allElements = Array.from(doc.body.querySelectorAll("*"));
      for (const el of allElements) {
        const text = el.textContent || "";
        if (
          /^(?:On\s+[A-Za-z0-9,\.\s:]+wrote:|Pada\s+[A-Za-z0-9,\.\s:]+menulis:)/i.test(
            text.trim()
          )
        ) {
          el.remove();
        }
      }

      const bodyHtml = doc.body.innerHTML.trim();
      if (bodyHtml && bodyHtml !== "<p></p>" && bodyHtml !== "<p><br></p>") {
        return bodyHtml;
      }
    } catch {
      // Fallback to text parsing
    }
  }

  // Fallback to plain text
  const rawText = msg.body_text || "";
  const patterns = [
    /\n\s*(?:Pada\s+[^\n]+menulis:)/i,
    /\n\s*(?:On\s+[^\n]+wrote:)/i,
    /\n\s*-{3,}\s*(?:Pesan yang diteruskan|Original Message|Forwarded message)\s*-{3,}/i,
    /\n\s*>/,
  ];

  let cleanText = rawText;
  for (const pat of patterns) {
    const match = pat.exec(cleanText);
    if (match && match.index !== undefined) {
      cleanText = cleanText.slice(0, match.index).trim();
    }
  }

  return cleanText ? `<p>${cleanText.replace(/\n/g, "<br/>")}</p>` : "<p><br></p>";
}

/**
 * Formats a timestamp into Gmail standard English header format:
 * e.g. "Sun, Oct 19, 2026 at 5:20 AM"
 */
export function formatQuoteDate(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const datePart = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timePart = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${datePart} at ${timePart}`;
  } catch {
    return iso;
  }
}

/**
 * Builds a Gmail-compliant reply quote block.
 * When sent to Gmail, Gmail automatically folds this block under the "..." button.
 */
export function buildReplyQuote(msg: MessageItem): string {
  const cleanBody = extractCleanBody(msg);
  const dateStr = formatQuoteDate(msg.sort_at);
  const senderName = msg.from_name || msg.from_address;
  const senderAddr = msg.from_address;

  return `<p><br></p><div class="gmail_quote"><div dir="ltr" class="gmail_attr">On ${dateStr}, ${senderName} &lt;<a href="mailto:${senderAddr}">${senderAddr}</a>&gt; wrote:<br></div><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">${cleanBody}</blockquote></div>`;
}

/**
 * Builds a Gmail-compliant forward quote block.
 */
export function buildForwardQuote(msg: MessageItem): string {
  const cleanBody = extractCleanBody(msg);
  const dateStr = formatQuoteDate(msg.sort_at);
  const senderName = msg.from_name || msg.from_address;
  const senderAddr = msg.from_address;
  const recipients = (msg.to_json || []).map((t) => t.address).join(", ");

  return `<p><br></p><div class="gmail_quote"><div dir="ltr" class="gmail_attr">---------- Forwarded message ---------<br>From: <b>${senderName}</b> &lt;<a href="mailto:${senderAddr}">${senderAddr}</a>&gt;<br>Date: ${dateStr}<br>Subject: ${msg.subject}<br>To: ${recipients}<br></div><br><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">${cleanBody}</blockquote></div>`;
}
