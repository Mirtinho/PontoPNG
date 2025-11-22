// server.js

// 1. IMPORTAÇÃO DE PACOTES
const express = require('express');
const mysql = require('mysql2/promise'); 
const cors = require('cors');

const app = express();
const PORT = 3000; // Porta de escuta do seu servidor Node.js

// 2. CONFIGURAÇÃO DO BANCO DE DADOS (AJUSTE ESTAS INFORMAÇÕES!)
const dbConfig = {
    host: 'localhost',      
    user: 'root',           
    password: '',           // Sua senha do MySQL no WAMP
    database: 'sme'   // O NOME DO SEU BANCO DE DADOS AQUI
};

let connection; 

// Conectar ao Banco de Dados
async function connectDB() {
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexão com o MySQL estabelecida!');
    } catch (err) {
        console.error('❌ ERRO ao conectar com o MySQL:', err.message);
        process.exit(1); 
    }
}

connectDB();

// 3. MIDDLEWARES
app.use(express.json()); 
// Permite acesso do frontend rodando em outra porta (ex: Live Server)
app.use(cors({ origin: 'http://127.0.0.1:5500' })); 

// 4. ROTA DE CADASTRO (POST /api/cadastro)
app.post('/api/cadastro', async (req, res) => {
    // Pega os dados do corpo da requisição
    const { 
        nome, 
        cpf, 
        email, 
        senha, // Senha em texto simples
        telefone 
    } = req.body; 

    // Define valores padrão/fixos para os campos não vindos do formulário
    const id_organizador = null; 
    const id_perfil = 1; 
    const status = 'ativo'; 
    const senha_hash = senha; // ATENÇÃO: Em produção, criptografe a senha aqui!

    // Validação básica
    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Nome, E-mail e Senha são obrigatórios.' });
    }

    try {
        // Query de Inserção SQL para a tabela USUARIOS
        const sql = `
            INSERT INTO USUARIOS 
            (id_organizador, id_perfil, nome, cpf, email, senha_hash, telefone, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const valores = [
            id_organizador, 
            id_perfil, 
            nome, 
            cpf, 
            email, 
            senha_hash, 
            telefone,
            status
        ];

        const [result] = await connection.execute(sql, valores);
        
        // Retorna o ID do usuário recém-criado
        res.status(201).json({ 
            message: 'Usuário cadastrado com sucesso!',
            id_usuario: result.insertId 
        });

    } catch (err) {
        console.error('Erro ao cadastrar usuário:', err);
        // Trata erro de e-mail duplicado (código 1062 no MySQL)
        if (err.errno === 1062) { 
            return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});


// 5. INICIALIZAÇÃO DO SERVIDOR
app.listen(PORT, () => {
    console.log(`🚀 Servidor Express rodando em http://localhost:${PORT}`);
});