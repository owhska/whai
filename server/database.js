const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Criar diretórios de dados e uploads
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'pcp.db');

// Conectar ao banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar com o banco SQLite:', err.message);
    } else {
        console.log('Conectado ao banco SQLite com sucesso!');
        initializeDatabase();
    }
});

// Função para inicializar as tabelas
function initializeDatabase() {
    console.log('🔧 Inicializando banco de dados SQLite...');

    // 1. Tabela de usuários
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            uid VARCHAR(255) PRIMARY KEY,
            nome_completo VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255),
            cargo VARCHAR(50) DEFAULT 'usuario',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('❌ Erro ao criar tabela usuarios:', err.message);
        } else {
            console.log('✅ Tabela usuarios criada/verificada com sucesso!');
        }
    });

    // 2. Tabela de tarefas
    db.run(`
        CREATE TABLE IF NOT EXISTS tarefas (
            id VARCHAR(255) PRIMARY KEY,
            titulo VARCHAR(255) NOT NULL,
            responsavel VARCHAR(255) NOT NULL,
            responsavel_id VARCHAR(255) NOT NULL,
            data_vencimento DATE,
            observacoes TEXT,
            status VARCHAR(50) DEFAULT 'pendente',
            recorrente BOOLEAN DEFAULT FALSE,
            frequencia VARCHAR(50) DEFAULT 'mensal',
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (responsavel_id) REFERENCES usuarios (uid)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Erro ao criar tabela tarefas:', err.message);
        } else {
            console.log('✅ Tabela tarefas criada/verificada com sucesso!');
        }
    });

    // 3. Tabela para metadados de arquivos
    db.run(`
        CREATE TABLE IF NOT EXISTS arquivos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename VARCHAR(255) NOT NULL,
            original_name VARCHAR(255) NOT NULL,
            file_path VARCHAR(500) NOT NULL,
            mime_type VARCHAR(100) NOT NULL,
            size INTEGER NOT NULL,
            task_id VARCHAR(255) NOT NULL,
            uploaded_by VARCHAR(255) NOT NULL,
            upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            download_count INTEGER DEFAULT 0,
            FOREIGN KEY (task_id) REFERENCES tarefas (id),
            FOREIGN KEY (uploaded_by) REFERENCES usuarios (uid)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Erro ao criar tabela arquivos:', err.message);
        } else {
            console.log('✅ Tabela arquivos criada/verificada com sucesso!');
        }
    });

    // 4. Tabela de logs de atividade
    db.run(`
        CREATE TABLE IF NOT EXISTS atividade_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id VARCHAR(255) NOT NULL,
            user_email VARCHAR(255) NOT NULL,
            action VARCHAR(100) NOT NULL,
            task_id VARCHAR(255),
            task_title VARCHAR(255),
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES usuarios (uid),
            FOREIGN KEY (task_id) REFERENCES tarefas (id)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Erro ao criar tabela atividade_logs:', err.message);
        } else {
            console.log('✅ Tabela atividade_logs criada/verificada com sucesso!');
        }
    });

    // 5. Tabela de logs de arquivos
    db.run(`
        CREATE TABLE IF NOT EXISTS arquivo_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            arquivo_id INTEGER NOT NULL,
            action VARCHAR(50) NOT NULL,
            user_id VARCHAR(255) NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (arquivo_id) REFERENCES arquivos (id),
            FOREIGN KEY (user_id) REFERENCES usuarios (uid)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Erro ao criar tabela arquivo_logs:', err.message);
        } else {
            console.log('✅ Tabela arquivo_logs criada/verificada com sucesso!');
        }
    });

    // 6. Tabela de contatos
    db.run(`
        CREATE TABLE IF NOT EXISTS contatos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            avatar VARCHAR(10) DEFAULT '👤',
            tags TEXT, -- JSON string
            note TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES usuarios (uid)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Erro ao criar tabela contatos:', err.message);
        } else {
            console.log('✅ Tabela contatos criada/verificada com sucesso!');
        }
    });

    // 7. Tabela de conversas
    db.run(`
        CREATE TABLE IF NOT EXISTS conversas (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255),
            last_message TEXT,
            last_timestamp DATETIME,
            unread_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('❌ Erro ao criar tabela conversas:', err.message);
        } else {
            console.log('✅ Tabela conversas criada/verificada com sucesso!');
        }
    });

    // 8. Tabela de mensagens
    db.run(`
        CREATE TABLE IF NOT EXISTS mensagens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversa_id VARCHAR(255) NOT NULL,
            sender VARCHAR(255),
            text TEXT NOT NULL,
            sent BOOLEAN DEFAULT 1,
            read BOOLEAN DEFAULT 0,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversa_id) REFERENCES conversas (id)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Erro ao criar tabela mensagens:', err.message);
        } else {
            console.log('✅ Tabela mensagens criada/verificada com sucesso!');
        }
    });

    // 9. Tabela de configurações de agente (auto-resposta, horários)
    db.run(`
        CREATE TABLE IF NOT EXISTS agente_config (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            enabled BOOLEAN DEFAULT 0,
            business_start VARCHAR(5) DEFAULT '09:00',
            business_end VARCHAR(5) DEFAULT '18:00',
            welcome_message TEXT DEFAULT 'Olá! Como posso ajudá-lo?',
            away_message TEXT DEFAULT 'Estamos fora do horário de atendimento. Retornaremos em breve.'
        )
    `, (err) => {
        if (err) {
            console.error('❌ Erro ao criar tabela agente_config:', err.message);
        } else {
            console.log('✅ Tabela agente_config criada/verificada com sucesso!');
            // Inserir linha única padrão se não existir
            db.run(`INSERT OR IGNORE INTO agente_config (id) VALUES (1)`);
        }
    });

    // 10. Tabela de serviços/agentes habilitados e cards
    db.run(`
        CREATE TABLE IF NOT EXISTS agente_servicos (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            servicoA BOOLEAN DEFAULT 1,
            servicoB BOOLEAN DEFAULT 0,
            servicoC BOOLEAN DEFAULT 0,
            servicoD BOOLEAN DEFAULT 1
        )
    `, (err) => {
        if (err) {
            console.error('❌ Erro ao criar tabela agente_servicos:', err.message);
        } else {
            console.log('✅ Tabela agente_servicos criada/verificada com sucesso!');
            db.run(`INSERT OR IGNORE INTO agente_servicos (id) VALUES (1)`);
        }
    });

    // 11. Tabela de templates de mensagem
    db.run(`
        CREATE TABLE IF NOT EXISTS message_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('❌ Erro ao criar tabela message_templates:', err.message);
        } else {
            console.log('✅ Tabela message_templates criada/verificada com sucesso!');
        }
    });

    // Migração: adicionar campo password se não existir
    db.run(`ALTER TABLE usuarios ADD COLUMN password VARCHAR(255)`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('❌ Erro na migração do campo password:', err.message);
        } else if (!err) {
            console.log('✅ Campo password adicionado à tabela usuarios!');
        }
    });

    console.log('🎉 Inicialização do banco de dados concluída!');
}

