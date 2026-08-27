/**
 * SMTP Relay Path Visualization
 *
 * Parses the Received header chain from email headers into an
 * ordered list of relay hops suitable for rendering as a flow
 * diagram (sender → relay → relay → recipient).
 *
 * Received headers are listed in reverse chronological order in
 * the email (most recent first), so we reverse them to show the
 * path from sender to recipient.
 */

import { ReceivedHeader, RelayHop } from "@/types/emailAnalysis";

/**
 * Build an ordered relay path from parsed Received headers.
 *
 * @param receivedChain - The parsed Received headers from the email
 * @returns Ordered list of relay hops (sender → recipient)
 */
export function buildRelayPath(receivedChain: ReceivedHeader[]): RelayHop[] {
  if (!receivedChain || receivedChain.length === 0) {
    return [];
  }

  // Received headers are in reverse chronological order in the email.
  // Reverse them to get sender → relay → ... → recipient order.
  const chronological = [...receivedChain].reverse();

  return chronological.map((header, index) => ({
    hop: index + 1,
    from: header.from || "(unknown)",
    by: header.by || "(unknown)",
    ip: header.ip || "",
    timestamp: header.timestamp || "",
  }));
}
