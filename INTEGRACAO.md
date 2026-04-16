# 🔌 Guia de Integração Frontend com Backend

Instruções detalhadas para conectar o frontend RaceFlow com seu backend Node.js.

## 📋 Índice

1. [Preparação do Servidor](#preparação-do-servidor)
2. [Substituir Dados Mock](#substituir-dados-mock)
3. [Integração de Login](#integração-de-login)
4. [Integração de Cadastro](#integração-de-cadastro)
5. [Integração do Dashboard](#integração-do-dashboard)
6. [Integração do Admin](#integração-do-admin)
7. [Tratamento de Erros](#tratamento-de-erros)
8. [Testes](#testes)

## Preparação do Servidor

### 1. Configurar CORS no Backend

No seu `server.js` ou `app.js`, adicione:

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// Habilitar CORS
app.use(cors({
    origin: 'http://localhost:3000', // ou seu domínio
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    headers: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ... resto do código
```

### 2. Instalar dependências necessárias

```bash
npm install cors dotenv bcrypt jsonwebtoken
```

### 3. Servir o frontend junto ao backend

No seu `server.js`:

```javascript
const path = require('path');
const express = require('express');

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Rota catch-all para SPA
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});
```

## Substituir Dados Mock

### No `dashboard.html`, altere a função `loadDashboardData()`:

```javascript
function loadDashboardData() {
    // Antes (mock):
    // const corredores = generateMockCorredores();
    
    // Depois (real):
    Promise.all([
        fetch('/api/corredores').then(r => r.json()),
        fetch('/api/usuarios').then(r => r.json()),
        fetch('/api/voltas').then(r => r.json())
    ])
    .then(([corredores, usuarios, voltas]) => {
        // ... resto do código mantém igual
        populateCorredoresTable(corredores);
        populateUsuariosTable(usuarios);
        populateVoltasTable(voltas);
        // ... etc
    })
    .catch(error => {
        console.error('Erro ao carregar dados:', error);
        showErrorMessage('Erro ao carregar dados do servidor');
    });
}
```

## Integração de Login

### Update `login.html`:

```javascript
// Substituir a função de login de usuário
document.getElementById('formLoginUsuario').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('emailUsuario').value;
    const senha = document.getElementById('senhaUsuario').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                senha: senha,
                tipo: 'usuario'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.erro || 'Erro ao fazer login');
        }

        // Armazenar token e usuário
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        localStorage.setItem('userLoggedIn', JSON.stringify({
            type: 'usuario',
            email: data.user.email,
            name: data.user.nome
        }));

        showSuccessMessage('usuário');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);

    } catch (error) {
        console.error('Erro:', error);
        showErrorMessage(error.message);
    }
});

// Mesmo padrão para corredor
document.getElementById('formLoginCorredor').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('emailCorredor').value;
    const senha = document.getElementById('senhaCorredor').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                senha: senha,
                tipo: 'corredor'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.erro || 'Erro ao fazer login');
        }

        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        localStorage.setItem('userLoggedIn', JSON.stringify({
            type: 'corredor',
            email: data.user.email,
            name: data.user.nome,
            turma: data.user.turma,
            equipe: data.user.equipe
        }));

        showSuccessMessage('corredor');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);

    } catch (error) {
        console.error('Erro:', error);
        showErrorMessage(error.message);
    }
});
```

### No seu `routes/user.js`, adicione rota de login:

```javascript
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// LOGIN - Usuário
router.post('/login', async (req, res) => {
    const { email, senha, tipo } = req.body;

    try {
        if (tipo === 'usuario') {
            const [usuarios] = await db.query(
                'SELECT * FROM usuarios WHERE email = ?',
                [email]
            );

            if (usuarios.length === 0) {
                return res.status(401).json({ erro: 'Email ou senha incorretos' });
            }

            const usuario = usuarios[0];

            // Verificar senha (implemente bcrypt)
            if (usuario.senha !== senha) {
                return res.status(401).json({ erro: 'Email ou senha incorretos' });
            }

            const token = jwt.sign(
                { id: usuario.id, email: usuario.email, tipo: 'usuario' },
                process.env.JWT_SECRET || 'seu_segredo'
            );

            res.json({
                token,
                user: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email
                }
            });

        } else if (tipo === 'corredor') {
            const [corredores] = await db.query(
                'SELECT * FROM corredores WHERE email = ?',
                [email]
            );

            if (corredores.length === 0) {
                return res.status(401).json({ erro: 'Email ou senha incorretos' });
            }

            const corredor = corredores[0];

            if (corredor.senha !== senha) {
                return res.status(401).json({ erro: 'Email ou senha incorretos' });
            }

            const token = jwt.sign(
                { id: corredor.id, email: corredor.email, tipo: 'corredor' },
                process.env.JWT_SECRET || 'seu_segredo'
            );

            res.json({
                token,
                user: {
                    id: corredor.id,
                    nome: corredor.nome,
                    email: corredor.email,
                    turma: corredor.turma,
                    equipe: corredor.equipe
                }
            });
        }

    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

module.exports = router;
```

## Integração de Cadastro

### Update `cadastro.html`:

```javascript
// Cadastro Usuário
document.getElementById('formCadastroUsuario').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nomeUsuario').value;
    const email = document.getElementById('emailCadastroUsuario').value;
    const senha = document.getElementById('senhaCadastroUsuario').value;
    const confirmSenha = document.getElementById('confirmSenhaUsuario').value;
    
    if (senha !== confirmSenha) {
        showErrorMessage('As senhas não conferem');
        return;
    }
    
    try {
        const response = await fetch('/api/usuarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, email, senha })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.erro || 'Erro ao cadastrar');
        }

        localStorage.setItem('userLoggedIn', JSON.stringify({
            type: 'usuario',
            email: email,
            name: nome
        }));

        showSuccessMessage();
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);

    } catch (error) {
        console.error('Erro:', error);
        showErrorMessage(error.message);
    }
});