// Função para criar nova tarefa com validação e melhor error handling
function createTask(taskData) {
    return new Promise((resolve, reject) => {
        const { id, titulo, responsavel, responsavelId, dataVencimento, observacoes, recorrente = false, frequencia = 'mensal' } = taskData;

        // Validações
        if (!id || !titulo || !responsavel || !responsavelId) {
            const error = new Error(`Dados obrigatórios faltando: ${JSON.stringify({ id, titulo, responsavel, responsavelId })}`);
            console.error(`❌ Erro ao criar tarefa: ${error.message}`);
            return reject(error);
        }
        if (titulo.length > 255) {
            const error = new Error(`Título excede 255 caracteres: ${titulo}`);
            console.error(`❌ Erro ao criar tarefa: ${error.message}`);
            return reject(error);
        }
        if (dataVencimento && isNaN(new Date(dataVencimento).getTime())) {
            const error = new Error(`Data de vencimento inválida: ${dataVencimento}`);
            console.error(`❌ Erro ao criar tarefa: ${error.message}`);
            return reject(error);
        }

        const sql = `
            INSERT INTO tarefas (id, titulo, responsavel, responsavel_id, data_vencimento, observacoes, recorrente, frequencia)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(sql, [id, titulo, responsavel, responsavelId, dataVencimento || null, observacoes || null, recorrente, frequencia], function(err) {
            if (err) {
                console.error(`❌ Erro ao inserir tarefa "${titulo}": ${err.message}`);
                reject(err);
            } else {
                console.log(`✅ Tarefa criada com sucesso: ${titulo} (ID: ${id})`);
                resolve({ id, ...taskData });
            }
        });
    });
}

// Função para verificar se uma tarefa já existe (para evitar duplicatas)
function checkTaskExists(titulo, dataVencimento, responsavelId) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT id FROM tarefas 
            WHERE titulo = ? AND data_vencimento = ? AND responsavel_id = ?
        `;
        db.get(sql, [titulo, dataVencimento, responsavelId], (err, row) => {
            if (err) {
                console.error(`❌ Erro ao verificar tarefa existente: ${err.message}`);
                reject(err);
            } else {
                resolve(!!row);
            }
        });
    });
}

