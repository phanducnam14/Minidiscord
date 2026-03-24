# 📐 MiniDiscord - System Architecture & API Reference

Documentação completa da arquitetura do sistema e especificações de API.

## 🏗️ Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Frontend)                       │
│  HTML + CSS + JavaScript (SockJS + STOMP + WebRTC)         │
│  • chat.html - Interface responsiva                        │
│  • chat.js - Lógica do cliente                             │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
   REST API      WebSocket    WebRTC
   (HTTP)        (STOMP)      (P2P)
        │            │            │
┌───────▼────────────▼────────────▼──────────────────────────┐
│              SERVIDOR (Backend - Spring Boot)               │
│                                                              │
│   Controllers                                               │
│   ├── ChatWebSocketController                              │
│   ├── ServerController                                     │
│   ├── ChannelController                                    │
│   ├── MessageController                                    │
│   ├── VoiceController                                      │
│   └── ChatPageController                                    │
│                                                              │
│   Services                                                  │
│   ├── ServerService                                        │
│   ├── ChannelService                                       │
│   ├── MessageService                                       │
│   └── VoiceService                                         │
│                                                              │
│   Configuration                                             │
│   ├── WebSocketConfig                                      │
│   ├── SecurityConfig                                       │
│   └── OAuth2ClientConfiguration                            │
│                                                              │
│   DTOs                                                      │
│   ├── ServerDTO, ChannelDTO, MessageDTO                   │
│   └── ChatMessageDTO                                       │
└───────────┬─────────────────────────────────────────────────┘
            │
            │ (Stored Data)
            │
┌───────────▼─────────────────────────────────────────────────┐
│         BANCO DE DADOS (MongoDB)                             │
│                                                              │
│  Collections:                                               │
│  • users (autenticação e perfil)                          │
│  • servers (servidores/comunidades)                        │
│  • channels (canais de texto e voz)                        │
│  • messages (histórico de mensagens)                       │
│  • voiceSessions (sessões de chamada)                      │
└──────────────────────────────────────────────────────────────┘
```

## 🔄 Fluxo de Comunicação

### Chat em Tempo Real

```
1. Cliente A digita mensagem
   ↓
2. Envia para: /app/chat/{serverId}/{channelId}
   ↓
3. ChatWebSocketController recebe
   ↓
4. MessageService salva em MongoDB
   ↓
5. Retorna para: /topic/channel/{serverId}/{channelId}
   ↓
6. Todos os clientes inscritos recebem
   ↓
7. Mensagem renderizada em tempo real
```

### Gerenciamento de Servidores

```
1. Cliente cria novo servidor (form)
   ↓
2. POST /api/servers/create
   ↓
3. ServerController.createServer()
   ↓
4. ServerService.createServer()
   ↓
5. ServerRepository.save() → MongoDB
   ↓
6. Resposta: ServerDTO
   ↓
7. Cliente atualiza UI
```

### Chamada de Voz/Vídeo

```
1. Cliente A clica em 🎤 ou 📹
   ↓
2. navigator.mediaDevices.getUserMedia()
   ↓
3. POST /api/voice/session/create
   ↓
4. VoiceService.createSession() → MongoDB
   ↓
5. POST /api/voice/session/{id}/participant
   ↓
6. Cliente B vê que há uma chamada ativa
   ↓
7. Ambos estabelecem conexão WebRTC (P2P)
   ↓
8. Áudio/vídeo flui direto entre eles
   ↓
