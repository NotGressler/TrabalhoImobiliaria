-- MySQL / MariaDB: execute o arquivo inteiro no banco do projeto.
-- Cria 14 anúncios fictícios disponíveis (3 páginas: 6 + 6 + 2).
-- Não altera cadastros existentes. Reexecução sequencial não duplica os exemplos.
-- Não cria fotos: elas podem ser adicionadas depois pelo painel administrativo.
USE imobiliaria;
SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO bairros (nome, cidade, estado)
SELECT 'Centro - Demo Aula 2', 'Santa Maria', 'RS'
WHERE NOT EXISTS (SELECT 1 FROM bairros WHERE nome = 'Centro - Demo Aula 2' AND cidade = 'Santa Maria');
SET @bairro_demo = (SELECT MIN(id) FROM bairros WHERE nome = 'Centro - Demo Aula 2' AND cidade = 'Santa Maria');

INSERT INTO tipos_imoveis (nome, descricao, created_at, updated_at)
SELECT 'Apartamento', 'Unidade residencial em edifício.', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tipos_imoveis WHERE nome = 'Apartamento');
INSERT INTO tipos_imoveis (nome, descricao, created_at, updated_at)
SELECT 'Casa', 'Residência independente.', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tipos_imoveis WHERE nome = 'Casa');
SET @tipo_apartamento = (SELECT MIN(id) FROM tipos_imoveis WHERE nome = 'Apartamento');
SET @tipo_casa = (SELECT MIN(id) FROM tipos_imoveis WHERE nome = 'Casa');

INSERT INTO imoveis
  (titulo, descricao, preco_venda, preco_aluguel, finalidade, status,
   dormitorios, banheiros, garagem, area_total, area_construida,
   endereco, numero, complemento, cep, caracteristicas, destaque, tipo_imovel_id, bairro_id)
SELECT
  CONCAT('[Demo Aula 2] ', exemplo.titulo),
  CONCAT('Imóvel fictício para demonstração da vitrine. ', exemplo.titulo,
         '. Ambientes iluminados, boa localização e fácil acesso ao comércio.'),
  exemplo.venda, exemplo.aluguel, exemplo.finalidade, 'disponivel',
  exemplo.quartos, exemplo.banheiros, exemplo.vagas, exemplo.area, exemplo.area,
  'Rua dos Exemplos', CAST(100 + exemplo.n AS CHAR), '', '97010-000',
  'Cadastro fictício para testar filtros, ordenação, paginação e edição.',
  exemplo.n IN (1, 5, 9),
  IF(exemplo.tipo = 'Casa', @tipo_casa, @tipo_apartamento), @bairro_demo
FROM (
  SELECT 1 n, 'Apartamento compacto' titulo, 'Apartamento' tipo, 180000.00 venda, NULL aluguel, 'venda' finalidade, 1 quartos, 1 banheiros, 0 vagas, 45.00 area
  UNION ALL SELECT 2, 'Apartamento com sacada', 'Apartamento', 260000, NULL, 'venda', 2, 1, 1, 65
  UNION ALL SELECT 3, 'Casa com jardim', 'Casa', 390000, NULL, 'venda', 3, 2, 2, 140
  UNION ALL SELECT 4, 'Apartamento para estudantes', 'Apartamento', NULL, 950, 'aluguel', 1, 1, 0, 38
  UNION ALL SELECT 5, 'Casa com varanda', 'Casa', NULL, 2200, 'aluguel', 3, 2, 1, 120
  UNION ALL SELECT 6, 'Apartamento com suíte', 'Apartamento', 340000, 1800, 'venda e aluguel', 2, 2, 1, 82
  UNION ALL SELECT 7, 'Casa térrea', 'Casa', 280000, NULL, 'venda', 2, 1, 1, 95
  UNION ALL SELECT 8, 'Apartamento mobiliado', 'Apartamento', NULL, 1650, 'aluguel', 2, 1, 1, 60
  UNION ALL SELECT 9, 'Casa com piscina', 'Casa', 750000, NULL, 'venda', 4, 3, 2, 220
  UNION ALL SELECT 10, 'Apartamento amplo', 'Apartamento', 480000, 2600, 'venda e aluguel', 3, 2, 2, 110
  UNION ALL SELECT 11, 'Casa para família', 'Casa', NULL, 2800, 'aluguel', 3, 2, 2, 155
  UNION ALL SELECT 12, 'Apartamento econômico', 'Apartamento', 155000, NULL, 'venda', 1, 1, 0, 40
  UNION ALL SELECT 13, 'Casa com escritório', 'Casa', 520000, 3100, 'venda e aluguel', 3, 3, 2, 180
  UNION ALL SELECT 14, 'Apartamento cobertura', 'Apartamento', 890000, NULL, 'venda', 4, 3, 2, 200
) AS exemplo
WHERE NOT EXISTS (
  SELECT 1 FROM imoveis existente
  WHERE existente.titulo = CONCAT('[Demo Aula 2] ', exemplo.titulo)
);

COMMIT;
SELECT id, titulo, finalidade, preco_venda, preco_aluguel, status
FROM imoveis WHERE titulo LIKE '[Demo Aula 2] %' ORDER BY id;