// Função para inserir um novo arquivo
function insertFile(fileData) {
    return new Promise((resolve, reject) => {
        const { filename, originalName, filePath, mimeType, size, taskId, uploadedBy } = fileData;
        
        const sql = `
            INSERT INTO arquivos (filename, original_name, file_path, mime_type, size, task_id, uploaded_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.run(sql, [filename, originalName, filePath, mimeType, size, taskId, uploadedBy], function(err) {
            if (err) {
                console.error(`❌ Erro ao inserir arquivo "${filename}": ${err.message}`);
                reject(err);
            } else {
                console.log(`✅ Arquivo inserido: ${filename} (Task ID: ${taskId})`);
                resolve({
                    id: this.lastID,
                    filename,
                    originalName,
                    filePath,
                    mimeType,
                    size,
                    taskId,
                    uploadedBy,
                    uploadDate: new Date().toISOString()
                });
            }
        });
    });
}

// Função para buscar arquivos por task_id
function getFilesByTaskId(taskId) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT * FROM arquivos 
            WHERE task_id = ? 
            ORDER BY upload_date DESC
        `;
        
        db.all(sql, [taskId], (err, rows) => {
            if (err) {
                console.error(`❌ Erro ao buscar arquivos para task ${taskId}: ${err.message}`);
                reject(err);
            } else {
                console.log(`✅ Encontrados ${rows.length} arquivos para task ${taskId}`);
                resolve(rows);
            }
        });
    });
}

// Função para buscar um arquivo por ID
function getFileById(fileId) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM arquivos WHERE id = ?`;
        
        db.get(sql, [fileId], (err, row) => {
            if (err) {
                console.error(`❌ Erro ao buscar arquivo ${fileId}: ${err.message}`);
                reject(err);
            } else {
                console.log(`✅ Arquivo encontrado: ${row ? row.filename : 'Nenhum arquivo'}`);
                resolve(row);
            }
        });
    });
}

// Função para deletar um arquivo
function deleteFile(fileId) {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM arquivos WHERE id = ?`;
        
        db.run(sql, [fileId], function(err) {
            if (err) {
                console.error(`❌ Erro ao deletar arquivo ${fileId}: ${err.message}`);
                reject(err);
            } else {
                console.log(`✅ Arquivo ${fileId} deletado`);
                resolve({ deletedRows: this.changes });
            }
        });
    });
}

