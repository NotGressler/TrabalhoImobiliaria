Programação IV – Atividade Sobre JWT
Aluno: João Gabriel S. Gressler

1) A diferença principal entre autenticação e autorização é que a autenticação define o usuário, e a autorização se ele tem o que é necessário (token) para fazer. Exemplos podem ser dados com perguntas como a autenticação pergunta “quem você é” e a autorização “o que você pode fazer”.

2) A autenticação stateful guarda o registro do estado que está acessando, criando uma sessão e gravando no armazenamento volátil (Memoria RAM). No stateless ele não guarda diretamente o estado, ele gera um token (JWT) com as informações, então esse token é enviado para o armazenamento.

3) A sintaxe é um hash (várias letras e números) separada por 2 pontos (A1A.B2B.C3C) e a semântica diz o que as propriedades declaradas dentro do JSON significam e como elas devem ser interpretadas pelo sistema. 