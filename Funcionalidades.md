**Requisitos e funcionalidades**:

-   **Front End**:
    - Framework: React com Next.js (App Router) e TypeScript, com exportação estática servida pelo Spring Boot e consumo da API existente via fetch;
    - Estilos e componentes: Tailwind CSS, CSS próprio e componentes React reutilizáveis;
    - Formulários e validação: React, validação nativa do HTML e funções TypeScript; validar também no backend;
    - Comunicação com a API: `fetch`, com tratamento compartilhado de autenticação e erros;
    - Tabelas administrativas: tabelas HTML com paginação, filtros e ordenação;
    - Gráficos do painel: componentes próprios com CSS e/ou SVG, com rótulos e valores acessíveis;
    - Ícones: SVGs locais em componentes React;
    - Verificação dos fluxos: roteiro manual de login, permissões, CRUDs e regras de negócio; manter os testes existentes do backend;
    - Autenticação: JWT Bearer nas requisições autenticadas. Avaliar uso de cookie `HttpOnly` com suporte do backend para armazenamento mais seguro do token;
    - Hospedagem: Spring Boot serve o frontend e a API na mesma origem (porta 8080); não é necessário CORS nesse modo;


- **Área pública:**
    - Vitrine de imóveis → Lista os imóveis disponíveis em cards com foto, tipo, bairro, cidade, valor e finalidade (aluguel ou venda);
    - Detalhe do imóvel → Detalhar as informações do imóvel;
    - Entrar em contato → Enviar um e-mail para a “imobiliária” demonstrando interesse no imóvel, com o assunto e o corpo já preenchidos com o código, o tipo, o bairro e o valor do imóvel;
    - Paginação → Paginação, com navegação entre elas;
    - Filtros → listar por bairro, finalidade e faixa de preço, e combinados;
    - Ordenação → Ordenação por preço, crescente e decrescente;
    - Login → Funcionando com JWT, com mensagens claras de validação e leva cada perfil à sua área inicial.

- **Área privada - Cliente:**
    - Fazer oferta → No detalhe do imóvel, o cliente envia uma proposta de aluguel ou venda;
    - Minhas ofertas → Lista as ofertas do usuário com a situação de cada uma (pendente, aceita, recusada);
    - Favoritos → Lista, adiciona e remove os imóveis da lista de favoritos;
    - Assinar contrato → Assina o contrato de uma oferta realizada;
    - Listar contratos → Lista os contratos enviados com a situação de cada um;
    - Logout → Apaga o token e desloga o usuário;

    - **Área privada - Admin:**
    - CRUD de imóveis → Cadastra, lista, edita e exclui imóveis, pedindo confirmação antes de excluir;
    - CRUD de bairros → Cadastra, lista, edita e exclui bairros, pedindo confirmação antes de excluir;
    - CRUD de tipos de imóveis → Cadastra, lista, edita e exclui os tipos de imóveis, pedindo confirmação antes de excluir;
    - CRUD de fotos → Cadastra, lista, edita e exclui fotos para os imóveis, pedindo confirmação antes de excluir;
    - Gestão de usuários → Cadastra, lista, busca por nome ou e-mail, edita, troca o perfil e exclui com confirmação. Um admin não pode excluir a si mesmo;
    - Gestão de contratos → Lista os contratos, baixa o pdf, aprova ou recusa e envia para o cliente (notificar via e-mail).
    - Painel com gráficos → Mostra totais (imóveis disponíveis, ofertas pendentes, contratos aguardando assinatura) e gráficos de imóveis por bairro, ofertas por situação e imóveis por finalidade;
    - Gestão de ofertas → Lista todas as ofertas, filtra por situação, aceita ou recusa;

    Requisitos não funcionais: 

- Token → Toda requisição autenticada envia Authorization: Bearer <token>
- Rotas protegidas → Se digitar a URL de uma tela protegida, não exibe a tela;
- Menu por perfil → O menu mostra só as opções do perfil logado;
- Validação → Os formulários validam campos obrigatórios, e-mail e números antes de enviar;
- Feedbacks → Toda tela que busca dados mostra “carregando”, “sem resultados” e uma mensagem de erro amigável (nunca um JSON);
- Responsividade;
- Erros da API → 401 (sessão expirada) apaga o token e leva ao login;  403 mostra “acesso negado”; 409 mostra a mensagem da regra de negócio que veio do backend; 404 mostra que o item não foi encontrado, etc.

**Regras de negócio:**

- Só imóveis **disponíveis** recebem ofertas. Imóveis reservados, alugados ou vendidos não mostram o botão “Fazer oferta”;
- Um cliente não pode ter duas ofertas **pendentes** para o mesmo imóvel;
- Um imóvel pode receber ofertas de **vários clientes** ao mesmo tempo;
- Ao **aceitar** uma oferta, o imóvel passa para status de **reservado** e todas as outras ofertas pendentes dele são **colocadas em espera automaticamente**;
- Ao **assinar** o contrato, o imóvel passa para **alugado** ou **vendido**, conforme o tipo da oferta e as outras ofertas são recusadas;
- Se o cliente desistir, o admin **cancela** o contrato e o imóvel volta a ficar **disponível**, podendo receber novas ofertas.