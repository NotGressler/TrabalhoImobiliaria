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

Já existem a vitrine pública, consultas de imóveis/fotos e a base do backend para autenticação, usuários, imóveis, bairros, tipos e fotos. Cadastro, login e acesso à vitrine como cliente já estão disponíveis. As funcionalidades de ofertas, contratos e os painéis administrativos descritos em `Funcionalidades.md` ainda precisam ser desenvolvidos.

## Contato nos detalhes do imóvel

Os cards abrem uma página pública própria em `/imovel/?id=CODIGO`, com galeria, valores, descrição, favoritos para clientes e formulário de contato. O endereço pode ser aberto diretamente ou compartilhado, inclusive para imóveis cadastrados depois da compilação do site.

O formulário da vitrine envia nome, telefone com DDD, e-mail e mensagem por `POST /imoveis/sabermais/{id}`, disponível também sem login. A mensagem é encaminhada à imobiliária, no endereço `joaopatrao@jgimoveis.com.br` exibido no site. Para usar outra caixa de entrada, defina `APP_MAIL_CONTACT` no `.env`. O envio depende da configuração de e-mail existente; falhas são apresentadas ao visitante sem apagar o formulário.

## Login e cadastro

- `/entrar/`: login de clientes e administradores.
- `/cadastro/`: cadastro público, sempre com perfil de cliente (`USER`), com entrada automática por JWT.
- `/cliente/`: a mesma vitrine, com identificação do cliente, logout e botões de oferta/favorito nos detalhes.
- `/admin/`: painel protegido com listagem, busca, cadastro, edição e exclusão de imóveis, upload de fotos e escolha de capa. O formulário permite cadastrar bairros e tipos sem sair da edição.

A sessão usa `sessionStorage` e é validada em `GET /auth/me` com `Authorization: Bearer`. Ao expirar, o token é removido e o usuário retorna ao login. O cadastro usa `POST /auth/register`; e-mails repetidos retornam 409 e senhas são armazenadas com BCrypt. A restrição `uk_usuarios_email` impede cadastros duplicados no banco.

Os favoritos já são salvos por cliente e aparecem acima dos destaques. O botão permite salvar e remover imóveis. A API usa GET /favoritos, PUT /favoritos/{imovelId} e DELETE /favoritos/{imovelId}, sempre com JWT de cliente. A janela de detalhes exibe todas as fotos cadastradas em um carrossel à esquerda, com capa primeiro, miniaturas, setas e navegação por teclado ou toque. O envio de ofertas permanece desabilitado nesta etapa.
