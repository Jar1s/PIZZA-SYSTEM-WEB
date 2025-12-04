# 🔧 Render MCP Server Setup

Render MCP (Model Context Protocol) server umožňuje spravovať Render resources priamo z AI aplikácií ako Cursor.

## Výhody Render MCP Serveru:

- ✅ Spravovanie služieb priamo z AI
- ✅ Automatické vytváranie a konfigurácia služieb
- ✅ Správa environment variables
- ✅ Monitoring a logy
- ✅ Deployment management

## Nastavenie Render MCP Serveru

### Krok 1: Získať Render API Key

1. **Prihlás sa do Render.com**: https://dashboard.render.com
2. **Choď do Account Settings**: Klikni na tvoj profil → "Account Settings"
3. **API Keys**: Nájdi sekciu "API Keys" alebo "Access Tokens"
4. **Vytvor nový API Key**:
   - Klikni na "Create API Key"
   - Pomenuj ho (napr. "MCP Server")
   - Skopíruj API key (zobrazí sa len raz!)

### Krok 2: Konfigurovať MCP Server v Cursor

1. **Otvori Cursor Settings**:
   - Cursor → Settings → Features → MCP Servers
   - Alebo: `Cmd/Ctrl + Shift + P` → "MCP: Configure MCP Servers"

2. **Pridať Render MCP Server**:
   ```json
   {
     "mcpServers": {
       "render": {
         "command": "npx",
         "args": [
           "-y",
           "@render/mcp-server"
         ],
         "env": {
           "RENDER_API_KEY": "tvoj-render-api-key-tu"
         }
       }
     }
   }
   ```

3. **Alebo pomocou npm**:
   ```bash
   npm install -g @render/mcp-server
   ```
   
   Potom v konfigurácii:
   ```json
   {
     "mcpServers": {
       "render": {
         "command": "render-mcp-server",
         "env": {
           "RENDER_API_KEY": "tvoj-render-api-key-tu"
         }
       }
     }
   }
   ```

### Krok 3: Overiť konfiguráciu

1. **Reštartuj Cursor**
2. **Skús AI príkaz**: "Zobraz všetky moje Render služby"
3. **Ak funguje**, môžeš používať AI na:
   - Vytváranie nových služieb
   - Nastavovanie environment variables
   - Deployment management
   - Monitoring

## Príklady použitia s AI:

```
"Vytvor novú web službu pre backend s týmito nastaveniami..."
"Nastav environment variable DATABASE_URL na..."
"Zobraz logy z mojej služby pizza-ecosystem-api"
"Redeploy moju službu"
```

## Bezpečnosť:

⚠️ **Dôležité**: API Key je citlivý údaj!
- ✅ Ulož ho do environment variables
- ✅ Nikdy ho necommituj do git
- ✅ Používaj len v dôveryhodných prostrediach
- ✅ Ak sa API key unikne, okamžite ho zneplatni v Render dashboard

## Alternatíva: Manuálne nastavenie

Ak nechceš používať MCP server, môžeš pokračovať s manuálnym nastavením cez Render dashboard (ako je popísané v `RENDER-DEPLOY.md`).

---

**Poznámka**: Render MCP server je relatívne nový feature. Ak máš problémy s nastavením, môžeš vždy použiť manuálne nastavenie cez dashboard.








