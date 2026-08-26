/**
 * Email Header Parser
 *
 * Parses raw .eml content or pasted email headers to extract
 * structured header data: From, Return-Path, Received chain,
 * Subject, Date, Message-ID, and the originating IP.
 */

import { ParsedEmailHeaders, ReceivedHeader } from "@/types/emailAnalysis";

/**
 * Extract a single header value from raw headers.
 * Handles multi-line (folded) headers per RFC 2822.
 */
function extractHeader(raw: string, name: string): string {
  // Match the header name at the start of a line, case-insensitive
  const regex = new RegExp(`^${name}:\\s*(.+(?:\\r?\\n[ \\t]+.+)*)`, "im");
  const match = raw.match(regex);
  if (!match) return "";
  // Unfold continuation lines
  return match[1].replace(/\r?\n[ \t]+/g, " ").trim();
}

/**
 * Extract all values for a repeating header (e.g. Received).
 */
function extractAllHeaders(raw: string, name: string): string[] {
  const results: string[] = [];
  const regex = new RegExp(`^${name}:\\s*(.+(?:\\r?\\n[ \\t]+.+)*)`, "gim");
  let match;
  while ((match = regex.exec(raw)) !== null) {
    results.push(match[1].replace(/\r?\n[ \t]+/g, " ").trim());
  }
  return results;
}

/**
 * Parse a single Received header value into structured data.
 *
 * Typical format:
 *   from mail-xxx.google.com (mail-xxx.google.com [209.85.xxx.xxx])
 *     by mx.example.com with ESMTPS; Thu, 1 Jan 2026 12:00:00 +0000
 */
function parseReceivedHeader(raw: string): ReceivedHeader {
  const result: ReceivedHeader = {
    raw,
    from: "",
    by: "",
    ip: "",
    timestamp: "",
  };

  // Extract "from" value
  const fromMatch = raw.match(/from\s+(\S+)/i);
  if (fromMatch) result.from = fromMatch[1];

  // Extract "by" value
  const byMatch = raw.match(/by\s+(\S+)/i);
  if (byMatch) result.by = byMatch[1];

  // Extract IP address (look inside square brackets first, then any IP pattern)
  const bracketIpMatch = raw.match(/\[(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\]/);
  if (bracketIpMatch) {
    result.ip = bracketIpMatch[1];
  } else {
    // IPv6 in brackets
    const ipv6Match = raw.match(/\[([a-fA-F0-9:]+)\]/);
    if (ipv6Match) result.ip = ipv6Match[1];
  }

  // Extract timestamp (after the semicolon)
  const timestampMatch = raw.match(/;\s*(.+)$/);
  if (timestampMatch) result.timestamp = timestampMatch[1].trim();

  return result;
}

/**
 * Extract a domain from an email address.
 * e.g. "user@example.com" → "example.com"
 *       "<user@example.com>" → "example.com"
 */
function extractDomainFromEmail(email: string): string {
  // Strip angle brackets and display name
  const cleaned = email.replace(/.*</, "").replace(/>.*/, "").trim();
  const atIndex = cleaned.lastIndexOf("@");
  if (atIndex === -1) return "";
  return cleaned.substring(atIndex + 1).toLowerCase();
}

/**
 * Determine if an IP is private / reserved (not useful for geo-IP).
 */
function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  return (
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("127.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.2") ||
    ip.startsWith("172.3") ||
    ip === "::1" ||
    ip.startsWith("fe80:") ||
    ip.startsWith("fc") ||
    ip.startsWith("fd")
  );
}

/**
 * Parse raw email content (full .eml or just headers) into structured data.
 */
export function parseEmailHeaders(rawEmail: string): ParsedEmailHeaders {
  // Separate headers from body (headers end at the first blank line)
  const headerBodySplit = rawEmail.split(/\r?\n\r?\n/);
  const headerSection = headerBodySplit[0] || rawEmail;

  const from = extractHeader(headerSection, "From");
  const returnPath = extractHeader(headerSection, "Return-Path");
  const replyTo = extractHeader(headerSection, "Reply-To");
  const subject = extractHeader(headerSection, "Subject");
  const date = extractHeader(headerSection, "Date");
  const messageId = extractHeader(headerSection, "Message-ID");
  const authenticationResults = extractHeader(headerSection, "Authentication-Results");

  // Parse all Received headers
  const rawReceived = extractAllHeaders(headerSection, "Received");
  const receivedChain = rawReceived.map(parseReceivedHeader);

  // Determine the sending domain
  const returnPathDomain = extractDomainFromEmail(returnPath);
  const fromDomain = extractDomainFromEmail(from);
  const sendingDomain = returnPathDomain || fromDomain;

  // Extract originating IP from the last Received header
  // The last Received header (at the bottom of the list) is the first one added,
  // which is closest to the original sender.
  let originatingIp = "";
  for (let i = receivedChain.length - 1; i >= 0; i--) {
    const ip = receivedChain[i].ip;
    if (ip && !isPrivateIp(ip)) {
      originatingIp = ip;
      break;
    }
  }
  // Fallback: use the first IP found in any Received header
  if (!originatingIp) {
    for (const header of receivedChain) {
      if (header.ip) {
        originatingIp = header.ip;
        break;
      }
    }
  }

  return {
    from,
    returnPath,
    replyTo,
    subject,
    date,
    messageId,
    receivedChain,
    authenticationResults,
    sendingDomain,
    originatingIp,
  };
}
