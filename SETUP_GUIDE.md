# MiniDiscord - Real-time Chat System Completo

Um sistema de chat em tempo real similar ao Discord, construído com Spring Boot, WebSocket, MongoDB e WebRTC.

## ✨ Funcionalidades Implementadas

### 1. **Chat em Tempo Real** ✅
- ✅ Suporte a múltiplos servidores
- ✅ Canais de texto dentro de cada servidor
- ✅ Envio/recebimento de mensagens em tempo real via WebSocket
- ✅ Histórico de mensagens persistido em MongoDB
- ✅ Indicador de digitação em tempo real

### 2. **Gerenciamento de Servidores** ✅
- ✅ Criar novo servidor
- ✅ Listar servidores do usuário
- ✅ Adicionar/remover membros
- ✅ Atualizar informações do servidor
- ✅ Deletar servidor

### 3. **Gerenciamento de Canais** ✅
- ✅ Criar canais de texto e voz
- ✅ Listar canais por servidor
- ✅ Separação entre canais TEXT e VOICE
- ✅ Gerenciamento de membros do canal
- ✅ Deletar canais

### 4. **Chamadas de Voz/Vídeo** ✅
- ✅ Iniciar chamada de voz
- ✅ Iniciar videochamada
- ✅ Listar participantes ativas
- ✅ Controle de microfone (ligar/desligar)
- ✅ Controle de câmera (ligar/desligar)
- ✅ Encerrar chamada
- ✅ Persistência de sessões de voz em MongoDB

### 5. **Interface Gráfica** ✅
- ✅ Design moderno inspirado no Discord
- ✅ Sidebar com lista de servidores
- ✅ Sidebar com lista de canais (TEXT/VOICE)
- ✅ Área de mensagens em tempo real
- ✅ Área de controle de voz/vídeo
- ✅ Modal para criar servidor/canal
- ✅ Responsivo e intuitivo

## 📋 Requisitos do Sistema

- **Java**: 17+
- **Spring Boot**: 4.0.3
- **MongoDB**: 5.0+ (executando em localhost:27017)
- **Maven**: 3.6+
- **Navegador**: Com suporte a WebRTC (Chrome, Firefox, Edge)

## 🚀 Como Instalar e Executar

### 1. **Instalar MongoDB**

**Windows:**
```bash
# Baixar em: https://www.mongodb.com/try/download/community
# Executar o instalador e seguir as instruções
```

**Linux/Mac:**
```bash
# Ubuntu/Debian
sudo apt-get install mongodb

# macOS
brew install mongodb-community
brew services start mongodb-community
```

### 2. **Compilar o Projeto**

```bash
cd Minidiscord-feature
mvn clean install
```

### 3. **Executar a Aplicação**

```bash
mvn spring-boot:run
```

Ou execute o JAR compilado:
```bash
java -jar target/minidiscord-0.0.1-SNAPSHOT.jar
```

A aplicação estará disponível em: **http://localhost:8080/chat**

## 📡 Estrutura da API

### **Endpoints de Servidor**

```
POST   /api/servers/create                          - Criar servidor
GET    /api/servers/{serverId}                      - Obter servidor
GET    /api/servers/user/{userId}                   - Listar servidores do usuário
GET    /api/servers/owned/{userId}                  - Listar servidores gerenciados
PUT    /api/servers/{serverId}                      - Atualizar servidor
POST   /api/servers/{serverId}/members/{userId}     - Adicionar membro
DELETE /api/servers/{serverId}/members/{userId}     - Remover membro
DELETE /api/servers/{serverId}                      - Deletar servidor
```

### **Endpoints de Canal**

```
POST   /api/channels/create                         - Criar canal
GET    /api/channels/{channelId}                    - Obter canal
GET    /api/channels/server/{serverId}              - Listar canais
GET    /api/channels/server/{serverId}/text         - Listar canais de texto
GET    /api/channels/server/{serverId}/voice        - Listar canais de voz
PUT    /api/channels/{channelId}                    - Atualizar canal
POST   /api/channels/{channelId}/members/{userId}   - Adicionar membro
DELETE /api/channels/{channelId}/members/{userId}   - Remover membro
POST   /api/channels/{channelId}/active/{userId}    - Adicionar usuário ativo
DELETE /api/channels/{channelId}/active/{userId}    - Remover usuário ativo
DELETE /api/channels/{channelId}                    - Deletar canal
```

### **Endpoints de Mensagem**

