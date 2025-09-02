# 📱 WhatsApp Service - Guia de Integração

Este documento fornece todas as informações necessárias para integrar o `whatsappService.js` com APIs reais do WhatsApp Business.

## 🔧 Configuração Inicial

### Backend Requirements

O serviço está configurado para trabalhar com um backend que deve implementar os seguintes endpoints:

```
Base URL: /api/whatsapp
```

### Variáveis de Ambiente

Configure as seguintes variáveis no seu backend (arquivo `.env`):

```env
# WhatsApp Business API
WHATSAPP_API_TOKEN=your_whatsapp_business_api_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token

# Para WhatsApp Web (alternativo)
WHATSAPP_SESSION_NAME=your_session_name
WHATSAPP_HEADLESS=true

# Configurações gerais
WHATSAPP_WEBHOOK_URL=https://your-domain.com/api/whatsapp/webhook
```

## 📋 Endpoints do Backend

### 🔗 Conexão e Status

#### `GET /api/whatsapp/status`
Verificar status da conexão com WhatsApp.

**Response:**
```json
{
  "connected": true,
  "phoneNumber": "+5511999999999",
  "lastSync": "2024-01-15T10:30:00.000Z",
  "error": null
}
```

#### `POST /api/whatsapp/connect`
Conectar ao WhatsApp Business API.

**Request:**
```json
{
  "token": "your_api_token",
  "phoneNumberId": "your_phone_number_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Conectado com sucesso",
  "phoneNumber": "+5511999999999"
}
```

#### `POST /api/whatsapp/disconnect`
Desconectar do WhatsApp.

**Response:**
```json
{
  "success": true,
  "message": "Desconectado com sucesso"
}
```

### 💬 Mensagens e Chats

#### `GET /api/whatsapp/chats`
Buscar conversas/chats.

**Query Parameters:**
- `limit`: número de chats (default: 50)
- `offset`: offset para paginação (default: 0)

**Response:**
```json
{
  "chats": [
    {
      "id": "5511999999999@c.us",
      "name": "João Silva",
      "pushname": "João",
      "lastMessage": {
        "body": "Olá, como está?",
        "timestamp": 1642234567,
        "fromMe": false
      },
      "unreadCount": 2,
      "isGroup": false,
      "participants": []
    }
  ]
}
```

#### `GET /api/whatsapp/chats/:chatId/messages`
Buscar mensagens de uma conversa.

**Query Parameters:**
- `limit`: número de mensagens (default: 100)
- `offset`: offset para paginação (default: 0)

**Response:**
```json
{
  "messages": [
    {
      "id": "message_id",
      "body": "Texto da mensagem",
      "timestamp": 1642234567,
      "fromMe": false,
      "author": "5511999999999@c.us",
      "type": "chat",
      "hasMedia": false
    }
  ]
}
```

#### `POST /api/whatsapp/send`
Enviar mensagem de texto.

**Request:**
```json
{
  "chatId": "5511999999999@c.us",
  "message": "Olá! Como posso ajudá-lo?",
  "type": "text"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "message_id_from_whatsapp",
  "timestamp": 1642234567
}
```

#### `POST /api/whatsapp/send/media`
Enviar arquivo/mídia.

**Request:** FormData
- `file`: arquivo
- `chatId`: ID do chat
- `caption`: legenda (opcional)

**Response:**
```json
{
  "success": true,
  "messageId": "message_id_from_whatsapp",
  "mediaId": "media_id",
  "timestamp": 1642234567
}
```

#### `POST /api/whatsapp/mark-read`
Marcar mensagens como lidas.

**Request:**
```json
{
  "chatId": "5511999999999@c.us",
  "messageIds": ["msg1", "msg2"]
}
```

### 🤖 Controle de Conversas (Bot/Humano)

#### `POST /api/whatsapp/conversation/takeover`
Assumir controle de uma conversa do bot.

**Request:**
```json
{
  "chatId": "5511999999999@c.us",
  "operatorId": "operator_123",
  "operatorName": "João Operador",
  "notifyUser": true,
  "customMessage": "Um operador assumiu esta conversa"
}
```

