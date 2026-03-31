# 🚀 MiniDiscord - Quick Start Guide

Guia rápido para começar com MiniDiscord em 5 minutos!

## 📋 Pré-requisitos

- Java 17+
- Maven 3.6+
- MongoDB rodando (geralmente em localhost:27017)

## ⚡ Iniciar Rapidamente

### Passo 1: Iniciar MongoDB

**Linux/Mac:**
```bash
mongod
```

**Windows:**
```bash
# Se instalado via chocolatey
mongosh
```

### Passo 2: Compilar e Executar

```bash
cd Minidiscord-feature

# Compilar
mvn clean package

# Executar
mvn spring-boot:run
```

Ou simplesmente:
```bash
./mvnw spring-boot:run
```

### Passo 3: Abrir no Navegador

Acesse: **http://localhost:8080/chat**

## 🎯 Primeiros Passos na Interface

### 1️⃣ Criar um Servidor

```
1. Clique em "Novo Servidor" (botão azul no topo direito)
2. Digite o nome: "Meu Servidor"
3. Digite a descrição (opcional)
4. Clique em "Criar"
```

✅ **Seu servidor foi criado!**

### 2️⃣ Criar um Canal de Texto

```
1. Clique no seu servidor na sidebar esquerda
2. No painel de canais, clique em "➕ Novo Canal"
3. Digite o nome: "geral"
4. Tipo: "Texto"
5. Clique em "Criar"
```

✅ **Canal criado! Você pode enviar mensagens agora**

### 3️⃣ Enviar Mensagens

```
1. Selecione o canal "geral"
2. No input de mensagem (parte inferior), digite algo
3. Pressione ENTER ou clique em "Enviar"
4. A mensagem aparece em tempo real! 🎉
```

### 4️⃣ Criar um Canal de Voz

```
1. No painel de canais, clique em "➕ Novo Canal"
2. Digite o nome: "voice-chat"
3. Tipo: "Voz"
4. Clique em "Criar"
```

✅ **Canal de voz criado!**

### 5️⃣ Iniciar uma Chamada de Voz

```
1. Clique no canal de voz "voice-chat"
2. Clique no ícone 🎤 (Voz) no topo
3. Permita ao navegador acessar seu microfone
4. Você está na chamada!
```

### 6️⃣ Iniciar uma Videochamada

```
1. Clique no canal de voz "voice-chat"
2. Clique no ícone 📹 (Vídeo) no topo
3. Permita ao navegador acessar câmera e microfone
4. Sua câmera aparece na tela
5. Use os botões para:
   - 🎤 Ligar/desligar microfone
   - 📹 Ligar/desligar câmera
   - ☎️ Encerrar chamada
```

## 💡 Dicas Úteis

### Adicionar Mais Servidores

```
Você pode criar múltiplos servidores clicando em "Novo Servidor" sempre que quiser.
Todos os seus servidores aparecem na sidebar esquerda.
```

### Organizar Canais

```
Crie múltiplos canais dentro do mesmo servidor:
- #geral
- #anúncios
- #ajuda
- #off-topic
- voice-pública
- voice-privada
```

### Convidar Outros Usuários

```
Atualmente a aplicação funciona offline.
Para multi-usuário, você pode:
1. Executar em múltiplos navegadores
2. Usar em diferentes máquinas na mesma rede
3. Usar ferramentas como ngrok para expor publicamente
```

## 🔧 Variáveis Importantes

Você pode personalizar em `src/main/resources/application.properties`:

```properties
# Porta do servidor
server.port=8080

# Conexão MongoDB
spring.data.mongodb.uri=mongodb://localhost:27017/minidiscord

# Google OAuth2 (se quiser integrar autenticação)
spring.security.oauth2.client.registration.google.client-id=...
spring.security.oauth2.client.registration.google.client-secret=...
```

## 🐛 Troubleshooting Rápido

### ❌ "Não consigo conectar"
```
✅ Isso significa que o servidor não está rodando
Solução:
  1. Abra outro terminal
  2. Execute: mvn spring-boot:run
  3. Aguarde até ver "MiniDiscord está rodando"
```

