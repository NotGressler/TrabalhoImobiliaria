# Morada — Frontend

Vitrine pública de imóveis feita com Next.js, React e TypeScript. Os cards consomem os imóveis disponíveis do backend Spring e permitem filtrar por venda ou locação, pesquisar por localização e abrir os detalhes do imóvel.

## Executar localmente

Na pasta `frontend`:

```powershell
npm.cmd install
Copy-Item .env.example .env.local
npm.cmd run dev
```

Abra `http://localhost:3000`. Por padrão, o frontend consulta o backend em `http://localhost:8080`; para usar outro endereço, ajuste `API_URL` em `.env.local`.

A vitrine usa `GET /imoveis` e `GET /fotos/vitrine`. O backend precisa estar iniciado e deve permitir consultas públicas a esses endpoints e às imagens em `/fotos/{imovelId}/{nomeArquivo}`. Quando a API não estiver disponível, a página mostra uma mensagem de erro em vez de anúncios fictícios.