// Função para incrementar contador de downloads
function incrementDownloadCount(fileId) {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE arquivos SET download_count = download_count + 1 WHERE id = ?`;
        
        db.run(sql, [fileId], function(err) {
            if (err) {
                console.error(`❌ Erro ao incrementar contador de downloads para arquivo ${fileId}: ${err.message}`);
                reject(err);
            } else {
                console.log(`✅ Contador de downloads incrementado para arquivo ${fileId}`);
                resolve({ updatedRows: this.changes });
            }
        });
    });
}

// Função para log de atividades de arquivos
function logFileActivity(arquivoId, action, userId) {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO arquivo_logs (arquivo_id, action, user_id)
            VALUES (?, ?, ?)
        `;
        
        db.run(sql, [arquivoId, action, userId], function(err) {
            if (err) {
                console.error(`❌ Erro ao logar atividade para arquivo ${arquivoId}: ${err.message}`);
                reject(err);
            } else {
                console.log(`✅ Atividade logada para arquivo ${arquivoId}: ${action}`);
                resolve({ id: this.lastID });
            }
        });
    });
}

// Função para buscar usuário por email
function getUserByEmail(email) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM usuarios WHERE email = ?`;
        db.get(sql, [email], (err, row) => {
            if (err) {
                console.error(`❌ Erro ao buscar usuário por email (${email}): ${err.message}`);
                reject(err);
            } else {
                console.log(`✅ Usuário encontrado: ${row ? row.email : 'Nenhum usuário'}`);
                resolve(row);
            }
        });
    });
}

// Função para buscar todos os usuários
function getAllUsers() {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM usuarios ORDER BY nome_completo`;
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error(`❌ Erro ao buscar todos os usuários: ${err.message}`);
                reject(err);
            } else {
                console.log(`✅ Encontrados ${rows.length} usuários`);
                resolve(rows);
            }
        });
    });
}

// Função para buscar usuário por UID
function getUserByUid(uid) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM usuarios WHERE uid = ?`;
        db.get(sql, [uid], (err, row) => {
            if (err) {
                console.error(`❌ Erro ao buscar usuário por UID (${uid}): ${err.message}`);
                reject(err);
            } else {
                console.log(`✅ Usuário encontrado: ${row ? row.email : 'Nenhum usuário'}`);
                resolve(row);
            }
        });
    });
}

// Função para inserir ou atualizar usuário
function upsertUser(userData) {
    return new Promise((resolve, reject) => {
        const { uid, nomeCompleto, email, password, cargo = 'usuario' } = userData;
        
        const sql = `
            INSERT OR REPLACE INTO usuarios (uid, nome_completo, email, password, cargo, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;
        
        db.run(sql, [uid, nomeCompleto, email, password, cargo], function(err) {
            if (err) {
                console.error(`❌ Erro ao inserir/atualizar usuário ${email}: ${err.message}`);
                reject(err);
            } else {
                console.log(`✅ Usuário ${email} inserido/atualizado com sucesso`);
                resolve({ uid, nomeCompleto, email, cargo });
            }
        });
    });
}

// Função para deletar usuário
function deleteUser(uid) {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM usuarios WHERE uid = ?`;
        db.run(sql, [uid], function(err) {
            if (err) {
                console.error(`❌ Erro ao deletar usuário ${uid}: ${err.message}`);
                reject(err);
            } else {
                console.log(`✅ Usuário ${uid} deletado`);
                resolve({ deletedRows: this.changes });
            }
        });
    });
}

// Função para buscar tarefa por ID
function getTaskById(taskId) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM tarefas WHERE id = ?`;
        db.get(sql, [taskId], (err, row) => {
            if (err) {
                console.error(`❌ Erro ao buscar tarefa ${taskId}: ${err.message}`);
                reject(err);
            } else {
                console.log(`✅ Tarefa encontrada: ${row ? row.titulo : 'Nenhuma tarefa'}`);
                resolve(row);
            }
        });
    });
}

