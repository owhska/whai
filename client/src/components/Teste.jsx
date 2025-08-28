import React, { useState } from 'react';
import {
  BarChart3,
  MessageCircle,
  Bot,
  Users,
  Settings,
  Clock,
  CheckCircle,
  Filter,
  Search,
  AlertCircle,
  Pause,
  Play,
  Send,
  MoreVertical,
  User,
} from 'lucide-react';
import "../styles/Auth.css";

const AiAgentsPlatform = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState('');

  // Mock data - TODO: Replace with API calls or state management (e.g., Redux, Zustand)
  const [conversations, setConversations] = useState([
    {
      id: 1,
      customerName: 'João Silva',
      customerPhone: '+55 11 99999-9999',
      status: 'ai_active',
      lastMessage: 'Gostaria de saber sobre o produto X',
      timestamp: '14:32',
      agentType: 'ecommerce',
      priority: 'normal',
    },
    {
      id: 2,
      customerName: 'Maria Santos',
      customerPhone: '+55 11 88888-8888',
      status: 'waiting_human',
      lastMessage: 'Preciso falar com um atendente urgente',
      timestamp: '14:28',
      agentType: 'support',
      priority: 'high',
    },
    {
      id: 3,
      customerName: 'Carlos Oliveira',
      customerPhone: '+55 11 77777-7777',
      status: 'human_active',
      lastMessage: 'Obrigado pela ajuda!',
      timestamp: '14:15',
      agentType: 'ecommerce',
      priority: 'normal',
      assignedTo: 'Ana Costa',
    },
  ]);

  const [messages, setMessages] = useState([
    { id: 1, sender: 'customer', content: 'Olá! Gostaria de saber sobre o produto X', timestamp: '14:30' },
    { id: 2, sender: 'ai', content: 'Olá João! Posso ajudá-lo com informações sobre nossos produtos. O produto X está disponível por R$ 299,90. Gostaria de saber mais detalhes?', timestamp: '14:30' },
    { id: 3, sender: 'customer', content: 'Qual a garantia?', timestamp: '14:31' },
    { id: 4, sender: 'ai', content: 'O produto X possui 12 meses de garantia contra defeitos de fabricação. Também oferecemos suporte técnico gratuito durante este período.', timestamp: '14:31' },
  ]);

  const stats = {
    activeConversations: 23,
    waitingQueue: 5,
    todayResolved: 89,
    aiResolutionRate: 78,
  };

  const agents = [
    { id: 1, name: 'E-commerce Bot', type: 'ecommerce', status: 'active', conversations: 12 },
    { id: 2, name: 'Support Bot', type: 'support', status: 'active', conversations: 8 },
    { id: 3, name: 'Appointment Bot', type: 'appointment', status: 'paused', conversations: 0 },
  ];

  const handleTakeConversation = (convId) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === convId ? { ...conv, status: 'human_active', assignedTo: 'Você' } : conv
      )
    );
  };

  const handleReturnToAI = (convId) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === convId ? { ...conv, status: 'ai_active', assignedTo: null } : conv
      )
    );
  };

  const sendMessage = () => {
    if (!messageInput.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      sender: 'human',
      content: messageInput,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMessage]);

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation?.id
          ? { ...conv, lastMessage: messageInput, timestamp: newMessage.timestamp }
          : conv
      )
    );

    setMessageInput('');
  };

  const Sidebar = () => (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">AI Agents Platform</h1>
        <div className="sidebar-subtitle">Empresa Demo Ltda</div>
      </div>

      <nav className="sidebar-nav">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'conversations', label: 'Conversas', icon: MessageCircle },
          { id: 'agents', label: 'Agentes', icon: Bot },
          { id: 'team', label: 'Equipe', icon: Users },
          { id: 'reports', label: 'Relatórios', icon: BarChart3 },
          { id: 'settings', label: 'Configurações', icon: Settings },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
              aria-label={`Navegar para ${item.label}`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );

  const Dashboard = () => (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Dashboard</h2>
        <div className="dashboard-subtitle">Visão geral do atendimento</div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon blue">
              <MessageCircle size={24} />
            </div>
          </div>
          <div className="stat-number">{stats.activeConversations}</div>
          <div className="stat-label">Conversas Ativas</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon orange">
              <Clock size={24} />
            </div>
          </div>
          <div className="stat-number">{stats.waitingQueue}</div>
          <div className="stat-label">Aguardando Atendimento</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon green">
              <CheckCircle size={24} />
            </div>
          </div>
          <div className="stat-number">{stats.todayResolved}</div>
          <div className="stat-label">Resolvidas Hoje</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon purple">
              <Bot size={24} />
            </div>
          </div>
          <div className="stat-number">{stats.aiResolutionRate}%</div>
          <div className="stat-label">Resolução por IA</div>
        </div>
      </div>

      <div className="content-grid">
        <div className="content-card">
          <h3 className="content-card-title">Fila de Atendimento</h3>
          <div className="queue-items">
            {conversations
              .filter((c) => c.status === 'waiting_human')
              .map((conv) => (
                <div key={conv.id} className="queue-item">
                  <div className="queue-item-info">
                    <div className="queue-item-name">{conv.customerName}</div>
                    <div className="queue-item-message">{conv.lastMessage}</div>
                  </div>
                  <div className="queue-item-actions">
                    <span className="queue-timestamp">{conv.timestamp}</span>
                    <button
                      onClick={() => handleTakeConversation(conv.id)}
                      className="btn-primary"
                      aria-label={`Assumir conversa com ${conv.customerName}`}
                    >
                      Assumir
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="content-card">
          <h3 className="content-card-title">Status dos Agentes</h3>
          <div className="agent-items">
            {agents.map((agent) => (
              <div key={agent.id} className="agent-item">
                <div className="agent-info">
                  <div className={`status-dot ${agent.status === 'active' ? 'active' : 'inactive'}`} />
                  <div>
                    <div className="agent-name">{agent.name}</div>
                    <div className="agent-conversations">{agent.conversations} conversas ativas</div>
                  </div>
                </div>
                <button
                  className="btn-icon"
                  aria-label={agent.status === 'active' ? 'Pausar agente' : 'Ativar agente'}
                >
                  {agent.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const ConversationsList = () => (
    <div className="conversations-list">
      <div className="conversations-header">
        <div className="conversations-title">
          <h3>Conversas</h3>
          <div className="filter-actions">
            <button className="btn-icon" aria-label="Filtrar conversas">
              <Filter size={16} />
            </button>
            <button className="btn-icon" aria-label="Pesquisar conversas">
              <Search size={16} />
            </button>
          </div>
        </div>

        <div className="filter-tabs">
          <span className="filter-tab blue">Todas (23)</span>
          <span className="filter-tab orange">Fila (5)</span>
          <span className="filter-tab green">Ativas (18)</span>
        </div>
      </div>

      <div className="conversations-scroll">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => setSelectedConversation(conv)}
            className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && setSelectedConversation(conv)}
            aria-label={`Selecionar conversa com ${conv.customerName}`}
          >
            <div className="conversation-header">
              <div className="conversation-name">
                <div className="customer-name">{conv.customerName}</div>
                <div
                  className={`conversation-status-dot ${conv.status === 'ai_active'
                    ? 'ai'
                    : conv.status === 'human_active'
                      ? 'human'
                      : 'waiting'
                    }`}
                />
              </div>
              <span className="conversation-time">{conv.timestamp}</span>
            </div>

            <div className="conversation-message">{conv.lastMessage}</div>

            <div className="conversation-footer">
              <div className="conversation-tags">
                <span
                  className={`tag ${conv.agentType === 'ecommerce'
                    ? 'purple'
                    : conv.agentType === 'support'
                      ? 'red'
                      : 'blue'
                    }`}
                >
                  {conv.agentType}
                </span>

                {conv.assignedTo && (
                  <span className="tag green">{conv.assignedTo}</span>
                )}
              </div>

              {conv.priority === 'high' && (
                <AlertCircle size={14} className="text-red-500" aria-label="Prioridade alta" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ChatArea = () => {
    if (!selectedConversation) {
      return (
        <div className="chat-empty">
          <div>
            <MessageCircle className="chat-empty-icon" />
            <div className="chat-empty-title">Selecione uma conversa</div>
            <div className="chat-empty-subtitle">Escolha uma conversa para começar o atendimento</div>
          </div>
        </div>
      );
    }

    return (
      <div className="chat-area">
        <div className="chat-header">
          <div className="chat-customer-info">
            <div className="customer-details">
              <div className="customer-name">{selectedConversation.customerName}</div>
              <div className="customer-phone">{selectedConversation.customerPhone}</div>
            </div>

            <div
              className={`chat-status-badge ${selectedConversation.status === 'ai_active'
                ? 'ai'
                : selectedConversation.status === 'human_active'
                  ? 'human'
                  : 'waiting'
                }`}
            >
              {selectedConversation.status === 'ai_active'
                ? 'IA Ativa'
                : selectedConversation.status === 'human_active'
                  ? 'Atendimento Humano'
                  : 'Aguardando Atendimento'}
            </div>
          </div>

          <div className="chat-actions">
            {selectedConversation.status === 'ai_active' && (
              <button
                onClick={() => handleTakeConversation(selectedConversation.id)}
                className="btn-primary"
                aria-label={`Assumir conversa com ${selectedConversation.customerName}`}
              >
                Assumir Conversa
              </button>
            )}

            {selectedConversation.status === 'human_active' &&
              selectedConversation.assignedTo === 'Você' && (
                <button
                  onClick={() => handleReturnToAI(selectedConversation.id)}
                  className="btn-secondary"
                  aria-label={`Devolver conversa com ${selectedConversation.customerName} para IA`}
                >
                  Devolver à IA
                </button>
              )}

            <button className="btn-icon" aria-label="Mais opções">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        <div className="messages-container">
          <div className="messages-list">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.sender}`}
              >
                <div
                  className={`message-bubble ${message.sender}`}
                >
                  <div className="message-content">{message.content}</div>
                  <div className="message-meta">
                    {message.timestamp} •{' '}
                    {message.sender === 'customer' ? 'Cliente' : message.sender === 'ai' ? 'IA' : 'Você'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedConversation.status === 'human_active' &&
          selectedConversation.assignedTo === 'Você' && (
            <div className="message-input-container">
              <div className="message-input-form">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Digite sua mensagem..."
                  className="message-input"
                  aria-label="Digite sua mensagem"
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim()}
                  className="send-button"
                  aria-label="Enviar mensagem"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          )}
      </div>
    );
  };

  const ConversationsTab = () => (
    <div className="conversations-container">
      <ConversationsList />
      <ChatArea />
    </div>
  );

  const AgentsTab = () => (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Agentes de IA</h2>
        <div className="dashboard-subtitle">Gerencie seus agentes especializados</div>
      </div>

      <div className="agents-grid">
        {[
          {
            id: 1,
            name: 'E-commerce Bot',
            type: 'Vendas e Suporte',
            status: 'active',
            conversations: 12,
            resolutionRate: 85,
            description: 'Especializado em produtos, pedidos e suporte ao cliente',
          },
          {
            id: 2,
            name: 'Support Bot',
            type: 'Atendimento',
            status: 'active',
            conversations: 8,
            resolutionRate: 72,
            description: 'Focado em resolver dúvidas e problemas técnicos',
          },
          {
            id: 3,
            name: 'Appointment Bot',
            type: 'Agendamentos',
            status: 'paused',
            conversations: 0,
            resolutionRate: 95,
            description: 'Gerencia agendamentos e confirmações de consultas',
          },
        ].map((agent) => (
          <div key={agent.id} className="agent-card">
            <div className="agent-card-header">
              <div className="agent-card-info">
                <div className="agent-card-icon">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="agent-card-name">{agent.name}</h3>
                  <div className="agent-card-type">{agent.type}</div>
                </div>
              </div>

              <div className={`status-dot ${agent.status === 'active' ? 'active' : 'inactive'}`} />
            </div>

            <div className="agent-card-description">{agent.description}</div>

            <div className="agent-stats">
              <div className="agent-stat">
                <div className="agent-stat-number">{agent.conversations}</div>
                <div className="agent-stat-label">Conversas Ativas</div>
              </div>
              <div className="agent-stat">
                <div className="agent-stat-number">{agent.resolutionRate}%</div>
                <div className="agent-stat-label">Taxa de Resolução</div>
              </div>
            </div>

            <div className="agent-card-actions">
              <button
                className={agent.status === 'active' ? 'btn-danger' : 'btn-success'}
                aria-label={agent.status === 'active' ? `Pausar ${agent.name}` : `Ativar ${agent.name}`}
              >
                {agent.status === 'active' ? 'Pausar' : 'Ativar'}
              </button>
              <button
                className="btn-gray"
                aria-label={`Configurar ${agent.name}`}
              >
                Configurar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const TeamTab = () => (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Equipe</h2>
        <div className="dashboard-subtitle">Gerencie sua equipe de atendimento</div>
      </div>

      <div className="team-container">
        <div className="team-header">
          <div className="team-title">Atendentes Online</div>
          <button
            className="btn-primary"
            aria-label="Adicionar novo atendente"
          >
            Adicionar Atendente
          </button>
        </div>

        <div className="team-list">
          {[
            { name: 'Ana Costa', email: 'ana@empresa.com', status: 'online', conversations: 3, role: 'Atendente' },
            {
              name: 'Carlos Silva',
              email: 'carlos@empresa.com',
              status: 'away',
              conversations: 1,
              role: 'Supervisor',
            },
            {
              name: 'Maria Santos',
              email: 'maria@empresa.com',
              status: 'offline',
              conversations: 0,
              role: 'Atendente',
            },
          ].map((member) => (
            <div key={member.email} className="team-member">
              <div className="team-member-info">
                <div className="team-member-avatar">
                  <div className="avatar">
                    <User size={20} />
                  </div>
                  <div
                    className={`status-indicator ${member.status}`}
                  />
                </div>

                <div className="team-member-details">
                  <div className="team-member-name">{member.name}</div>
                  <div className="team-member-email">{member.email}</div>
                </div>
              </div>

              <div className="team-member-stats">
                <div className="team-member-conversations">
                  <div className="conversations-count">{member.conversations}</div>
                  <div className="conversations-label">Conversas</div>
                </div>

                <div className="team-member-role">{member.role}</div>

                <button className="btn-icon" aria-label={`Mais opções para ${member.name}`}>
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'conversations':
        return <ConversationsTab />;
      case 'agents':
        return <AgentsTab />;
      case 'team':
        return <TeamTab />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">{renderContent()}</div>
    </div>
  );
};

export default AiAgentsPlatform;