// Cadastro Corredor
document.getElementById('formCadastroCorredor').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nomeCorredor').value;
    const email = document.getElementById('emailCadastroCorredor').value;
    const senha = document.getElementById('senhaCadastroCorredor').value;
    const confirmSenha = document.getElementById('confirmSenhaCorredor').value;
    const turma = document.getElementById('turmaCorredor').value;
    const equipe = document.getElementById('equipeCorredor').value;
    
    if (senha !== confirmSenha) {
        showErrorMessage('As senhas não conferem');
        return;
    }
    
    try {
        const response = await fetch('/api/corredores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, email, senha, turma, equipe })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.erro || 'Erro ao cadastrar');
        }

        localStorage.setItem('userLoggedIn', JSON.stringify({
            type: 'corredor',
            email: email,
            name: nome,
            turma: turma,
            equipe: equipe
        }));

        showSuccessMessage();
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);

    } catch (error) {
        console.error('Erro:', error);
        showErrorMessage(error.message);
    }
});
```

## Integração do Dashboard

### Update `dashboard.html` - Buscar Dados:

```javascript
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('token');
        
        const [corredoresRes, usuariosRes, voltasRes] = await Promise.all([
            fetch('/api/corredores', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('/api/usuarios', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('/api/voltas', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        const corredores = await corredoresRes.json();
        const usuarios = await usuariosRes.json();
        const voltas = await voltasRes.json();

        // Atualizar stats
        document.getElementById('totalCorredores').textContent = corredores.length;
        document.getElementById('totalUsuarios').textContent = usuarios.length;
        document.getElementById('totalVoltas').textContent = voltas.length;

        const melhorVolta = voltas.length > 0 ? Math.min(...voltas.map(v => v.tempo)) : '--';
        document.getElementById('melhorVoltaGeral').textContent = melhorVolta !== '--' ? `${melhorVolta}s` : '--';

        // Tabelas
        populateCorredoresTable(corredores);
        populateUsuariosTable(usuarios);
        populateVoltasTable(voltas);
        populateTopVoltas(voltas, corredores);
        populateRankingEquipe(corredores);
        populateMelhorVoltaCorredor(corredores, voltas);
        populateRankingGeral(corredores, voltas);

    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showErrorMessage('Erro ao carregar dados do servidor');
    }
}
```

### Update - Adicionar Corredor:

```javascript
document.getElementById('corredorForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    const dados = {
        nome: document.getElementById('corredorNome').value,
        email: document.getElementById('corredorEmail').value,
        senha: document.getElementById('corredorSenha').value,
        turma: document.getElementById('corredorTurma').value,
        equipe: document.getElementById('corredorEquipe').value
    };

    try {
        const response = await fetch('/api/corredores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dados)
        });

        if (!response.ok) {
            throw new Error('Erro ao adicionar corredor');
        }

        showToast('Corredor adicionado com sucesso!', 'success');
        closeCorredorModal();
        loadDashboardData(); // Recarregar tabela

    } catch (error) {
        showToast(error.message, 'error');
    }
});
```

## Integração do Admin

### Mesmo padrão que Dashboard:

```javascript
async function loadAdminData() {
    try {
        const token = localStorage.getItem('token');
        
        const [corredoresRes, usuariosRes, voltasRes] = await Promise.all([
            fetch('/api/corredores', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('/api/usuarios', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('/api/voltas', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        const corredores = await corredoresRes.json();
        const usuarios = await usuariosRes.json();
        const voltas = await voltasRes.json();

        populateAdminCorredores(corredores);
        populateAdminUsuarios(usuarios);
        populateAdminVoltas(voltas);

    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}
```

### Deletar Corredor:

```javascript
function deletarCorredor(id) {
    if (confirm(`Tem certeza que deseja deletar o corredor #${id}?`)) {
        const token = localStorage.getItem('token');
        
        fetch(`/api/corredores/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('Erro ao deletar');
            showToast('Corredor deletado!', 'success');
            loadAdminData();
        })
        .catch(error => showToast(error.message, 'error'));
    }
}
```

## Tratamento de Erros

### Criar função global para erros:

```javascript
function handleFetchError(error) {
    console.error('Erro:', error);
    
    if (error.status === 401 || error.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('userLoggedIn');
        window.location.href = 'login.html';
    }
    
    showToast(error.message || 'Erro ao conectar com servidor', 'error');
}

// Usar em fetch calls:
.catch(error => handleFetchError(error));
```

## Testes

### 1. Testar Servidor Local

```bash
# Terminal 1
npm start

# Terminal 2
# O frontend será servido em http://localhost:3000
```

### 2. Testar Endpoints com cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@email.com","senha":"123456","tipo":"corredor"}'

# Listar corredores
curl -X GET http://localhost:3000/api/corredores

# Criar corredor
curl -X POST http://localhost:3000/api/corredores \
  -H "Content-Type: application/json" \
  -d '{"nome":"Novo","email":"novo@email.com","senha":"123456","turma":"A","equipe":"Red"}'
```

### 3. Testar no Navegador

1. Abrir DevTools (F12)
2. Abrir Console
3. Executar testes:

```javascript
// Testar fetch
fetch('/api/corredores')
  .then(r => r.json())
  .then(data => console.log(data));

// Testar login
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'joao@email.com',
    senha: '123456',
    tipo: 'corredor'
  })
}).then(r => r.json()).then(console.log);
```

---

## ✅ Checklist de Integração

- [ ] CORS configurado no backend
- [ ] Rotas de autenticação implementadas
- [ ] Rotas GET para listar dados
- [ ] Rotas POST para criar dados
- [ ] Rotas PUT para atualizar dados
- [ ] Rotas DELETE para deletar dados
- [ ] Frontend substituído dos dados mock
- [ ] Tratamento de erros implementado
- [ ] JWT configurado corretamente
- [ ] Testes funcionando

---

**Dúvidas? Consulte a documentação do seu backend ou a API Reference.** 🚀
