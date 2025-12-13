import CAP_ITALIA from "./cap-italia.json";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const cap = url.searchParams.get("cap");
    const query = url.searchParams.get("query");

    const jsonResponse = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });

    if (url.pathname === "/cap") {
      if (!cap) {
        return jsonResponse({ error: "CAP mancante" }, 400);
      }

      // ✅ 1. CAP italiano → database locale
      if (/^\d{5}$/.test(cap) && CAP_ITALIA[cap]) {
        const info = CAP_ITALIA[cap];
        return jsonResponse([
          {
            Zip: cap,
            City: info.city,
            Province: info.province,
            Nation: "IT",
            Frazioni: info.frazioni || []
          }
        ]);
      }

      // ✅ 2. Estero → Zippopotam
      const country = detectCountry(cap);
      const apiUrl = `https://api.zippopotam.us/${country}/${cap}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        return jsonResponse([]);
      }

      const data = await response.json();

      return jsonResponse([
        {
          Zip: cap,
          City: data.places?.[0]?.["place name"] || "",
          Province: data.places?.[0]?.["state abbreviation"] || "",
          Nation: data["country abbreviation"] || "",
          Frazioni: Array.from(new Set(data.places?.map(p => p["place name"]))).sort()
        }
      ]);
    }

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

function detectCountry(cap) {
  if (/^[A-Z]{1,2}\d/.test(cap)) return "gb";
  if (/^\d{5}$/.test(cap) && cap.startsWith("75")) return "fr";
  if (/^\d{5}$/.test(cap) && (cap.startsWith("10") || cap.startsWith("80"))) return "de";
  if (/^\d{5}$/.test(cap) && (cap >= "01001" && cap <= "52999")) return "es";
  return "it";
}
