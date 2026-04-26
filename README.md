# Cyber Store Web

Vue single page storefront for Telegram WebApp deployments.

## Run

Use Docker with the API service:

```powershell
docker compose up --build
```

Or serve this folder with any static server. In production nginx serves `index.html` and proxies `/api/` to the backend.

## Telegram

Configure the bot Web App URL in BotFather to the hosted HTTPS frontend URL.