**Response:**
```json
{
  "success": true,
  "mode": "human",
  "operatorId": "operator_123",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### `POST /api/whatsapp/conversation/return-to-bot`
Retornar conversa para o bot.

**Request:**
```json
{
  "chatId": "5511999999999@c.us",
  "operatorId": "operator_123",
  "notifyUser": true,
  "customMessage": "Conversa retornada ao atendimento automático"
}
```

#### `GET /api/whatsapp/conversation/:chatId/mode`
Obter modo atual da conversa.

**Response:**
```json
{
  "chatId": "5511999999999@c.us",
  "mode": "bot|human",
  "since": "2024-01-15T10:30:00.000Z",
  "currentOperator": {
    "id": "operator_123",
    "name": "João Operador"
  }
}
```

#### `GET /api/whatsapp/conversation/:chatId/transfers`
Obter histórico de transferências.

**Response:**
```json
{
  "transfers": [
    {
      "id": "transfer_id",
      "chatId": "5511999999999@c.us",
      "fromMode": "bot",
      "toMode": "human",
      "operatorId": "operator_123",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "reason": "Manual takeover"
    }
  ]
}
```

### 📊 Agente IA e Configurações

#### `POST /api/whatsapp/ai/configure`
Configurar agente IA.

**Request:**
```json
{
  "enabled": true,
  "model": "gpt-3.5-turbo",
  "prompt": "Você é um assistente virtual...",
  "fallbackToHuman": true,
  "businessHours": {
    "start": "09:00",
    "end": "18:00",
    "timezone": "America/Sao_Paulo"
  }
}
```

#### `GET /api/whatsapp/ai/stats`
Buscar estatísticas do agente IA.

**Query Parameters:**
- `startDate`: data inicial (ISO string)
- `endDate`: data final (ISO string)

**Response:**
```json
{
  "totalChats": 150,
  "botHandledChats": 120,
  "humanTakeovers": 30,
  "averageResponseTime": "2.5s",
  "satisfactionRate": 0.85
}
```

#### `POST /api/whatsapp/ai/toggle`
Ativar/desativar agente IA para uma conversa.

**Request:**
```json
{
  "chatId": "5511999999999@c.us",
  "enabled": true
}
```

### 🔗 Webhooks e Eventos

#### `POST /api/whatsapp/webhook/setup`
Configurar webhook.

**Request:**
```json
{
  "url": "https://seu-dominio.com/webhook",
  "verifyToken": "seu_token_de_verificacao"
}
```

#### `GET /api/whatsapp/events` (Server-Sent Events)
Stream de eventos em tempo real.

**Eventos enviados:**
```javascript
// Nova mensagem
{
  "type": "message",
  "data": {
    "chatId": "5511999999999@c.us",
    "messageId": "msg_id",
    "body": "Texto da mensagem",
    "from": "5511999999999@c.us",
    "timestamp": 1642234567
  }
}

// Status da mensagem
{
  "type": "message_status",
  "data": {
    "messageId": "msg_id",
    "status": "delivered|read|failed"
  }
}

// Atualização do chat
{
  "type": "chat_update",
  "data": {
    "chatId": "5511999999999@c.us",
    "unreadCount": 3,
    "lastMessage": "Nova mensagem"
  }
}
```

## 🛠 Implementação no Backend

### Exemplo com Express.js

```javascript
// routes/whatsapp.js
const express = require('express');
const router = express.Router();

// Conexão com WhatsApp Business API
router.get('/status', async (req, res) => {
  try {
    // Verificar status da conexão
    const status = await whatsappClient.getConnectionState();
    res.json({
      connected: status === 'CONNECTED',
      phoneNumber: process.env.WHATSAPP_PHONE_NUMBER,
      lastSync: new Date().toISOString(),
      error: null
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error.message
    });
  }
});

