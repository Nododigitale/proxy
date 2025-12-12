export default {
  async fetch(request, env, ctx) {
    try {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Metodo non supportato" }), {
          status: 405,
          headers: { "Content-Type": "application/json" }
        });
      }

      const SPEDIRECOMODO_API_KEY = env.SPEDIRECOMODO_API_KEY;

      if (!SPEDIRECOMODO_API_KEY) {
        return new Response(JSON.stringify({ error: "API key non configurata" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      const body = await request.json();

      // Qui assumo questi campi; se i nomi sono diversi, li cambi tu:
      // body.capMittente, body.capDestinatario, body.countryMittente, body.countryDestinatario
      // body.cittaMittente, body.provinciaMittente, body.cittaDestinatario, body.provinciaDestinatario

      // Default paese IT se non specificato
      const countryMittente = body.countryMittente || "IT";
      const countryDestinatario = body.countryDestinatario || "IT";

      // 1) Lookup CAP mittente se manca città o provincia
      if ((!body.cittaMittente || !body.provinciaMittente) && body.capMittente) {
        const mittenteCapInfo = await lookupCap(
          body.capMittente,
          countryMittente,
          SPEDIRECOMODO_API_KEY
        );

        if (!mittenteCapInfo.success) {
          return new Response(
            JSON.stringify({
              error: "CAP mittente non valido o non trovato",
              detail: mittenteCapInfo.error || null
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        body.cittaMittente = mittenteCapInfo.city;
        body.provinciaMittente = mittenteCapInfo.province;
        // Se vuoi gestire località multiple:
        // body.localitaMittente = mittenteCapInfo.localities;
      }

      // 2) Lookup CAP destinatario se manca città o provincia
      if ((!body.cittaDestinatario || !body.provinciaDestinatario) && body.capDestinatario) {
        const destinatarioCapInfo = await lookupCap(
          body.capDestinatario,
          countryDestinatario,
          SPEDIRECOMODO_API_KEY
        );

        if (!destinatarioCapInfo.success) {
          return new Response(
            JSON.stringify({
              error: "CAP destinatario non valido o non trovato",
              detail: destinatarioCapInfo.error || null
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        body.cittaDestinatario = destinatarioCapInfo.city;
        body.provinciaDestinatario = destinatarioCapInfo.province;
        // Se vuoi gestire località multiple:
        // body.localitaDestinatario = destinatarioCapInfo.localities;
      }

      // 3) Chiamata API preventivo SpedireComodo
      const preventivoResponse = await fetch(
        "https://api.spedirecomodo.it/v1/preventivo", // <-- qui metti l’endpoint reale
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${SPEDIRECOMODO_API_KEY}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(body)
        }
      );

      const preventivoData = await preventivoResponse.json();

      if (!preventivoResponse.ok) {
        return new Response(
          JSON.stringify({
            error: "Errore dal servizio di preventivo",
            status: preventivoResponse.status,
            response: preventivoData
          }),
          {
            status: 502,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      // 4) Risposta pulita al frontend
      return new Response(JSON.stringify(preventivoData), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "Errore interno del Worker",
          detail: err && err.message ? err.message : String(err)
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }
};

// Funzione di lookup CAP usando le API SpedireComodo
async function lookupCap(cap, country, apiKey) {
  try {
    const url =
      `https://api.spedirecomodo.it/v1/lookup/cap` + // <-- qui metti l’endpoint reale di lookup
      `?cap=${encodeURIComponent(cap)}&country=${encodeURIComponent(country)}`;

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Errore API lookup CAP: ${response.status}`
      };
    }

    const data = await response.json();

    return {
      success: true,
      cap: data.cap,
      city: data.city,
      province: data.province,
      localities: data.localities || []
    };
  } catch (err) {
    return {
      success: false,
      error: "Errore di connessione alle API di lookup CAP"
    };
  }
}
