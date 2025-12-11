export default {
  async fetch(request) {
    const url = new URL(request.url);
    const cap = url.searchParams.get("cap");
    const query = url.searchParams.get("query");

    // Endpoint /cap
    if (url.pathname === "/cap") {
      if (!cap) {
        return new Response(JSON.stringify({ error: "CAP mancante" }), {
          headers: { "Content-Type": "application/json" }
        });
      }

      const country = detectCountry(cap);
      const apiUrl = `https://api.zippopotam.us/${country}/${cap}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        return new Response(JSON.stringify([]), {
          headers: { "Content-Type": "application/json" }
        });
      }

      const data = await response.json();

      const result = [
        {
          Zip: cap,
          City: data.places?.[0]?.["place name"] || "",
          Province: data.places?.[0]?.["state abbreviation"] || "",
          Nation: data["country abbreviation"] || "",
          Frazioni: Array.from(new Set(data.places?.map(p => p["place name"]))).sort()
        }
      ];

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Endpoint /search (base vuota, da estendere)
    if (url.pathname === "/search") {
      if (!query) {
        return new Response(JSON.stringify({ error: "Parametro query mancante" }), {
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({
        input: query,
        results: []
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("NodoDigitale Proxy API");
  }
};

// Riconoscimento automatico del paese dal CAP
function detectCountry(cap) {
  if (/^\d{5}$/.test(cap)) {
    if (cap.startsWith("75")) return "fr"; // Francia
    if (cap.startsWith("10") || cap.startsWith("80")) return "de"; // Germania
    if (cap.startsWith("28") || cap.startsWith("20")) return "es"; // Spagna
    return "it"; // Default Italia
  }
  if (/^[A-Z]{1,2}\d/.test(cap)) return "gb"; // UK
  return "it"; // Fallback
}

