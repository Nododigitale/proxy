// Mini database CAP Italia (versione test)
const CAP_ITALIA = {
  "20100": { city: "Milano", province: "MI", region: "Lombardia", frazioni: [] },
  "80134": { city: "Napoli", province: "NA", region: "Campania", frazioni: [] },
  "00100": { city: "Roma", province: "RM", region: "Lazio", frazioni: [] },
  "28921": { city: "Verbania", province: "VB", region: "Piemonte", frazioni: [] }
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const cap = url.searchParams.get("cap");
    const query = url.searchParams.get("query");

    // Helper per risposte JSON con CORS
    const jsonResponse = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });

    // Endpoint /cap
    if (url.pathname === "/cap") {
      if (!cap) {
        return jsonResponse({ error: "CAP mancante" }, 400);
      }

      // ✅ 1. Se CAP è italiano → usa database locale
      if (/^\d{5}$/.test(cap)) {
        if (CAP_ITALIA[cap]) {
          const info = CAP_ITALIA[cap];
          return jsonResponse([
            {
              Zip: cap,
              City: info.city,
              Province: info.province,
              Nation: "IT",
              Frazioni: info.frazioni
            }
          ]);
        }
      }

      // ✅ 2. Se CAP non è italiano → usa Zippopotam
      const country = detectCountry(cap);
      const apiUrl = `https://api.zippopotam.us/${country}/${cap}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        return jsonResponse([]);
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

      return jsonResponse(result);
    }

    // Endpoint /search
    if (url.pathname === "/search") {
      if (!query) {
        return jsonResponse({ error: "Parametro query mancante" }, 400);
      }

      return jsonResponse({
        input: query,
        results: []
      });
    }

    return new Response("NodoDigitale Proxy API", {
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
};

// Riconoscimento automatico del paese dal CAP
function detectCountry(cap) {
  if (/^\d{5}$/.test(cap)) {
    if (cap.startsWith("75")) return "fr";
    if (cap.startsWith("10") || cap.startsWith("80")) return "de";
    if (cap.startsWith("28") || cap.startsWith("20")) return "es";
    return "it";
  }
  if (/^[A-Z]{1,2}\d/.test(cap)) return "gb";
  return "it";
}