9. PUT /api/voice/session/{id}/end para encerrar
```

## 📊 Modelos de Dados

### User (Usuário)
```
{
  _id: ObjectId,
  googleId: String (OAuth2),
  email: String,
  name: String,
  profilePicture: String (URL),
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### Server (Servidor)
```
{
  _id: ObjectId,
  name: String (ex: "Meu Servidor"),
  description: String,
  icon: String (URL),
  ownerId: String (User._id),
  memberIds: [String] (User._ids),
  channelIds: [String] (Channel._ids),
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### Channel (Canal)
```
{
  _id: ObjectId,
  serverId: String (Server._id),
  name: String (ex: "geral" ou "voice-chat"),
  description: String,
  type: String ("TEXT" | "VOICE"),
  creatorId: String (User._id),
  memberIds: [String] (User._ids),
  activeUserIds: [String] (User._ids em chamada ativa),
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### Message (Mensagem)
```
{
  _id: ObjectId,
  channelId: String (Channel._id),
  serverId: String (Server._id),
  userId: String (User._id),
  userName: String (User.name - cache),
  userAvatar: String (User.profilePicture - cache),
  content: String (text da mensagem),
  timestamp: ISODate,
  updatedAt: ISODate
}
```

### VoiceSession (Sessão de Voz)
```
{
  _id: ObjectId,
  channelId: String (Channel._id),
  serverId: String (Server._id),
  participants: [
    {
      userId: String,
      userName: String,
      userAvatar: String,
      micEnabled: Boolean,
      cameraEnabled: Boolean,
      joinedAt: ISODate
    }
  ],
  startedAt: ISODate,
  endedAt: ISODate (null se ativa),
  active: Boolean
}
```

## 🔌 REST API Completa

### BASE URL: `http://localhost:8080/api`

---

## 📌 SERVERS

### 1. Criar Servidor
```http
POST /servers/create?name=&description=&ownerId=
Content-Type: application/json

Query Parameters:
  name: String (requerido, ex: "Meu Servidor")
  description: String (opcional)
  ownerId: String (requerido, User._id)

Response: 201 OK
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Meu Servidor",
  "description": "Um servidor incrível",
  "ownerId": "user123",
  "memberIds": ["user123"],
  "channelIds": [],
  "createdAt": "2024-03-19T17:30:00"
}
```

### 2. Obter Servidor
```http
GET /servers/{serverId}

Response: 200 OK
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Meu Servidor",
  ...
}
```

### 3. Listar Servidores do Usuário
```http
GET /servers/user/{userId}

Response: 200 OK
[
  { "id": "...", "name": "Servidor 1", ... },
  { "id": "...", "name": "Servidor 2", ... }
]
```

### 4. Listar Servidores Gerenciados
```http
GET /servers/owned/{userId}

Response: 200 OK
[
  { "id": "...", "name": "Servidor que criei", ... }
]
```

### 5. Atualizar Servidor
```http
PUT /servers/{serverId}?name=&description=&icon=

Query Parameters:
  name: String (opcional)
  description: String (opcional)
  icon: String URL (opcional)

Response: 200 OK
{ "id": "...", "name": "Novo Nome", ... }
```

### 6. Adicionar Membro
```http
POST /servers/{serverId}/members/{userId}

Response: 200 OK
"Member added successfully"
```

### 7. Remover Membro
```http
DELETE /servers/{serverId}/members/{userId}

Response: 200 OK
"Member removed successfully"
```

### 8. Deletar Servidor
```http
DELETE /servers/{serverId}

Response: 200 OK
"Server deleted successfully"
```

---

## 📌 CHANNELS

### 1. Criar Canal
```http
POST /channels/create?serverId=&name=&description=&type=&creatorId=

Query Parameters:
  serverId: String (requerido)
  name: String (requerido, ex: "geral")
  description: String (opcional)
  type: String (requerido, "TEXT" | "VOICE")
  creatorId: String (requerido, User._id)

Response: 201 OK
{
  "id": "507f1f77bcf86cd799439012",
  "serverId": "507f1f77bcf86cd799439011",
  "name": "geral",
  "type": "TEXT",
  ...
}
```

### 2. Obter Canal
```http
GET /channels/{channelId}

Response: 200 OK
{ "id": "...", "name": "geral", ... }
```

### 3. Listar Canais de um Servidor
```http
GET /channels/server/{serverId}

Response: 200 OK
[
  { "id": "...", "name": "geral", "type": "TEXT" },
  { "id": "...", "name": "voice-chat", "type": "VOICE" }
]
```

### 4. Listar Canais de Texto
```http
GET /channels/server/{serverId}/text

Response: 200 OK
[
  { "id": "...", "name": "geral", "type": "TEXT" },
  { "id": "...", "name": "anúncios", "type": "TEXT" }
]
```

### 5. Listar Canais de Voz
```http
GET /channels/server/{serverId}/voice

Response: 200 OK
[
  { "id": "...", "name": "voice-chat", "type": "VOICE" }
]
```

### 6. Atualizar Canal
```http
PUT /channels/{channelId}?name=&description=

Response: 200 OK
{ "id": "...", "name": "Novo Nome", ... }
```

### 7-11. Gerenciamento de Membros
```http
POST /channels/{channelId}/members/{userId}
DELETE /channels/{channelId}/members/{userId}
POST /channels/{channelId}/active/{userId}
DELETE /channels/{channelId}/active/{userId}
DELETE /channels/{channelId}
```

---

## 📌 MESSAGES

### 1. Enviar Mensagem
```http
POST /messages/send?channelId=&serverId=&userId=&userName=&userAvatar=&content=

Query Parameters:
  channelId: String
  serverId: String
  userId: String (User._id)
  userName: String (User.name)
  userAvatar: String (URL)
  content: String (texto da mensagem)

Response: 201 OK
{
  "id": "507f1f77bcf86cd799439014",
  "channelId": "507f1f77bcf86cd799439012",
  "userId": "user123",
  "userName": "João",
  "content": "Olá!",
  "timestamp": "2024-03-19T17:30:00"
}
```

### 2. Obter Mensagens do Canal
```http
GET /messages/channel/{channelId}

Response: 200 OK
[
  {
    "id": "...",
    "channelId": "...",
    "userId": "user123",
    "userName": "João",
    "content": "Olá!",
    "timestamp": "2024-03-19T17:30:00"
  },
  ...
]
```

### 3. Obter Mensagem Específica
```http
GET /messages/{messageId}

Response: 200 OK
{ "id": "...", "content": "Olá!", ... }
```

### 4. Atualizar Mensagem
```http
PUT /messages/{messageId}?content=

Response: 200 OK
{ "id": "...", "content": "Olá! (editado)" }
```

### 5. Deletar Mensagem
```http
DELETE /messages/{messageId}

Response: 200 OK
"Message deleted successfully"
```

---

## 📌 VOICE

### 1. Criar Sessão de Voz
```http
POST /voice/session/create?channelId=&serverId=

Response: 201 OK
{
  "id": "507f1f77bcf86cd799439015",
  "channelId": "507f1f77bcf86cd799439013",
  "serverId": "507f1f77bcf86cd799439011",
  "participants": [],
  "startedAt": "2024-03-19T17:30:00",
  "active": true
}
```

### 2. Obter Sessão Ativa
```http
GET /voice/session/{channelId}

Response: 200 OK
{
  "id": "...",
  "participants": [
    {
      "userId": "user123",
      "userName": "João",
      "micEnabled": true,
      "cameraEnabled": true,
      "joinedAt": "2024-03-19T17:30:00"
    }
  ],
  ...
}
```

### 3. Adicionar Participante
```http
POST /voice/session/{sessionId}/participant?userId=&userName=&userAvatar=

Response: 200 OK
{
  "id": "...",
  "participants": [
    { "userId": "...", "userName": "...", ... }
  ]
}
```

### 4. Remover Participante
```http
DELETE /voice/session/{sessionId}/participant/{userId}

Response: 200 OK
{ "id": "...", "participants": [...] }
```

### 5. Atualizar Mic
```http
PUT /voice/session/{sessionId}/participant/{userId}/mic?enabled=true

Response: 200 OK
{ "id": "...", "participants": [...] }
```

### 6. Atualizar Câmera
```http
PUT /voice/session/{sessionId}/participant/{userId}/camera?enabled=true

Response: 200 OK
{ "id": "...", "participants": [...] }
```

### 7. Encerrar Sessão
```http
PUT /voice/session/{sessionId}/end

Response: 200 OK
{ "id": "...", "active": false, "endedAt": "..." }
```

### 8. Listar Sessões Ativas
```http
GET /voice/active/{channelId}

Response: 200 OK
[
  { "id": "...", "active": true, ... }
]
```

---

## 🔌 WEBSOCKET (STOMP)

### Conexão
```javascript
const socket = new SockJS('/ws-chat');
const stompClient = Stomp.over(socket);
stompClient.connect({}, function(frame) {
  console.log('Connected:', frame);
});
```

### Enviar Mensagem
```javascript
stompClient.send(
  `/app/chat/{serverId}/{channelId}`,
  {},
  JSON.stringify({
    channelId: "...",
    serverId: "...",
    userId: "user123",
    userName: "João",
    userAvatar: "https://...",
    content: "Olá!",
    action: "send"
  })
);
```

### Receber Mensagens
```javascript
stompClient.subscribe(
  `/topic/channel/{serverId}/{channelId}`,
  function(message) {
    const msg = JSON.parse(message.body);
    console.log('Nova mensagem:', msg);
  }
);
```

### Indicador de Digitação
```javascript
// Enviar
stompClient.send(
  `/app/typing/{serverId}/{channelId}`,
  {},
  JSON.stringify({
    userId: "user123",
    userName: "João",
    action: "typing"
  })
);

// Receber
stompClient.subscribe(
  `/topic/typing/{serverId}/{channelId}`,
  function(message) {
    const msg = JSON.parse(message.body);
    console.log(msg.userName + ' está digitando...');
  }
);
```

---

## 🔒 Códigos de Status HTTP

| Status | Significado |
|--------|-------------|
| 200 OK | Sucesso geral |
| 201 Created | Recurso criado |
| 400 Bad Request | Parâmetros inválidos |
| 404 Not Found | Recurso não encontrado |
| 500 Internal Server Error | Erro no servidor |

---

## 🛡️ Segurança

### CORS
```
Habilitado para: *
(Em produção, configure especificamente)
```

### OAuth2
```
Google Login integrado
Altere em: SecurityConfig.java
```

### Validação
- ✅ Validação de entrada em todos os endpoints
- ✅ Proteção contra XSS via escaping HTML
- ✅ Spring Security para proteção geral

---

## 📈 Escalabilidade

### Melhorias Futuras
1. **Sharding de MongoDB** - Dados em múltiplos nós
2. **Redis Cache** - Cache de mensagens/sessões
3. **Message Queue** - RabbitMQ/Kafka
4. **Load Balancer** - Distribuir carga
5. **CDN** - Servir arquivos estáticos
6. **Database Read Replicas** - Leitura distribuída

---

## 📝 Exemplo Completo - Criar Servidor e Canal

```bash
# 1. Criar servidor
curl -X POST 'http://localhost:8080/api/servers/create' \
  -G \
  -d 'name=Novo Servidor' \
  -d 'description=Meu primeiro servidor' \
  -d 'ownerId=user123'

# Salve o serverId retornado
# Exemplo: "507f1f77bcf86cd799439011"

# 2. Criar canal de texto
curl -X POST 'http://localhost:8080/api/channels/create' \
  -G \
  -d 'serverId=507f1f77bcf86cd799439011' \
  -d 'name=geral' \
  -d 'description=Canal geral' \
  -d 'type=TEXT' \
  -d 'creatorId=user123'

# 3. Enviar mensagem
curl -X POST 'http://localhost:8080/api/messages/send' \
  -G \
  -d 'channelId=507f1f77bcf86cd799439012' \
  -d 'serverId=507f1f77bcf86cd799439011' \
  -d 'userId=user123' \
  -d 'userName=João' \
  -d 'userAvatar=https://via.placeholder.com/40' \
  -d 'content=Olá pessoal!'

# ✅ Sistema funcionando perfeitamente!
```

---

**Documento atualizado em:** Março 2024
**Versão:** 1.0
**Status:** Production Ready ✅
