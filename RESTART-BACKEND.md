# 🔄 Ako reštartovať backend pre opravu Analytics

## ✅ Zmeny už sú hotové
- Opravený `analytics.controller.ts` - odstránený duplicitný prefix
- Opravený `upload.controller.ts` - TypeScript chyba

## 🚀 Postup reštartu

### 1. Zastaviť aktuálny backend
```bash
# Nájsť proces
ps aux | grep "node dist/main"

# Zastaviť (nahraď PID skutočným číslom)
kill -9 <PID>

# Alebo jednoducho:
lsof -ti:3000 | xargs kill -9
```

### 2. Rebuildovať backend
```bash
cd backend
npm run build
```

### 3. Spustiť backend
```bash
# V tom istom termináli:
node dist/main.js

# Alebo v pozadí:
node dist/main.js > /tmp/backend.log 2>&1 &
```

### 4. Overiť, že funguje
```bash
# Health check
curl http://localhost:3000/api/health

# Analytics endpoint (mal by vrátiť JSON, nie 404)
curl http://localhost:3000/api/analytics/all?days=30
```

### 5. Obnoviť stránku v prehliadači
- Otvoriť `http://localhost:3001/admin/analytics`
- Stlačiť **F5** alebo **Cmd+R**

## ✅ Očakávaný výsledok
- Analytics dashboard by mal zobraziť dáta namiesto "No analytics data available"
- V console by nemali byť 404 chyby

## 🔍 Ak stále nefunguje
1. Skontrolovať, či backend beží: `lsof -i:3000`
2. Pozrieť sa na logy: `tail -f /tmp/backend.log`
3. Skontrolovať, či databáza beží: `brew services list | grep postgresql`