// Função para buscar todas as tarefas
function getAllTasks() {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM tarefas ORDER BY data_criacao DESC`;
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error(`❌ Erro ao buscar todas as tarefas: ${err.message}`);
                reject(err);
            } else {
                console.log(`✅ Encontradas ${rows.length} tarefas`);
                resolve(rows);
            }
        });
    });
}

// Função para buscar tarefas por usuário
function getTasksByUser(userId) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM tarefas WHERE responsavel_id = ? ORDER BY data_criacao DESC`;
        db.all(sql, [userId], (err, rows) => {
            if (err) {
                console.error(`❌ Erro ao buscar tarefas para usuário ${userId}: ${err.message}`);
                reject(err);
            } else {
                console.log(`✅ Encontradas ${rows.length} tarefas para usuário ${userId}`);
                resolve(rows);
            }
        });
    });
}

// Função para atualizar status da tarefa
function updateTaskStatus(taskId, status) {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE tarefas SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        db.run(sql, [status, taskId], function(err) {
            if (err) {
                console.error(`❌ Erro ao atualizar status da tarefa ${taskId}: ${err.message}`);
                reject(err);
            } else {
                console.log(`✅ Status da tarefa ${taskId} atualizado para ${status}`);
                resolve({ taskId, status, updatedRows: this.changes });
            }
        });
    });
}

// Função para atualizar tarefa completa
function updateTask(taskId, taskData) {
    return new Promise((resolve, reject) => {
        const { titulo, responsavel, responsavelId, dataVencimento, observacoes, recorrente, frequencia } = taskData;
        
        const sql = `
            UPDATE tarefas SET 
                titulo = ?,
                responsavel = ?,
                responsavel_id = ?,
                data_vencimento = ?,
                observacoes = ?,
                recorrente = ?,
                frequencia = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        db.run(sql, [titulo, responsavel, responsavelId, dataVencimento, observacoes, recorrente, frequencia, taskId], function(err) {
            if (err) {
                console.error(`❌ Erro ao atualizar tarefa ${taskId}: ${err.message}`);
                reject(err);
            } else {
                console.log(`✅ Tarefa ${taskId} atualizada`);
                resolve({ taskId, updatedRows: this.changes });
            }
        });
    });
}

// Função para deletar tarefa
function deleteTask(taskId) {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM tarefas WHERE id = ?`;
        db.run(sql, [taskId], function(err) {
            if (err) {
                console.error(`❌ Erro ao deletar tarefa ${taskId}: ${err.message}`);
                reject(err);
            } else {
                console.log(`✅ Tarefa ${taskId} deletada`);
                resolve({ deletedRows: this.changes });
            }
        });
    });
}

// Função para inserir log de atividade
function insertActivityLog(logData) {
    return new Promise((resolve, reject) => {
        const { userId, userEmail, action, taskId, taskTitle } = logData;
        
        const sql = `
            INSERT INTO atividade_logs (user_id, user_email, action, task_id, task_title)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        db.run(sql, [userId, userEmail, action, taskId, taskTitle], function(err) {
            if (err) {
                console.error(`❌ Erro ao logar atividade: ${err.message}`);
                reject(err);
            } else {
                console.log(`✅ Atividade logada: ${action} (Task: ${taskTitle || 'N/A'})`);
                resolve({
                    id: this.lastID,
                    userId,
                    userEmail,
                    action,
                    taskId,
                    taskTitle
                });
            }
        });
    });
}

// Função para buscar logs de atividade
function getActivityLogs(userId = null, limit = 100) {
    return new Promise((resolve, reject) => {
        let sql, params;
        if (userId) {
            sql = `SELECT * FROM atividade_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?`;
            params = [userId, limit];
        } else {
            sql = `SELECT * FROM atividade_logs ORDER BY timestamp DESC LIMIT ?`;
            params = [limit];
        }
        
        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error(`❌ Erro ao buscar logs de atividade: ${err.message}`);
                reject(err);
            } else {
                console.log(`✅ Encontrados ${rows.length} logs de atividade`);
                resolve(rows);
            }
        });
    });
}

// Contatos - CRUD
function getContacts() {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM contatos ORDER BY created_at DESC`;
        db.all(sql, [], (err, rows) => {
            if (err) return reject(err);
            resolve(rows.map(r => ({
                id: r.id,
                userId: r.user_id,
                name: r.name,
                phone: r.phone,
                avatar: r.avatar,
                tags: r.tags ? JSON.parse(r.tags) : [],
                note: r.note,
                createdAt: r.created_at,
                updatedAt: r.updated_at
            })));
        });
    });
}

