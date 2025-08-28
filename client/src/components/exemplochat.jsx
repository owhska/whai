import React, { useState, useRef, useEffect } from 'react';
import { Search, MoreVertical, Phone, Video, Send, Smile, Paperclip, Mic, Check, CheckCheck } from 'lucide-react';

const WhatsAppClone = () => {
  const [selectedChat, setSelectedChat] = useState(0);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [selectedChat]);

  const [chats, setChats] = useState([
    {
      id: 1,
      name: 'Maria Silva',
      avatar: '👩‍💼',
      lastMessage: 'Oi! Como você está?',
      time: '14:32',
      unread: 2,
      online: true,
      messages: [
        { id: 1, text: 'Oi! Como você está?', sent: false, time: '14:30', read: true },
        { id: 2, text: 'Estou bem, obrigado! E você?', sent: true, time: '14:31', read: true },
        { id: 3, text: 'Também estou bem! Que bom te ver online', sent: false, time: '14:32', read: false }
      ]
    },
    {
      id: 2,
      name: 'João Santos',
      avatar: '👨‍💻',
      lastMessage: 'Você viu o projeto novo?',
      time: '13:45',
      unread: 0,
      online: false,
      messages: [
        { id: 1, text: 'Você viu o projeto novo?', sent: false, time: '13:45', read: true },
        { id: 2, text: 'Ainda não, onde posso ver?', sent: true, time: '13:46', read: true },
        { id: 3, text: 'Vou te mandar o link agora', sent: false, time: '13:47', read: true }
      ]
    },
    {
      id: 3,
      name: 'Ana Costa',
      avatar: '👩‍🎨',
      lastMessage: 'Perfeito! Muito obrigada',
      time: '12:20',
      unread: 0,
      online: true,
      messages: [
        { id: 1, text: 'Conseguiu finalizar o design?', sent: true, time: '12:15', read: true },
        { id: 2, text: 'Sim! Ficou ótimo', sent: false, time: '12:18', read: true },
        { id: 3, text: 'Perfeito! Muito obrigada', sent: false, time: '12:20', read: true }
      ]
    },
    {
      id: 4,
      name: 'Pedro Lima',
      avatar: '👨‍🚀',
      lastMessage: 'Combinado então!',
      time: '11:55',
      unread: 1,
      online: false,
      messages: [
        { id: 1, text: 'Vamos marcar para amanhã?', sent: true, time: '11:50', read: true },
        { id: 2, text: 'Perfeito! Que horário?', sent: false, time: '11:52', read: true },
        { id: 3, text: '14h pode ser?', sent: true, time: '11:53', read: true },
        { id: 4, text: 'Combinado então!', sent: false, time: '11:55', read: false }
      ]
    },
    {
      id: 5,
      name: 'Grupo Projeto',
      avatar: '👥',
      lastMessage: 'Carlos: Boa ideia!',
      time: '10:30',
      unread: 5,
      online: true,
      messages: [
        { id: 1, text: 'Pessoal, que tal uma reunião hoje?', sent: false, time: '10:25', read: true, sender: 'Laura' },
        { id: 2, text: 'Eu posso às 15h', sent: true, time: '10:27', read: true },
        { id: 3, text: 'Também posso!', sent: false, time: '10:28', read: true, sender: 'Marcos' },
        { id: 4, text: 'Boa ideia!', sent: false, time: '10:30', read: false, sender: 'Carlos' }
      ]
    }
  ]);

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now(),
        text: message,
        sent: true,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        read: false
      };

      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === chats[selectedChat].id 
            ? { 
                ...chat, 
                messages: [...chat.messages, newMessage],
                lastMessage: message,
                time: newMessage.time
              }
            : chat
        )
      );
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentChat = chats[selectedChat];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-xl">
              👤
            </div>
            <div className="flex space-x-3 text-gray-600">
              <MoreVertical size={20} className="cursor-pointer hover:text-gray-800" />
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Pesquisar ou começar uma nova conversa"
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map((chat, index) => (
            <div
              key={chat.id}
              className={`flex items-center p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedChat === index ? 'bg-gray-100' : ''
              }`}
              onClick={() => setSelectedChat(index)}
            >
              <div className="relative">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl mr-3">
                  {chat.avatar}
                </div>
                {chat.online && (
                  <div className="absolute bottom-0 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-medium text-gray-900 truncate">{chat.name}</h3>
                  <span className="text-xs text-gray-500">{chat.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                  {chat.unread > 0 && (
                    <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-gray-50 p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg mr-3">
                {currentChat.avatar}
              </div>
              <div>
                <h2 className="font-medium text-gray-900">{currentChat.name}</h2>
                <p className="text-sm text-gray-500">
                  {currentChat.online ? 'online' : 'visto por último hoje às 13:45'}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-4 text-gray-600">
              <Video size={20} className="cursor-pointer hover:text-gray-800" />
              <Phone size={20} className="cursor-pointer hover:text-gray-800" />
              <MoreVertical size={20} className="cursor-pointer hover:text-gray-800" />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50" style={{backgroundImage: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"40\" height=\"40\" viewBox=\"0 0 40 40\"><rect width=\"40\" height=\"40\" fill=\"%23f0f0f0\"/><circle cx=\"10\" cy=\"10\" r=\"1\" fill=\"%23e0e0e0\"/><circle cx=\"30\" cy=\"30\" r=\"1\" fill=\"%23e0e0e0\"/></svg>')"}}>
          <div className="space-y-2">
            {currentChat.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                    msg.sent
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-gray-800 shadow-sm'
                  }`}
                >
                  {msg.sender && !msg.sent && (
                    <p className="text-xs text-purple-600 font-medium mb-1">
                      {msg.sender}
                    </p>
                  )}
                  <p className="text-sm">{msg.text}</p>
                  <div className={`flex items-center justify-end mt-1 space-x-1 ${
                    msg.sent ? 'text-green-100' : 'text-gray-500'
                  }`}>
                    <span className="text-xs">{msg.time}</span>
                    {msg.sent && (
                      msg.read ? 
                        <CheckCheck size={14} className="text-blue-200" /> : 
                        <Check size={14} />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <Smile size={24} className="text-gray-500 cursor-pointer hover:text-gray-700" />
            <Paperclip size={24} className="text-gray-500 cursor-pointer hover:text-gray-700" />
            
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Digite uma mensagem"
                className="w-full px-4 py-2 rounded-full bg-white border border-gray-300 focus:outline-none focus:border-green-500"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            
            {message.trim() ? (
              <button
                onClick={sendMessage}
                className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors"
              >
                <Send size={20} />
              </button>
            ) : (
              <Mic size={24} className="text-gray-500 cursor-pointer hover:text-gray-700" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppClone;