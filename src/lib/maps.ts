export type LeadAddress = {
  streetAddress?: string | null;
  suburb: string;
  area?: string | null;
  postalCode?: string | null;
  province?: string | null;
};

function fullAddress(lead: LeadAddress): string {
  return [lead.streetAddress, lead.suburb, lead.area, lead.province, lead.postalCode, "South Africa"]
    .filter(Boolean)
    .join(", ");
}

// No Google Maps API key is configured for this app, so both links use the
// key-less forms: a plain search URL (always works) and the `output=embed`
// query embed (unofficial but stable for showing a single address pin).
export function mapsSearchUrl(lead: LeadAddress): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress(lead))}`;
}

export function mapsEmbedUrl(lead: LeadAddress): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(fullAddress(lead))}&output=embed`;
}
