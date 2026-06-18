// ======================================================
// MOMENTO 2 - API REST - CATALOGO DE FILMES E SERIES
// Node.js + Express + mysql2 (sem ORM)
// ======================================================
const express = require("express")
const mysql = require("mysql2/promise")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 3000


// ------------------------------------------------------
// POOL DE LIGACOES AO MYSQL
// O pool gere varias ligacoes e fala diretamente com o MySQL.
// As variaveis vem do ficheiro .env
// ------------------------------------------------------
const pool = mysql.createPool({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
})


// ------------------------------------------------------
// MIDDLEWARE
// ------------------------------------------------------
// Leitura de JSON nos bodies dos pedidos
app.use(express.json())

// Log simples de cada pedido: [hora] METODO  url
app.use((req, res, next) => {
    const hora = new Date().toLocaleTimeString("pt-PT")
    console.log(`[${hora}] ${req.method}  ${req.url}`)
    next()
})


// ------------------------------------------------------
// VALIDACAO
// ------------------------------------------------------
// Lista de generos validos (enunciado)
const GENEROS_VALIDOS = [
    "acao", "comedia", "drama", "terror",
    "ficcao", "documentario", "animacao", "outro",
]

// Tipos validos
const TIPOS_VALIDOS = ["filme", "serie"]

// Valida os dados de um filme/serie recebidos no body.
// Devolve uma string com a mensagem de erro, ou null se estiver tudo bem.
function validarFilme(dados) {
    const { titulo, realizador, genero, ano, tipo, avaliacao } = dados
    const anoAtual = new Date().getFullYear()

    // titulo: obrigatorio, minimo 2 caracteres
    if (typeof titulo !== "string" || titulo.trim().length < 2) {
        return "O campo 'titulo' e obrigatorio e deve ter pelo menos 2 caracteres"
    }

    // realizador: obrigatorio, nao pode estar vazio
    if (typeof realizador !== "string" || realizador.trim().length === 0) {
        return "O campo 'realizador' e obrigatorio"
    }

    // genero: obrigatorio e dentro da lista de generos validos
    if (!GENEROS_VALIDOS.includes(genero)) {
        return "O campo 'genero' e obrigatorio e deve ser um de: " + GENEROS_VALIDOS.join(", ")
    }

    // ano: obrigatorio, numero entre 1900 e o ano atual
    if (!Number.isInteger(ano) || ano < 1900 || ano > anoAtual) {
        return `O campo 'ano' e obrigatorio e deve ser um numero entre 1900 e ${anoAtual}`
    }

    // tipo: obrigatorio, apenas 'filme' ou 'serie'
    if (!TIPOS_VALIDOS.includes(tipo)) {
        return "O campo 'tipo' e obrigatorio e deve ser 'filme' ou 'serie'"
    }

    // avaliacao: opcional, mas se existir deve estar entre 1 e 5
    if (avaliacao !== undefined && avaliacao !== null) {
        if (typeof avaliacao !== "number" || avaliacao < 1 || avaliacao > 5) {
            return "O campo 'avaliacao', se existir, deve ser um numero entre 1 e 5"
        }
    }

    return null
}


// ------------------------------------------------------
// ROTAS
// ------------------------------------------------------

// GET /api/estado -> confirma que a API esta ativa
app.get("/api/estado", (req, res) => {
    res.status(200).json({ mensagem: "API ativa" })
})


// GET /api/filmes -> lista todos os filmes/series
app.get("/api/filmes", async (req, res) => {
    try {
        const [filmes] = await pool.query("SELECT * FROM filmes")
        res.status(200).json(filmes)
    } catch (erro) {
        console.error("Erro no servidor:", erro.message)
        res.status(500).json({ erro: "Erro interno do servidor" })
    }
})


// GET /api/filmes/:id -> obtem um filme/serie por ID
app.get("/api/filmes/:id", async (req, res) => {
    try {
        const id = Number(req.params.id)
        const [filmes] = await pool.query("SELECT * FROM filmes WHERE id = ?", [id])

        if (filmes.length === 0) {
            return res.status(404).json({ erro: "Filme nao foi encontrado" })
        }

        res.status(200).json(filmes[0])
    } catch (erro) {
        console.error("Erro no servidor:", erro.message)
        res.status(500).json({ erro: "Erro interno do servidor" })
    }
})


