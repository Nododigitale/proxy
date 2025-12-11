# proxy
# European ZIP Proxy for Shipping Calculators

This Cloudflare Worker provides a lightweight proxy API for ZIP-based location lookup across Europe.  
It supports automatic country detection, Italian frazioni, and is designed for integration into shipping platforms.

## 🔧 Endpoints

### `/cap?cap=28921`
Returns location data for a given ZIP code:
- City
- Province (if available)
- Nation
- Frazioni (unique place names within the ZIP)

### `/search?query=Verbania`
*(Coming soon)* — Autocompletion and city lookup based on partial input.

## 🌍 Features

- Automatic country detection based on ZIP format
- Support for European countries (IT, FR, DE, ES, GB)
- Italian frazioni included for granular address resolution
- Fast, serverless deployment via Cloudflare Workers
- Designed for branded shipping calculators and address validation

## 🛠 Technologies

- Cloudflare Workers
- GitHub integration
- Zippopotam.us API

## 📦 Use Case

Ideal for shipping platforms that need:
- Reliable ZIP-to-city resolution
- Support for international formats
- Lightweight, fast, and customizable proxy logic

## 📁 Structure

- `index.js` → main Worker logic
- `wrangler.toml` → Cloudflare configuration

## 🚀 Deployment

This Worker is deployed via GitHub → Cloudflare integration.  
Every push to `main` triggers automatic deployment.

## 📬 Contact

Developed by [NodoDigitale](https://nododigitale.app)  
For support or integration: info@nododigitale.app
