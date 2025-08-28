import axiosInstance from '../utils/axiosConfig';

// Configuração da API do WhatsApp Business (centralizada no backend/proxy)
// Valores de ambiente devem ser tratados no backend e no axiosInstance

class WhatsAppService {
  constructor() {
    this.baseUrl = '/api/whatsapp'; // Usar proxy através do backend
    this.eventSource = null;
    this.messageListeners = [];
    this.statusListeners = [];
  }

  // ===== GERENCIAMENTO DE CONEXÃO =====

  /**
   * Verificar status da conexão com WhatsApp
   */
  async checkConnectionStatus() {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/status`);
      return {
        connected: response.data.connected,
        phoneNumber: response.data.phoneNumber,
        lastSync: response.data.lastSync,
        error: response.data.error
      };
    } catch (error) {
      console.error('[WhatsApp] Erro ao verificar status:', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Conectar ao WhatsApp Business API
   */
  async connect(credentials) {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/connect`, credentials);
      return response.data;
    } catch (error) {
      console.error('[WhatsApp] Erro ao conectar:', error);
      throw new Error(error.response?.data?.message || 'Erro ao conectar com WhatsApp');
    }
  }

  /**
   * Desconectar do WhatsApp
   */
  async disconnect() {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/disconnect`);
      this.closeEventStream();
      return response.data;
    } catch (error) {
      console.error('[WhatsApp] Erro ao desconectar:', error);
      throw new Error(error.response?.data?.message || 'Erro ao desconectar');
    }
  }

  // ===== GERENCIAMENTO DE MENSAGENS =====

  /**
   * Buscar conversas/chats
   */
  async getChats(limit = 50, offset = 0) {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/chats`, {
        params: { limit, offset }
      });
      return response.data.chats || [];
    } catch (error) {
      console.error('[WhatsApp] Erro ao buscar chats:', error);
      return [];
    }
  }

  /**
   * Buscar mensagens de uma conversa específica
   */
  async getMessages(chatId, limit = 100, offset = 0) {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/chats/${chatId}/messages`, {
        params: { limit, offset }
      });
      return response.data.messages || [];
    } catch (error) {
      console.error('[WhatsApp] Erro ao buscar mensagens:', error);
      return [];
    }
  }

  /**
   * Enviar mensagem de texto
   */
  async sendMessage(chatId, message, options = {}) {
    try {
      const payload = {
        chatId,
        message,
        type: 'text',
        ...options
      };

      const response = await axiosInstance.post(`${this.baseUrl}/send`, payload);
      return response.data;
    } catch (error) {
      console.error('[WhatsApp] Erro ao enviar mensagem:', error);
      throw new Error(error.response?.data?.message || 'Erro ao enviar mensagem');
    }
  }

  /**
   * Enviar arquivo/mídia
   */
  async sendMedia(chatId, file, caption = '', options = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chatId', chatId);
      formData.append('caption', caption);

      Object.keys(options).forEach(key => {
        formData.append(key, options[key]);
      });

      const response = await axiosInstance.post(`${this.baseUrl}/send/media`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('[WhatsApp] Erro ao enviar mídia:', error);
      throw new Error(error.response?.data?.message || 'Erro ao enviar arquivo');
    }
  }

  /**
   * Marcar mensagens como lidas
   */
  async markAsRead(chatId, messageIds = []) {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/mark-read`, {
        chatId,
        messageIds
      });
      return response.data;
    } catch (error) {
      console.error('[WhatsApp] Erro ao marcar como lida:', error);
      return false;
    }
  }

  // ===== WEBHOOK E EVENTOS EM TEMPO REAL =====

  /**
   * Configurar webhook para receber eventos
   */
  async setupWebhook(webhookUrl, verifyToken) {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/webhook/setup`, {
        url: webhookUrl,
        verifyToken
      });
      return response.data;
    } catch (error) {
      console.error('[WhatsApp] Erro ao configurar webhook:', error);
      throw new Error(error.response?.data?.message || 'Erro ao configurar webhook');
    }
  }

  /**
   * Conectar ao stream de eventos (SSE - Server-Sent Events)
   */
  connectToEventStream() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      this.eventSource = new EventSource(`${axiosInstance.defaults.baseURL}${this.baseUrl}/events`);

      this.eventSource.onopen = () => {
        console.log('[WhatsApp] Conexão SSE estabelecida');
        this.notifyStatusListeners({ connected: true, status: 'connected' });
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingEvent(data);
        } catch (error) {
          console.error('[WhatsApp] Erro ao processar evento:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('[WhatsApp] Erro na conexão SSE:', error);
        this.notifyStatusListeners({ connected: false, status: 'disconnected', error });
      };

    } catch (error) {
      console.error('[WhatsApp] Erro ao conectar SSE:', error);
    }
  }

  /**
   * Fechar stream de eventos
   */
  closeEventStream() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('[WhatsApp] Conexão SSE fechada');
    }
  }

  /**
   * Processar eventos recebidos via webhook/SSE
   */
  handleIncomingEvent(eventData) {
    console.log('[WhatsApp] Evento recebido:', eventData);

    switch (eventData.type) {
      case 'message':
        this.notifyMessageListeners({
          type: 'new_message',
          message: eventData.data
        });
        break;

      case 'message_status':
        this.notifyMessageListeners({
          type: 'message_status_update',
          status: eventData.data
        });
        break;

      case 'chat_update':
        this.notifyMessageListeners({
          type: 'chat_update',
          chat: eventData.data
        });
        break;

      default:
        console.log('[WhatsApp] Evento não reconhecido:', eventData.type);
    }
  }

  // ===== LISTENERS E CALLBACKS =====

  /**
   * Adicionar listener para mensagens
   */
  addMessageListener(callback) {
    this.messageListeners.push(callback);
  }

  /**
   * Remover listener de mensagens
   */
  removeMessageListener(callback) {
    this.messageListeners = this.messageListeners.filter(listener => listener !== callback);
  }

  /**
   * Notificar todos os listeners de mensagens
   */
  notifyMessageListeners(eventData) {
    this.messageListeners.forEach(callback => {
      try {
        callback(eventData);
      } catch (error) {
        console.error('[WhatsApp] Erro em listener de mensagem:', error);
      }
    });
  }

  /**
   * Adicionar listener para status de conexão
   */
  addStatusListener(callback) {
    this.statusListeners.push(callback);
  }

  /**
   * Remover listener de status
   */
  removeStatusListener(callback) {
    this.statusListeners = this.statusListeners.filter(listener => listener !== callback);
  }

  /**
   * Notificar listeners de status
   */
  notifyStatusListeners(statusData) {
    this.statusListeners.forEach(callback => {
      try {
        callback(statusData);
      } catch (error) {
        console.error('[WhatsApp] Erro em listener de status:', error);
      }
    });
  }

  // ===== FUNCIONALIDADES DO AGENTE IA =====

  /**
   * Configurar respostas automáticas do agente IA
   */
  async configureAIAgent(config) {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/ai/configure`, config);
      return response.data;
    } catch (error) {
      console.error('[WhatsApp] Erro ao configurar agente IA:', error);
      throw new Error(error.response?.data?.message || 'Erro ao configurar agente IA');
    }
  }

  /**
   * Buscar estatísticas do agente IA
   */
  async getAIStats(startDate, endDate) {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/ai/stats`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('[WhatsApp] Erro ao buscar estatísticas IA:', error);
      return null;
    }
  }

  /**
   * Buscar logs de interações do agente IA
   */
  async getAILogs(limit = 100, offset = 0) {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/ai/logs`, {
        params: { limit, offset }
      });
      return response.data.logs || [];
    } catch (error) {
      console.error('[WhatsApp] Erro ao buscar logs IA:', error);
      return [];
    }
  }

  /**
   * Ativar/desativar agente IA para uma conversa
   */
  async toggleAIAgent(chatId, enabled) {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/ai/toggle`, {
        chatId,
        enabled
      });
      return response.data;
    } catch (error) {
      console.error('[WhatsApp] Erro ao alterar status IA:', error);
      throw new Error(error.response?.data?.message || 'Erro ao alterar status do agente IA');
    }
  }

  // ===== UTILITÁRIOS =====

  /**
   * Formatar número de telefone para WhatsApp
   */
  formatPhoneNumber(number) {
    // Remove todos os caracteres não numéricos
    const cleanNumber = number.replace(/\D/g, '');

    // Se começar com 0, remove o 0
    if (cleanNumber.startsWith('0')) {
      return cleanNumber.substring(1);
    }

    // Se não começar com código do país, adiciona 55 (Brasil)
    if (!cleanNumber.startsWith('55')) {
      return '55' + cleanNumber;
    }

    return cleanNumber;
  }

  /**
   * Validar número de WhatsApp
   */
  async validatePhoneNumber(phoneNumber) {
    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      const response = await axiosInstance.post(`${this.baseUrl}/validate`, {
        phoneNumber: formattedNumber
      });
      return response.data;
    } catch (error) {
      console.error('[WhatsApp] Erro ao validar número:', error);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Buscar informações de perfil de um contato
   */
  async getContactProfile(phoneNumber) {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/contact/${phoneNumber}`);
      return response.data;
    } catch (error) {
      console.error('[WhatsApp] Erro ao buscar perfil:', error);
      return null;
    }
  }

  // ===== MONITORAMENTO E ANALYTICS =====

  /**
   * Buscar métricas de conversas
   */
  async getConversationMetrics(period = '7d') {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/metrics`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('[WhatsApp] Erro ao buscar métricas:', error);
      return null;
    }
  }

  /**
   * Buscar relatório de atividades
   */
  async getActivityReport(startDate, endDate, options = {}) {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/reports/activity`, {
        params: {
          startDate,
          endDate,
          ...options
        }
      });
      return response.data;
    } catch (error) {
      console.error('[WhatsApp] Erro ao buscar relatório:', error);
      return null;
    }
  }

  // ===== TEMPLATES E MENSAGENS RÁPIDAS =====

  /**
   * Buscar templates disponíveis
   */
  async getTemplates() {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/templates`);
      return response.data.templates || [];
    } catch (error) {
      console.error('[WhatsApp] Erro ao buscar templates:', error);
      return [];
    }
  }

  /**
   * Enviar template de mensagem
   */
  async sendTemplate(chatId, templateName, parameters = []) {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/send/template`, {
        chatId,
        templateName,
        parameters
      });
      return response.data;
    } catch (error) {
      console.error('[WhatsApp] Erro ao enviar template:', error);
      throw new Error(error.response?.data?.message || 'Erro ao enviar template');
    }
  }

  // ===== GRUPOS =====

  /**
   * Buscar informações de grupo
   */
  async getGroupInfo(groupId) {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/groups/${groupId}`);
      return response.data;
    } catch (error) {
      console.error('[WhatsApp] Erro ao buscar grupo:', error);
      return null;
    }
  }

  /**
   * Adicionar participante ao grupo
   */
  async addGroupParticipant(groupId, phoneNumber) {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/groups/${groupId}/participants`, {
        phoneNumber: this.formatPhoneNumber(phoneNumber)
      });
      return response.data;
    } catch (error) {
      console.error('[WhatsApp] Erro ao adicionar participante:', error);
      throw new Error(error.response?.data?.message || 'Erro ao adicionar participante');
    }
  }

  // ===== CONFIGURAÇÕES AVANÇADAS =====

  /**
   * Configurar respostas automáticas
   */
  async setAutoReply(config) {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/auto-reply`, config);
      return response.data;
    } catch (error) {
      console.error('[WhatsApp] Erro ao configurar resposta automática:', error);
      throw new Error(error.response?.data?.message || 'Erro ao configurar resposta automática');
    }
  }

  /**
   * Configurar horário de funcionamento
   */
  async setBusinessHours(schedule) {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/business-hours`, schedule);
      return response.data;
    } catch (error) {
      console.error('[WhatsApp] Erro ao configurar horário:', error);
      throw new Error(error.response?.data?.message || 'Erro ao configurar horário de funcionamento');
    }
  }

  // ===== MÉTODOS PARA COMPATIBILIDADE COM O COMPONENTE =====

  /**
   * Buscar estatísticas do agente (método mock)
   */
  async getAgentStats() {
    console.warn('[WhatsApp] getAgentStats é um método mock');
    return {
      totalChats: 5,
      unreadMessages: 3,
      activeAgents: 1,
      averageResponseTime: '2m',
      dailyMessages: 25
    };
  }

  /**
   * Buscar perfis de contatos (método mock)
   */
  async getContactProfiles() {
    console.warn('[WhatsApp] getContactProfiles é um método mock');
    return {
      '5511999999999': {
        name: 'João Silva',
        profilePic: null,
        lastSeen: new Date().toISOString(),
        isBlocked: false
      }
    };
  }

  /**
   * Buscar templates de mensagens (método mock)
   */
  async getMessageTemplates() {
    console.warn('[WhatsApp] getMessageTemplates é um método mock');
    return [
      {
        id: 1,
        name: 'boas_vindas',
        text: 'Olá! Bem-vindo ao nosso atendimento. Como posso ajudá-lo?',
        category: 'utility'
      },
      {
        id: 2,
        name: 'despedida',
        text: 'Obrigado pelo contato! Tenha um ótimo dia.',
        category: 'utility'
      }
    ];
  }

  /**
   * Buscar configurações de auto resposta (método mock)
   */
  async getAutoReplyConfig() {
    console.warn('[WhatsApp] getAutoReplyConfig é um método mock');
    return {
      enabled: false,
      businessHours: { start: '09:00', end: '18:00' },
      welcomeMessage: 'Olá! Como posso ajudá-lo?',
      awayMessage: 'Estamos fora do horário de atendimento. Retornaremos em breve.'
    };
  }

  /**
   * Configurar respostas automáticas (método mock)
   */
  async configureAutoReply(config) {
    console.warn('[WhatsApp] configureAutoReply é um método mock');
    console.log('[WhatsApp] Configuração de auto resposta (mock):', config);
    return { success: true, message: 'Configuração salva (mock)' };
  }

  /**
   * Listener para novas mensagens (método mock)
   */
  async onMessage(callback) {
    console.warn('[WhatsApp] onMessage é um método mock');
    // Simular recebimento de mensagem após 5 segundos
    setTimeout(() => {
      callback({
        from: '5511999999999',
        body: 'Mensagem de teste (mock)',
        notifyName: 'João (Mock)',
        timestamp: Date.now()
      });
    }, 5000);
  }

  /**
   * Listener para status de mensagens (método mock)
   */
  async onMessageStatus(callback) {
    console.warn('[WhatsApp] onMessageStatus é um método mock');
    // Simular atualização de status após 3 segundos
    setTimeout(() => {
      callback({
        messageId: Date.now(),
        status: 'read'
      });
    }, 3000);
  }

  // ===== LIMPEZA E DESTRUIÇÃO =====

  /**
   * Limpar recursos quando o serviço não for mais usado
   */
  destroy() {
    this.closeEventStream();
    this.messageListeners = [];
    this.statusListeners = [];
  }
}

// Instância singleton do serviço
const whatsappService = new WhatsAppService();

export default whatsappService;