function createContact(contact) {
    return new Promise((resolve, reject) => {
        const { userId, name, phone, avatar = '👤', tags = [], note = '' } = contact;
        const sql = `INSERT INTO contatos (user_id, name, phone, avatar, tags, note) VALUES (?, ?, ?, ?, ?, ?)`;
        db.run(sql, [userId, name, phone || null, avatar, JSON.stringify(tags), note || null], function(err){
            if (err) return reject(err);
            resolve({ id: this.lastID, userId, name, phone, avatar, tags, note });
        });
    });
}

function updateContact(id, contact) {
    return new Promise((resolve, reject) => {
        const { name, phone, avatar = '👤', tags = [], note = '' } = contact;
        const sql = `UPDATE contatos SET name = ?, phone = ?, avatar = ?, tags = ?, note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        db.run(sql, [name, phone || null, avatar, JSON.stringify(tags), note || null, id], function(err){
            if (err) return reject(err);
            resolve({ updatedRows: this.changes });
        });
    });
}

function deleteContact(id) {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM contatos WHERE id = ?`, [id], function(err){
            if (err) return reject(err);
            resolve({ deletedRows: this.changes });
        });
    });
}

// Conversas e Mensagens (simulação local)
function upsertChat(chat) {
    return new Promise((resolve, reject) => {
        const { id, name, lastMessage = '', lastTimestamp = null, unread = 0 } = chat;
        const sql = `INSERT INTO conversas (id, name, last_message, last_timestamp, unread_count)
                     VALUES (?, ?, ?, ?, ?)
                     ON CONFLICT(id) DO UPDATE SET
                        name=excluded.name,
                        last_message=excluded.last_message,
                        last_timestamp=excluded.last_timestamp,
                        unread_count=excluded.unread_count,
                        updated_at=CURRENT_TIMESTAMP`;
        db.run(sql, [id, name, lastMessage, lastTimestamp, unread], function(err){
            if (err) return reject(err);
            resolve({ id, name, lastMessage, lastTimestamp, unread });
        });
    });
}

function getChats() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM conversas ORDER BY COALESCE(last_timestamp, created_at) DESC`, [], (err, rows) => {
            if (err) return reject(err);
            resolve(rows.map(r => ({
                id: r.id,
                name: r.name,
                lastMessage: r.last_message || '',
                timestamp: r.last_timestamp,
                unreadCount: r.unread_count
            })));
        });
    });
}

function createMessage(conversaId, message) {
    return new Promise((resolve, reject) => {
        const { sender = null, text, sent = 1, read = 0, timestamp = new Date().toISOString() } = message;
        const sql = `INSERT INTO mensagens (conversa_id, sender, text, sent, read, timestamp) VALUES (?, ?, ?, ?, ?, ?)`;
        db.run(sql, [conversaId, sender, text, sent ? 1 : 0, read ? 1 : 0, timestamp], function(err){
            if (err) return reject(err);
            // Atualizar conversa
            db.run(`UPDATE conversas SET last_message = ?, last_timestamp = ?, unread_count = CASE WHEN ? = 0 THEN unread_count + 1 ELSE unread_count END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [text, timestamp, sent ? 0 : 1, conversaId]);
            resolve({ id: this.lastID, conversaId, sender, text, sent: !!sent, read: !!read, timestamp });
        });
    });
}

