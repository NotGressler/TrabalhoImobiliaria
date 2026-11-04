# JG Imóveis

Site de imobiliária com frontend React/Next.js/TypeScript e API Spring Boot. O Next.js gera arquivos estáticos; o Spring Boot serve o site e a API em http://localhost:8080. Não é necessário manter um servidor Node em execução.

## Preparação

- JDK 17 ou superior (o script prefere o JDK local em `.tools/java`).
- Node.js 22 e npm para compilar o frontend.
- MySQL iniciado e banco `imobiliaria` criado: `CREATE DATABASE IF NOT EXISTS imobiliaria;`.
- Conexão configurada em `demo/src/main/resources/application.properties` (padrão: localhost:3306, usuário root, senha vazia).

O arquivo local `.env` foi preparado com um `JWT_SECRET` aleatório. Para outras instalações, copie `.env.example` para `.env` e preencha `JWT_SECRET` (pelo menos 32 bytes). Preencha `MAILGUN_API_KEY` para habilitar o envio de e-mails; sem essa chave, o site inicia, mas os envios não funcionarão. Não publique esse arquivo. Opcionalmente, configure `BOOTSTRAP_ADMIN_EMAIL` e `BOOTSTRAP_ADMIN_PASSWORD` para criar o primeiro administrador quando não houver usuários.

## Executar

Na raiz do projeto:

```powershell
.\iniciar.ps1
```

O script compila o frontend, usa o Maven Wrapper para preparar o backend e inicia o Spring Boot. Abra http://localhost:8080. Para encerrar, pressione Ctrl+C.

Se o frontend já foi compilado e não mudou:

```powershell
.\iniciar.ps1 -SemBuild
```

## Gerar um JAR com o site

```powershell
cd frontend
npm.cmd ci
npm.cmd run build
cd ../demo
.\mvnw.cmd package
```

O Maven inclui `frontend/out` nos recursos estáticos do JAR. Ao executar o JAR, forneça as mesmas variáveis de ambiente; o arquivo `.env` é carregado pelo script `iniciar.ps1`, não automaticamente pelo Spring Boot.

## Escopo atual

Já existem a vitrine pública, consultas de imóveis/fotos e a base do backend para autenticação, usuários, imóveis, bairros, tipos e fotos. As telas privadas e as funcionalidades de ofertas, favoritos e contratos descritas em `Funcionalidades.md` ainda precisam ser desenvolvidas.