router.post('/connect', async (req, res) => {
  try {
    const { token, phoneNumberId } = req.body;
    
    // Configurar cliente WhatsApp
    await whatsappClient.initialize({
      token,
      phoneNumberId
    });
    
    res.json({
      success: true,
      message: 'Conectado com sucesso',
      phoneNumber: process.env.WHATSAPP_PHONE_NUMBER
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/chats', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    // Buscar chats do WhatsApp
    const chats = await whatsappClient.getChats();
    
    const formattedChats = chats.slice(offset, offset + limit).map(chat => ({
      id: chat.id._serialized,
      name: chat.name || chat.pushname || 'Sem nome',
      pushname: chat.pushname,
      lastMessage: chat.lastMessage ? {
        body: chat.lastMessage.body,
        timestamp: chat.lastMessage.timestamp,
        fromMe: chat.lastMessage.fromMe
      } : null,
      unreadCount: chat.unreadCount || 0,
      isGroup: chat.isGroup,
      participants: chat.participants || []
    }));
    
    res.json({ chats: formattedChats });
  } catch (error) {
    res.status(500).json({ chats: [] });
  }
});

router.post('/send', async (req, res) => {
  try {
    const { chatId, message, type = 'text' } = req.body;
    
    // Enviar mensagem
    const result = await whatsappClient.sendMessage(chatId, message);
    
    res.json({
      success: true,
      messageId: result.id._serialized,
      timestamp: result.timestamp
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Controle de conversas
router.post('/conversation/takeover', async (req, res) => {
  try {
    const { chatId, operatorId, operatorName, notifyUser, customMessage } = req.body;
    
    // Salvar no banco de dados que a conversa agora é humana
    await ConversationMode.upsert({
      chatId,
      mode: 'human',
      operatorId,
      operatorName,
      timestamp: new Date()
    });
    
    // Notificar usuário se solicitado
    if (notifyUser && customMessage) {
      await whatsappClient.sendMessage(chatId, customMessage);
    }
    
    res.json({
      success: true,
      mode: 'human',
      operatorId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
```

### Exemplo com Webhook

```javascript
// webhook.js
router.post('/webhook', (req, res) => {
  const body = req.body;
  
  // Verificar token de verificação
  if (req.query['hub.verify_token'] === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(req.query['hub.challenge']);
    return;
  }
  
  // Processar eventos do WhatsApp
  if (body.object === 'whatsapp_business_account') {
    body.entry.forEach(entry => {
      const changes = entry.changes;
      
      changes.forEach(change => {
        if (change.field === 'messages') {
          const messages = change.value.messages;
          
          messages?.forEach(message => {
            // Enviar evento via SSE para frontend
            sendSSEEvent('message', {
              chatId: message.from,
              messageId: message.id,
              body: message.text?.body || '',
              from: message.from,
              timestamp: message.timestamp
            });
          });
          
          const statuses = change.value.statuses;
          statuses?.forEach(status => {
            // Enviar status da mensagem via SSE
            sendSSEEvent('message_status', {
              messageId: status.id,
              status: status.status
            });
          });
        }
      });
    });
    
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});
```

## 🔧 Bibliotecas Recomendadas

### Para WhatsApp Web (whatsapp-web.js)
```bash
npm install whatsapp-web.js qrcode
```

### Para WhatsApp Business API
```bash
npm install axios form-data
```

### Para Server-Sent Events
```bash
npm install express-sse
```

## 🚀 Uso no Frontend

```javascript
import whatsappService from '../services/whatsappService';

// Conectar ao WhatsApp
const handleConnect = async () => {
  try {
    const result = await whatsappService.connect();
    console.log('Conectado:', result);
  } catch (error) {
    console.error('Erro ao conectar:', error);
  }
};

// Assumir controle de conversa
const handleTakeover = async (chatId) => {
  try {
    const result = await whatsappService.takeoverConversation(chatId, {
      operatorId: 'user123',
      operatorName: 'João Operador',
      notifyUser: true,
      message: 'Um operador assumiu esta conversa'
    });
    console.log('Conversa assumida:', result);
  } catch (error) {
    console.error('Erro ao assumir conversa:', error);
  }
};

// Configurar listeners
whatsappService.addMessageListener((eventData) => {
  if (eventData.type === 'new_message') {
    console.log('Nova mensagem:', eventData.message);
  }
});
```

## 🔧 Troubleshooting

### Problemas Comuns

1. **Erro de CORS**
   - Configurar CORS no backend para permitir requisições do frontend

2. **Token inválido**
   - Verificar se o token do WhatsApp Business API está correto
   - Verificar se o token não expirou

3. **Webhook não funciona**
   - Verificar se a URL do webhook está acessível publicamente
   - Verificar se o token de verificação está correto

4. **SSE não conecta**
   - Verificar se o endpoint `/api/whatsapp/events` está implementado
   - Verificar configuração de proxy/CORS

### Logs de Debug

Ativar logs detalhados no whatsappService:

```javascript
// No início do arquivo whatsappService.js
const DEBUG = process.env.NODE_ENV === 'development';

// Substituir console.log por:
const log = DEBUG ? console.log : () => {};
const error = console.error; // Sempre mostrar erros

// Usar:
log('[WhatsApp] Debug info');
error('[WhatsApp] Error occurred');
```

## 📚 Recursos Adicionais

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [whatsapp-web.js Documentation](https://wwebjs.dev/)
- [Express.js Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

---

**Nota**: Este arquivo deve ser mantido atualizado conforme novas funcionalidades são adicionadas ao whatsappService.js.