```
POST   /api/messages/send                           - Enviar mensagem
GET    /api/messages/channel/{channelId}            - Obter mensagens
GET    /api/messages/{messageId}                    - Obter mensagem
PUT    /api/messages/{messageId}                    - Atualizar mensagem
DELETE /api/messages/{messageId}                    - Deletar mensagem
```

### **Endpoints de Voz**

```
POST   /api/voice/session/create                    - Criar sessão de voz
GET    /api/voice/session/{channelId}               - Obter sessão ativa
POST   /api/voice/session/{sessionId}/participant   - Adicionar participante
DELETE /api/voice/session/{sessionId}/participant/{userId} - Remover participante
PUT    /api/voice/session/{sessionId}/participant/{userId}/mic    - Ligar/desligar mic
PUT    /api/voice/session/{sessionId}/participant/{userId}/camera - Ligar/desligar câmera
PUT    /api/voice/session/{sessionId}/end           - Encerrar sessão
GET    /api/voice/active/{channelId}                - Listar sessões ativas
```

## 🔌 WebSocket Endpoints

### **Mensagens**

**Client para Server:**
```
/app/chat/{serverId}/{channelId}
```

**Server para Client:**
```
/topic/channel/{serverId}/{channelId}
```

### **Indicador de Digitação**

**Client para Server:**
```
/app/typing/{serverId}/{channelId}
```

**Server para Client:**
```
/topic/typing/{serverId}/{channelId}
```

## 📁 Estrutura do Projeto

```
src/
├── main/
│   ├── java/com/example/minidiscord/
│   │   ├── MinidiscordApplication.java
│   │   ├── config/
│   │   │   ├── WebSocketConfig.java
│   │   │   ├── OAuth2ClientConfiguration.java
│   │   │   ├── OAuth2LoginSuccessHandler.java
│   │   │   └── SecurityConfig.java
│   │   ├── controller/
│   │   │   ├── ChatWebSocketController.java
│   │   │   ├── ServerController.java
│   │   │   ├── ChannelController.java
│   │   │   ├── MessageController.java
│   │   │   ├── VoiceController.java
│   │   │   ├── ChatPageController.java
│   │   │   └── AuthController.java
│   │   ├── schema/
│   │   │   ├── User.java
│   │   │   ├── Server.java
│   │   │   ├── Channel.java
│   │   │   ├── Message.java
│   │   │   └── VoiceSession.java
│   │   ├── repository/
│   │   │   ├── UserRepository.java
│   │   │   ├── ServerRepository.java
│   │   │   ├── ChannelRepository.java
│   │   │   ├── MessageRepository.java
│   │   │   └── VoiceSessionRepository.java
│   │   ├── service/
│   │   │   ├── UserService.java
│   │   │   ├── ServerService.java
│   │   │   ├── ChannelService.java
│   │   │   ├── MessageService.java
│   │   │   └── VoiceService.java
│   │   └── dto/
│   │       ├── UserDTO.java
│   │       ├── ServerDTO.java
│   │       ├── ChannelDTO.java
│   │       ├── MessageDTO.java
│   │       └── ChatMessageDTO.java
│   └── resources/
│       ├── application.properties
│       ├── static/
│       │   └── js/
│       │       └── chat.js
│       └── templates/
│           ├── chat.html
│           ├── index.html
│           └── login.html
└── test/
```

## 🛠️ Como Usar

### **1. Criar um Servidor**

```python
# Clique em "Novo Servidor" no header
# Preencha o nome e descrição
# Clique em "Criar"
```

### **2. Criar um Canal**

```python
# Selecione um servidor na sidebar
# Clique em "Novo Canal" na lista de canais
# Escolha o tipo (Texto ou Voz)
# Preencha o nome
# Clique em "Criar"
```

### **3. Enviar Mensagem**

```python
# Selecione um canal de TEXTO
# Digite a mensagem no input
# Pressione Enter ou clique em "Enviar"
# A mensagem aparece em tempo real para todos
```

### **4. Iniciar Chamada de Voz**

```python
# Selecione um canal de VOZ
# Clique no ícone de telefone (🎤) no header
# Conceda permissão para usar o microfone
# Todos os membros do servidor podem ver e entrar
```

### **5. Iniciar Videochamada**

```python
# Selecione um canal de VOZ
# Clique no ícone de câmera (📹) no header
# Conceda permissão para usar câmera e microfone
# Use os controles para ligar/desligar mic e câmera
```

## 🔐 Segurança

