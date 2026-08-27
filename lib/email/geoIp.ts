/**
 * Sender IP Geolocation
 *
 * Resolves the geographic location of the originating IP address
 * extracted from email Received headers, using the free ip-api.com service.
 *
 * Rate limit: 45 requests per minute (no API key required).
 */

import { GeoIpResult } from "@/types/emailAnalysis";

/**
 * Look up geolocation data for an IP address.
 *
 * @param ip - The IP address to look up
 * @returns Geographic location data or an unavailable result
 */
export async function lookupGeoIp(ip: string): Promise<GeoIpResult> {
  const unavailable: GeoIpResult = {
    ip,
    lat: 0,
    lon: 0,
    city: "",
    country: "",
    countryCode: "",
    isp: "",
    available: false,
  };

  if (!ip || ip === "127.0.0.1" || ip === "::1") {
    return unavailable;
  }

  try {
    // ip-api.com free tier: HTTP only, 45 req/min, no key needed
    const response = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,city,lat,lon,isp`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn(`Geo-IP lookup returned status ${response.status}`);
      return unavailable;
    }

    const data = await response.json();

    if (data.status === "fail") {
      console.warn(`Geo-IP lookup failed: ${data.message}`);
      return unavailable;
    }

    return {
      ip,
      lat: data.lat ?? 0,
      lon: data.lon ?? 0,
      city: data.city ?? "",
      country: data.country ?? "",
      countryCode: data.countryCode ?? "",
      isp: data.isp ?? "",
      available: true,
    };
  } catch (error) {
    console.warn("Geo-IP lookup failed:", error);
    return unavailable;
  }
}