// POST /api/filmes -> cria um novo filme/serie
app.post("/api/filmes", async (req, res) => {
    try {
        const dados = req.body || {}

        // Validar os dados recebidos no body
        const erroValidacao = validarFilme(dados)
        if (erroValidacao) {
            return res.status(400).json({ erro: erroValidacao })
        }

        const { titulo, realizador, genero, ano, tipo, avaliacao, visto } = dados

        const [resultado] = await pool.query(
            `INSERT INTO filmes (titulo, realizador, genero, ano, tipo, avaliacao, visto)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                titulo.trim(),
                realizador.trim(),
                genero,
                ano,
                tipo,
                avaliacao ?? null,
                visto === true,
            ]
        )

        // Devolver o registo criado
        const [filmes] = await pool.query("SELECT * FROM filmes WHERE id = ?", [resultado.insertId])
        res.status(201).json(filmes[0])
    } catch (erro) {
        console.error("Erro no servidor:", erro.message)
        res.status(500).json({ erro: "Erro interno do servidor" })
    }
})


// PUT /api/filmes/:id -> atualiza um filme/serie completo
app.put("/api/filmes/:id", async (req, res) => {
    try {
        const id = Number(req.params.id)

        // Verificar se o filme existe na base de dados
        const [existe] = await pool.query("SELECT * FROM filmes WHERE id = ?", [id])
        if (existe.length === 0) {
            return res.status(404).json({ erro: "Filme nao foi encontrado" })
        }

        const dados = req.body || {}

        // Validar os dados recebidos no body
        const erroValidacao = validarFilme(dados)
        if (erroValidacao) {
            return res.status(400).json({ erro: erroValidacao })
        }

        const { titulo, realizador, genero, ano, tipo, avaliacao, visto } = dados

        await pool.query(
            `UPDATE filmes
             SET titulo = ?, realizador = ?, genero = ?, ano = ?, tipo = ?, avaliacao = ?, visto = ?
             WHERE id = ?`,
            [
                titulo.trim(),
                realizador.trim(),
                genero,
                ano,
                tipo,
                avaliacao ?? null,
                visto === true,
                id,
            ]
        )

        // Devolver o filme atualizado
        const [filmes] = await pool.query("SELECT * FROM filmes WHERE id = ?", [id])
        res.status(200).json(filmes[0])
    } catch (erro) {
        console.error("Erro no servidor:", erro.message)
        res.status(500).json({ erro: "Erro interno do servidor" })
    }
})


// PATCH /api/filmes/:id/visto -> alterna o estado 'visto' (nao precisa de body)
app.patch("/api/filmes/:id/visto", async (req, res) => {
    try {
        const id = Number(req.params.id)

        // Verificar se o filme existe na base de dados
        const [existe] = await pool.query("SELECT * FROM filmes WHERE id = ?", [id])
        if (existe.length === 0) {
            return res.status(404).json({ erro: "Filme nao foi encontrado" })
        }

        // Alternar o campo 'visto'
        await pool.query("UPDATE filmes SET visto = NOT visto WHERE id = ?", [id])

        // Devolver o filme atualizado
        const [filmes] = await pool.query("SELECT * FROM filmes WHERE id = ?", [id])
        res.status(200).json(filmes[0])
    } catch (erro) {
        console.error("Erro no servidor:", erro.message)
        res.status(500).json({ erro: "Erro interno do servidor" })
    }
})


// DELETE /api/filmes/:id -> apaga um filme/serie (devolve 204 sem body)
app.delete("/api/filmes/:id", async (req, res) => {
    try {
        const id = Number(req.params.id)

        // Verificar se o filme existe na base de dados
        const [existe] = await pool.query("SELECT * FROM filmes WHERE id = ?", [id])
        if (existe.length === 0) {
            return res.status(404).json({ erro: "Filme nao foi encontrado" })
        }

        // Apagar o registo e devolver 204 sem body
        await pool.query("DELETE FROM filmes WHERE id = ?", [id])
        res.status(204).send()
    } catch (erro) {
        console.error("Erro no servidor:", erro.message)
        res.status(500).json({ erro: "Erro interno do servidor" })
    }
})


// ------------------------------------------------------
// 404 - ROTA NAO ENCONTRADA
// ------------------------------------------------------
app.use((req, res) => {
    res.status(404).json({ erro: "Rota nao encontrada" })
})

// ------------------------------------------------------
// ERROR HANDLER - ERRO 500
// ------------------------------------------------------
app.use((erro, req, res, next) => {
    console.error("Erro no servidor:", erro.message)
    res.status(500).json({ erro: "Erro interno do servidor" })
})


// ------------------------------------------------------
// ARRANCAR O SERVIDOR
// ------------------------------------------------------
app.listen(PORT, () => {
    console.log(`Servidor a rolar na porta ${PORT}`)
})