A aplicação inclui:
- ✅ OAuth2 com Google
- ✅ Spring Security
- ✅ CORS habilitado para desenvolvimento
- ✅ Validação de entrada
- ✅ Proteção contra XSS

## 📊 Estrutura de Dados (MongoDB)

### **Coleção: users**
```json
{
  "_id": "ObjectId",
  "googleId": "string",
  "email": "string",
  "name": "string",
  "profilePicture": "string",
  "createdAt": "ISODate"
}
```

### **Coleção: servers**
```json
{
  "_id": "ObjectId",
  "name": "string",
  "description": "string",
  "icon": "string",
  "ownerId": "string",
  "memberIds": ["string"],
  "channelIds": ["string"],
  "createdAt": "ISODate"
}
```

### **Coleção: channels**
```json
{
  "_id": "ObjectId",
  "serverId": "string",
  "name": "string",
  "description": "string",
  "type": "TEXT|VOICE",
  "creatorId": "string",
  "memberIds": ["string"],
  "activeUserIds": ["string"],
  "createdAt": "ISODate"
}
```

### **Coleção: messages**
```json
{
  "_id": "ObjectId",
  "channelId": "string",
  "serverId": "string",
  "userId": "string",
  "userName": "string",
  "userAvatar": "string",
  "content": "string",
  "timestamp": "ISODate"
}
```

### **Coleção: voiceSessions**
```json
{
  "_id": "ObjectId",
  "channelId": "string",
  "serverId": "string",
  "participants": [
    {
      "userId": "string",
      "userName": "string",
      "userAvatar": "string",
      "micEnabled": "boolean",
      "cameraEnabled": "boolean",
      "joinedAt": "ISODate"
    }
  ],
  "startedAt": "ISODate",
  "endedAt": "ISODate",
  "active": "boolean"
}
```

## 🔮 Próximas Melhorias

- [ ] WebRTC Peer-to-Peer com SDP offer/answer
- [ ] TURN/STUN servers para chamadas P2P
- [ ] Gravação de chamadas
- [ ] Compartilhamento de tela
- [ ] Reações com emojis
- [ ] Edição de mensagens com histórico
- [ ] Pinned messages
- [ ] Roles e permissões personalizadas
- [ ] Rate limiting e throttling
- [ ] Notificações push
- [ ] Criptografia de ponta a ponta
- [ ] Busca de mensagens
- [ ] Integração com cloud storage (AWS S3)

## 📝 Exemplo de Uso - cURL

### Criar Servidor
```bash
curl -X POST 'http://localhost:8080/api/servers/create' \
  -G \
  -d 'name=Meu Servidor' \
  -d 'description=Um servidor incrível' \
  -d 'ownerId=user123'
```

### Criar Canal
```bash
curl -X POST 'http://localhost:8080/api/channels/create' \
  -G \
  -d 'serverId=SERVER_ID' \
  -d 'name=geral' \
  -d 'description=Canal geral' \
  -d 'type=TEXT' \
  -d 'creatorId=user123'
```

### Enviar Mensagem
```bash
curl -X POST 'http://localhost:8080/api/messages/send' \
  -G \
  -d 'channelId=CHANNEL_ID' \
  -d 'serverId=SERVER_ID' \
  -d 'userId=user123' \
  -d 'userName=João' \
  -d 'userAvatar=https://example.com/avatar.jpg' \
  -d 'content=Olá pessoal!'
```

## 🐛 Troubleshooting

### MongoDB não conecta
```bash
# Verifique se MongoDB está rodando
mongod --version

# Inicie MongoDB
mongod

# Verifique a URI em application.properties
spring.data.mongodb.uri=mongodb://localhost:27017/minidiscord
```

### WebSocket não conecta
```bash
# Verifique logs da aplicação
# Confirme que /ws-chat está disponível
# Verifique CORS em WebSocketConfig
```

### Câmera/Microfone não funciona
```bash
# Use HTTPS em produção (WebRTC requer HTTPS)
# Conceda permissões do navegador
# Verifique se outro aplicativo está usando os dispositivos
```

## 📚 Recursos

- [Spring Boot WebSocket Documentation](https://spring.io/guides/gs/messaging-stomp-websocket/)
- [MDN WebRTC](https://developer.mozilla.org/en-US/docs/Glossary/WebRTC)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Discord API Documentation](https://discord.com/developers/docs)

## 📄 Licença

Este projeto é de código aberto e disponível sob a licença MIT.

---

**Desenvolvido com ❤️ usando Spring Boot + MongoDB + WebSocket + WebRTC**