### ❌ "MongoDB não conecta"
```
✅ MongoDB não está disponível
Solução:
  1. Verifique se MongoDB está instalado: mongod --version
  2. Inicie MongoDB: mongod
  3. Verifique a porta: geralmente 27017
```

### ❌ "Microfone/Câmera não funciona"
```
✅ Navegador precisa de permissão
Solução:
  1. Procure o ícone 🔒 na barra de endereço
  2. Clique e permita Câmera e Microfone
  3. Recarregue a página: F5
```

### ❌ "Mensagens não aparecem em tempo real"
```
✅ WebSocket pode não estar conectado
Solução:
  1. Abra o console do navegador: F12
  2. Procure por erros
  3. Verifique se está em http://localhost:8080 (não https)
  4. Recarregue a página: F5
```

## 🧪 Testar a API com cURL

### Listar Servidores de um Usuário

```bash
curl http://localhost:8080/api/servers/user/user123

# Resposta exemplo:
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "Meu Servidor",
    "description": "Um servidor incrível",
    "memberIds": ["user123"],
    "channelIds": ["507f1f77bcf86cd799439012"]
  }
]
```

### Listar Canais de um Servidor

```bash
curl http://localhost:8080/api/channels/server/SERVER_ID

# Resposta exemplo:
[
  {
    "id": "507f1f77bcf86cd799439012",
    "serverId": "507f1f77bcf86cd799439011",
    "name": "geral",
    "type": "TEXT"
  },
  {
    "id": "507f1f77bcf86cd799439013",
    "serverId": "507f1f77bcf86cd799439011",
    "name": "voice-chat",
    "type": "VOICE"
  }
]
```

### Listar Mensagens de um Canal

```bash
curl http://localhost:8080/api/messages/channel/CHANNEL_ID

# Resposta exemplo:
[
  {
    "id": "507f1f77bcf86cd799439014",
    "channelId": "507f1f77bcf86cd799439012",
    "userId": "user123",
    "userName": "João",
    "content": "Olá pessoal!",
    "timestamp": "2024-03-19T17:30:00"
  }
]
```

## 📚 Próximos Passos

Depois de testar localmente, você pode:

1. **Adicionar Autenticação Real**
   - Integrar com Google OAuth2
   - Adicionar validação de usuários

2. **Melhorar WebRTC**
   - Adicionar STUN/TURN servers
   - Implementar oferta/resposta SDP
   - Adicionar ice candidates

3. **Deploy**
   - Fazer upload no Heroku
   - Deploy em AWS/Azure/Google Cloud
   - Usar Docker para containerização

4. **Adicionar Mais Features**
   - Edição de mensagens
   - Deleção de mensagens
   - Reações com emojis
   - Compartilhamento de arquivos

## 🎓 Conceitos Aprendidos

Neste projeto você praticar:

- ✅ **Spring Boot 4** - Framework Java moderno
- ✅ **MongoDB** - Banco NoSQL
- ✅ **WebSocket** com STOMP - Comunicação em tempo real
- ✅ **REST API** - Endpoints HTTP
- ✅ **WebRTC** - Voz e vídeo P2P
- ✅ **HTML/CSS/JavaScript** - Frontend moderno
- ✅ **Async Programming** - Promessas e callbacks
- ✅ **Security** - OAuth2 e CORS

## 🆘 Precisa de Ajuda?

1. **Verifica os logs**
   ```bash
   # Os logs aparecem no terminal onde você rodou mvn spring-boot:run
   ```

2. **Console do Navegador**
   ```bash
   # Pressione F12 → Console
   # Procure por erros em vermelho
   ```

3. **MongoDB Client**
   ```bash
   # Verifique os dados salvos:
   mongosh
   > use minidiscord
   > db.servers.find()
   > db.channels.find()
   > db.messages.find()
   ```

---

**🎉 Parabéns! Você tem um sistema de chat em tempo real funcionando!**

Divirta-se explorando e customizando o MiniDiscord! 🚀
