# Frontend JG Imóveis

React, Next.js App Router, TypeScript e Tailwind CSS/CSS próprio. Ícones em SVG local, requisições com fetch e componentes próprios, sem shadcn/ui, React Hook Form, Zod, TanStack, Recharts, Lucide ou Playwright.

## Compilar para o Spring Boot

```powershell
npm.cmd ci
npm.cmd run build
```

A pasta `out` contém o site estático e é incluída pelo Maven nos recursos do backend. Prefira executar `iniciar.ps1` na raiz para compilar e iniciar tudo junto. Acesse http://localhost:8080.

Os dados são buscados no navegador em `/imoveis` e `/fotos/vitrine`, na mesma origem do site. Não há dependência da API ou do banco durante o build.

`NEXT_PUBLIC_API_URL` é opcional e fica vazio no modo Spring Boot. Para usar uma API de outra origem, configure esse valor antes do build e permita CORS no backend.

`npm.cmd run dev` continua disponível para desenvolvimento do frontend na porta 3000; nesse modo, uma API externa exige configurar a origem e o CORS. O comando `next start` não é utilizado com exportação estática.
