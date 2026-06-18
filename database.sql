-- ======================================================
-- MOMENTO 2 - API REST - CATALOGO DE FILMES E SERIES
-- Script para correr no MySQL Workbench
-- Cria a base de dados, a tabela e os dados iniciais
-- ======================================================

-- 1) Criar a base de dados (se ainda nao existir) e usa-la
CREATE DATABASE IF NOT EXISTS catalogo_filmes;
USE catalogo_filmes;

-- 2) Apagar a tabela antiga, se existir, e criar a tabela 'filmes' do zero
DROP TABLE IF EXISTS filmes;

CREATE TABLE filmes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    titulo      VARCHAR(150) NOT NULL,
    realizador  VARCHAR(120) NOT NULL,
    genero      VARCHAR(40)  NOT NULL,
    ano         INT          NOT NULL,
    tipo        VARCHAR(10)  NOT NULL,
    avaliacao   TINYINT      NULL,
    visto       BOOLEAN      NOT NULL DEFAULT FALSE
);

-- 3) Inserir dados iniciais (generos validos, tipo em minusculas)
INSERT INTO filmes (titulo, realizador, genero, ano, tipo, avaliacao, visto) VALUES
('Interstellar',    'Christopher Nolan', 'ficcao',   2014, 'filme', 5, TRUE),
('Breaking Bad',    'Vince Gilligan',    'drama',    2008, 'serie', 5, TRUE),
('O Iluminado',     'Stanley Kubrick',   'terror',   1980, 'filme', 4, FALSE),
('Stranger Things', 'Irmaos Duffer',     'ficcao',   2016, 'serie', 4, FALSE),
('Toy Story',       'John Lasseter',     'animacao', 1995, 'filme', 5, TRUE);

-- 4) Confirmar
SELECT * FROM filmes;