function markChatAsRead(conversaId) {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE conversas SET unread_count = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [conversaId], function(err){
            if (err) return reject(err);
            resolve({ updatedRows: this.changes });
        });
    });
}

function getMessagesByChat(conversaId, limit = 200) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM mensagens WHERE conversa_id = ? ORDER BY timestamp ASC LIMIT ?`, [conversaId, limit], (err, rows) => {
            if (err) return reject(err);
            resolve(rows.map(r => ({ id: r.id, conversaId: r.conversa_id, sender: r.sender, text: r.text, sent: !!r.sent, read: !!r.read, timestamp: r.timestamp })));
        });
    });
}

// Configurações de agente e serviços
function getAgentConfig() {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM agente_config WHERE id = 1`, [], (err, row) => {
            if (err) return reject(err);
            resolve({
                enabled: !!row.enabled,
                businessHours: { start: row.business_start, end: row.business_end },
                welcomeMessage: row.welcome_message,
                awayMessage: row.away_message
            });
        });
    });
}

function setAgentConfig(config) {
    return new Promise((resolve, reject) => {
        const { enabled, businessHours, welcomeMessage, awayMessage } = config;
        const sql = `UPDATE agente_config SET enabled = ?, business_start = ?, business_end = ?, welcome_message = ?, away_message = ? WHERE id = 1`;
        db.run(sql, [enabled ? 1 : 0, businessHours.start, businessHours.end, welcomeMessage, awayMessage], function(err){
            if (err) return reject(err);
            resolve({ updatedRows: this.changes });
        });
    });
}

function getAgentServices() {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM agente_servicos WHERE id = 1`, [], (err, row) => {
            if (err) return reject(err);
            resolve({
                servicoA: !!row.servicoA,
                servicoB: !!row.servicoB,
                servicoC: !!row.servicoC,
                servicoD: !!row.servicoD
            });
        });
    });
}

function setAgentServices(services) {
    return new Promise((resolve, reject) => {
        const { servicoA, servicoB, servicoC, servicoD } = services;
        const sql = `UPDATE agente_servicos SET servicoA = ?, servicoB = ?, servicoC = ?, servicoD = ? WHERE id = 1`;
        db.run(sql, [servicoA ? 1 : 0, servicoB ? 1 : 0, servicoC ? 1 : 0, servicoD ? 1 : 0], function(err){
            if (err) return reject(err);
            resolve({ updatedRows: this.changes });
        });
    });
}

// Templates
function getMessageTemplates() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM message_templates ORDER BY created_at DESC`, [], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

function createMessageTemplate({ name, content }) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO message_templates (name, content) VALUES (?, ?)`, [name, content], function(err){
            if (err) return reject(err);
            resolve({ id: this.lastID, name, content });
        });
    });
}

module.exports = {
    db,
    insertFile,
    getFilesByTaskId,
    getFileById,
    deleteFile,
    incrementDownloadCount,
    logFileActivity,
    uploadsDir,
    upsertUser,
    getUserByUid,
    getUserByEmail,
    getAllUsers,
    deleteUser,
    createTask,
    getTaskById,
    getAllTasks,
    getTasksByUser,
    updateTaskStatus,
    updateTask,
    deleteTask,
    insertActivityLog,
    getActivityLog: getActivityLogs,
    checkTaskExists,
    // contatos
    getContacts,
    createContact,
    updateContact,
    deleteContact,
    // conversas/mensagens
    upsertChat,
    getChats,
    createMessage,
    markChatAsRead,
    getMessagesByChat,
    // agente config/serviços
    getAgentConfig,
    setAgentConfig,
    getAgentServices,
    setAgentServices,
    // templates
    getMessageTemplates,
    createMessageTemplate
};
