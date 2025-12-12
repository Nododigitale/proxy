async function lookupCap(cap, country = "IT") {
  try {
    const url = `https://api.spedirecomodo.it/v1/lookup/cap?cap=${cap}&country=${country}`;

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${SPEDIRECOMODO_API_KEY}`,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Errore API: ${response.status}`
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
      error: "Errore di connessione alle API"
    };
  }
}
