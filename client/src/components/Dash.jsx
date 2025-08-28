import React, { useState, useEffect, useRef, useContext } from "react";
/* eslint-disable no-unused-vars */
import { Calendar, Plus, Filter, Bell, User, Clock, CheckCircle, AlertCircle, XCircle,
  Eye, Trash2, FileText, Home, List, BarChart3, Maximize2, X, LogOut,
  Upload, Download, Image, File, AlertTriangle, Edit, RefreshCw, ChevronDown, ChevronUp, Loader2,
  Search, MoreVertical, Phone, Video, Send, Smile, Paperclip, Mic, Check, CheckCheck,
  BookDashed,
  AlarmCheck,
  CircuitBoard,
  Contact,
  Bot,
  ChartLine
} from "lucide-react";
import { AuthContext } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import { taskService, userService, logService, agendaTributariaService } from '../services/api';
import whatsappService from '../services/whatsappService';
import axiosInstance from '../utils/axiosConfig';
import "../styles/styles.css";
import "../styles/whatsapp.css";

const Dash = () => {
  const { user, logout, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  // Debug logs para verificar se os valores estão chegando corretamente
  console.log("[Calendario] user recebido:", user);
  console.log("[Calendario] isAdmin recebido:", isAdmin);
  console.log("[Calendario] user.cargo:", user?.cargo);


  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [activeView, setActiveView] = useState("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState({
    status: "todos",
    colaborador: "todos",
    mes: new Date().getMonth(),
  });
  const [tasks, setTasks] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [atividadeLog, setAtividadeLog] = useState([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Estados para gerenciamento de arquivos
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showFileInspector, setShowFileInspector] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle', 'uploading', 'processing', 'completed', 'error'

  // Estados para paginação de tarefas
  const [currentTaskPage, setCurrentTaskPage] = useState(1);
  const [currentReportPage, setCurrentReportPage] = useState(1);
  const [currentHomePage, setCurrentHomePage] = useState(1);
  const tasksPerPage = 5;

  // Estados para Agenda Tributária
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [obrigacoes, setObrigacoes] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [responsavelEmail, setResponsavelEmail] = useState('');
  const [agendaResultado, setAgendaResultado] = useState(null);
  const [agendaError, setAgendaError] = useState(null);
  const [showObrigacoes, setShowObrigacoes] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState({});

  // Estados para Sistema Automatizado de Agenda Tributária (único sistema disponível)
  const [modoAvancado, setModoAvancado] = useState(true); // Sistema automatizado é o padrão e único
  const [sistemaAtualizado, setSistemaAtualizado] = useState(false);
  const [obrigacoesCompletas, setObrigacoesCompletas] = useState([]);
  const [loadingObrigacoesAtualizadas, setLoadingObrigacoesAtualizadas] = useState(false);
  const [criacoesAutomatizadas, setCriacoesAutomatizadas] = useState({});
  const [agendaAtivada, setAgendaAtivada] = useState(true);
  const [agentesServicos, setAgentesServicos] = useState({
    servicoA: true,
    servicoB: false,
    servicoC: false,
    servicoD: true,
  });
  const [cardsData, setCardsData] = useState([
    { title: "Sistema 1", description: "Descrição genérica para o sistema 1", enabled: true },
    { title: "Sistema 2", description: "Descrição genérica para o sistema 2", enabled: true },
    { title: "Sistema 3", description: "Descrição genérica para o sistema 3", enabled: true },
    { title: "Sistema 4", description: "Descrição genérica para o sistema 4", enabled: true },
  ]);

  // Persistência local dos estados dos cards de Agenda/Serviços
  useEffect(() => {
    try {
      const stored = localStorage.getItem('agendaCardsData');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setCardsData(parsed);
      }
    } catch (e) {
      console.warn('Falha ao carregar agendaCardsData do localStorage');
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('agendaCardsData', JSON.stringify(cardsData));
    } catch (e) {
      console.warn('Falha ao salvar agendaCardsData no localStorage');
    }
  }, [cardsData]);

  // Estados para Gerenciar Contatos
  const [contacts, setContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState("");
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContactIndex, setEditingContactIndex] = useState(null);
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    avatar: "👤",
    tags: [],
    note: "",
  });

  const [newTask, setNewTask] = useState({
    titulo: "",
    responsavel: "",
    responsavelId: "",
    dataVencimento: "",
    observacoes: "",
  recorrente: false,
  frequencia: "mensal",
  });

  const [editTask, setEditTask] = useState({
    id: "",
    titulo: "",
    responsavel: "",
    responsavelId: "",
    dataVencimento: "",
    observacoes: "",
    recorrente: false,
    frequencia: "mensal",
  });

  const modalRef = useRef(null);

  const statusColors = {
    pendente: "bg-yellow-100 text-yellow-800 border-yellow-200",
    em_andamento: "bg-blue-100 text-blue-800 border-blue-200",
    finalizado: "bg-green-100 text-green-800 border-green-200",
    vencido: "bg-red-100 text-red-800 border-red-200",
  };

  const statusIcons = {
    pendente: <Clock className="w-4 h-4" />,
    em_andamento: <AlertCircle className="w-4 h-4" />,
    finalizado: <CheckCircle className="w-4 h-4" />,
    vencido: <XCircle className="w-4 h-4" />,
  };

  const statusLabels = {
    pendente: "Pendente",
    em_andamento: "Em Andamento",
    finalizado: "Finalizado",
    vencido: "Vencido/Em Atraso",
  };

  const menuItems = [
    { id: "home", label: "Home", icon: Home, description: "Conversas" },
    { id: "tasks", label: "Contatos", icon: Contact, description: "Gerenciar contatos" },
    { id: "reports", label: "Relatórios", icon: ChartLine, description: "Relatórios e estatísticas" },
    ...(isAdmin ? [{ id: "agenda-tributaria", label: "Agentes", icon: Bot, description: "Agentes e Serviços" }] : []),
  ];

  useEffect(() => {
    if (user) {
      setCurrentUser({
        id: user.uid,
        nome: user.email ? user.email.split("@")[0] : "Usuário",
        tipo: user.cargo || "usuario",
      });

      // Inicializar newTask com o ID do usuário atual
      setNewTask(prev => ({
        ...prev,
        responsavelId: user.uid
      }));
    }
  }, [user]);

  // Função para buscar tarefas - movida para fora do useEffect para poder ser reutilizada
  const fetchTasks = async () => {
    try {
      const tasksData = await taskService.getAll();
      const formattedTasks = tasksData.map(task => ({
        ...task,
        dataVencimento: new Date(task.dataVencimento),
        dataCriacao: new Date(task.dataCriacao),
        comprovantes: task.comprovantes || [],
      }));
      setTasks(formattedTasks);
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchTasks();
  }, [currentUser]);

  useEffect(() => {
    const hoje = new Date();
    setTasks((prev) =>
      prev.map((t) =>
        t.status !== "finalizado" && new Date(t.dataVencimento) < hoje
          ? { ...t, status: "vencido" }
          : t
      )
    );
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const fetchUsers = async () => {
      try {
        const usuariosData = await userService.getAll();
        const formattedUsers = usuariosData.map(user => ({
          id: user.id || user.uid,
          nome: user.nome || user.nomeCompleto || (user.email ? user.email.split("@")[0] : "Usuário"),
          tipo: user.tipo || user.cargo || "usuario",
        }));
      setUsuarios(formattedUsers);
      console.log("[USERS DEBUG] Dados originais do servidor:", usuariosData);
      console.log("[USERS DEBUG] Usuários formatados:", formattedUsers);
      console.log("[USERS DEBUG] UID do usuário atual:", user?.uid);
      console.log("[USERS DEBUG] Usuário atual está na lista?", formattedUsers.find(u => u.id === user?.uid));
      console.log("[USERS DEBUG] Lista completa de IDs:", formattedUsers.map(u => ({ id: u.id, nome: u.nome })));

      // Log individual de cada usuário
      formattedUsers.forEach((u, index) => {
        console.log(`[USER ${index}] ID: ${u.id}, Nome: "${u.nome}", Tipo: ${u.tipo}`);
      });
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
      }
    };

    fetchUsers();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchLogs = async () => {
      try {
        const logsData = await logService.getAll();
        console.log('[LOGS DEBUG] Dados recebidos do backend:', logsData.length, 'logs');
        console.log('[LOGS DEBUG] Primeiro log:', logsData[0]);

        const formattedLogs = logsData.map(log => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));

        console.log('[LOGS DEBUG] Logs formatados:', formattedLogs.length);
        console.log('[LOGS DEBUG] Primeiro log formatado:', formattedLogs[0]);

        // O backend já filtra os logs baseado nas permissões do usuário
        // Não precisamos filtrar novamente no frontend
        setAtividadeLog(formattedLogs);
        console.log('[LOGS DEBUG] Logs definidos no state:', formattedLogs.length);
      } catch (error) {
        console.error("Erro ao buscar logs de atividades:", error);
      }
    };

    fetchLogs();
  }, [currentUser, isAdmin, user]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getTasksForDate = (date) =>
    tasks.filter((t) => {
      if (!t.dataVencimento) return false;
      const taskDate = t.dataVencimento instanceof Date ? t.dataVencimento : new Date(t.dataVencimento);
      return taskDate.toDateString() === date.toDateString();
    });

  const getFilteredTasks = () => {
    console.log("[FILTER DEBUG] Iniciando filtros de tarefas...");
    console.log("[FILTER DEBUG] Total de tarefas:", tasks.length);
    console.log("[FILTER DEBUG] Usuário atual:", { uid: user?.uid, email: user?.email });
    console.log("[FILTER DEBUG] isAdmin:", isAdmin);

    let filtered = tasks;

    if (!isAdmin) {
      console.log("[FILTER DEBUG] Aplicando filtro para usuário comum");
      console.log("[FILTER DEBUG] Tarefas antes do filtro:", filtered.map(t => ({
        id: t.id,
        titulo: t.titulo,
        responsavelId: t.responsavelId,
        match: t.responsavelId === user.uid
      })));

      filtered = filtered.filter((t) => {
        const match = t.responsavelId === user.uid;
        console.log(`[FILTER DEBUG] Tarefa "${t.titulo}" - responsavelId: "${t.responsavelId}", user.uid: "${user.uid}", match: ${match}`);
        return match;
      });

      console.log("[FILTER DEBUG] Tarefas após filtro do usuário:", filtered.length);
    } else {
      console.log("[FILTER DEBUG] Usuário admin - sem filtro de responsável");
    }

    if (filters.status !== "todos") {
      const beforeCount = filtered.length;
      filtered = filtered.filter((t) => t.status === filters.status);
      console.log(`[FILTER DEBUG] Filtro de status (${filters.status}): ${beforeCount} -> ${filtered.length}`);
    }

    if (filters.colaborador !== "todos" && isAdmin) {
      const beforeCount = filtered.length;
      filtered = filtered.filter((t) => t.responsavelId === filters.colaborador);
      console.log(`[FILTER DEBUG] Filtro de colaborador (${filters.colaborador}): ${beforeCount} -> ${filtered.length}`);
    }

    if (filters.mes !== "todos") {
      const beforeCount = filtered.length;
      filtered = filtered.filter((t) => {
        if (!t.dataVencimento) return false;
        const taskDate = t.dataVencimento instanceof Date ? t.dataVencimento : new Date(t.dataVencimento);
        return taskDate.getMonth() === +filters.mes;
      });
      console.log(`[FILTER DEBUG] Filtro de mês (${filters.mes}): ${beforeCount} -> ${filtered.length}`);
    }

    console.log("[FILTER DEBUG] Resultado final:", filtered.length, "tarefas");
    return filtered;
  };

  const logActivity = async (action, taskId, taskTitle) => {
    try {
      const logData = {
        userId: user.uid,
        userEmail: user.email,
        action,
        taskId,
        taskTitle,
        taskResponsavelId: newTask.responsavelId || selectedTask?.responsavelId || "",
        timestamp: new Date().toISOString(),
      };
      const createdLog = await logService.create(logData);

      // Atualizar logs local imediatamente para refletir na UI
      const formattedLog = {
        ...createdLog,
        timestamp: new Date(createdLog.timestamp),
      };

      setAtividadeLog(prev => [formattedLog, ...prev]);
    } catch (error) {
      console.error("Erro ao registrar atividade:", error);
    }
  };

  const handleCreateTask = async () => {
    if (!user) {
      alert("Você precisa estar autenticado para criar uma tarefa!");
      return;
    }

    // Verificar se o usuário é admin para poder criar tarefas
    if (!isAdmin) {
      alert("Apenas administradores podem criar tarefas.");
      return;
    }

    if (!newTask.titulo.trim() || !newTask.responsavelId || !newTask.dataVencimento) {
      alert("Preencha todos os campos obrigatórios!");
      return;
    }
    const responsavel = usuarios.find((u) => u.id === newTask.responsavelId);
    if (!responsavel) {
      alert("O responsável selecionado não está cadastrado no sistema!");
      return;
    }

    const taskData = {
      titulo: newTask.titulo.trim(),
      responsavel: responsavel.nome,
      responsavelId: responsavel.id,
      dataVencimento: new Date(newTask.dataVencimento).toISOString(),
      status: "pendente",
      observacoes: newTask.observacoes || "",
      comprovantes: [],
      dataCriacao: new Date().toISOString(),
      recorrente: newTask.recorrente,
      frequencia: newTask.frequencia,
    };

    console.log("[CREATE TASK] Usuário autenticado:", user.uid);
    console.log("[CREATE TASK] Responsável selecionado:", responsavel);
    console.log("[CREATE TASK] Dados da tarefa:", taskData);
    console.log("[CREATE TASK] ResponsavelId que será salvo:", responsavel.id);

    try {
      const createdTask = await taskService.create(taskData);
      await logActivity("create_task", createdTask.id, taskData.titulo);

      // Atualizar lista local de tarefas
      const formattedTask = {
        ...createdTask,
        dataVencimento: new Date(createdTask.dataVencimento),
        dataCriacao: new Date(createdTask.dataCriacao),
        comprovantes: createdTask.comprovantes || [],
      };
      setTasks(prev => [...prev, formattedTask]);

      setShowTaskModal(false);
      setNewTask({
        titulo: "",
        responsavel: "",
        responsavelId: "",
        dataVencimento: "",
        observacoes: "",
        recorrente: false,
        frequencia: "mensal",
      });
      console.log("Tarefa criada com sucesso!");
    } catch (error) {
      console.error("Erro ao criar tarefa:", error.message);
      alert("Erro ao criar tarefa. Tente novamente.");
    }
  };

  const handleUpdateTaskStatus = async (id, status) => {
    const task = tasks.find((t) => t.id === id);

    // Verificar se o usuário pode atualizar o status da tarefa
    if (!isAdmin && task?.responsavelId !== user?.uid) {
      alert("Você só pode atualizar o status de suas próprias tarefas.");
      return;
    }

    // Validar se há comprovante anexado para marcar como finalizado
    if (status === "finalizado") {
      const hasComprovantes = task?.comprovantes && task.comprovantes.length > 0;
      if (!hasComprovantes) {
        alert("Para marcar como finalizado, é obrigatório anexar pelo menos um comprovante à tarefa.");
        return;
      }
    }

    try {
      await taskService.updateStatus(id, status);
      await logActivity("update_task_status", id, task?.titulo || "Tarefa");
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
      if (selectedTask && selectedTask.id === id) {
        setSelectedTask({ ...selectedTask, status });
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status. Tente novamente.");
    }
  };

  const handleEditTask = (task) => {
    // Verificar se o usuário é admin para poder editar tarefas
    if (!isAdmin) {
      alert("Apenas administradores podem editar tarefas.");
      return;
    }

    // Definir dados da tarefa para edição
    setEditTask({
      id: task.id,
      titulo: task.titulo,
      responsavel: task.responsavel,
      responsavelId: task.responsavelId,
      dataVencimento: task.dataVencimento ?
        new Date(task.dataVencimento).toISOString().split('T')[0] : "",
      observacoes: task.observacoes || "",
      recorrente: task.recorrente || false,
      frequencia: task.frequencia || "mensal",
    });

    setEditingTask(task);
    setShowEditTaskModal(true);
    setShowTaskDetails(false);
  };

  const handleUpdateTask = async () => {
    if (!user) {
      alert("Você precisa estar autenticado para editar uma tarefa!");
      return;
    }

    // Verificar se o usuário é admin para poder editar tarefas
    if (!isAdmin) {
      alert("Apenas administradores podem editar tarefas.");
      return;
    }

    if (!editTask.titulo.trim() || !editTask.responsavelId || !editTask.dataVencimento) {
      alert("Preencha todos os campos obrigatórios!");
      return;
    }

    const responsavel = usuarios.find((u) => u.id === editTask.responsavelId);
    if (!responsavel) {
      alert("O responsável selecionado não está cadastrado no sistema!");
      return;
    }

    const taskData = {
      titulo: editTask.titulo.trim(),
      responsavel: responsavel.nome,
      responsavelId: responsavel.id,
      dataVencimento: new Date(editTask.dataVencimento).toISOString(),
      observacoes: editTask.observacoes || "",
      recorrente: editTask.recorrente,
      frequencia: editTask.frequencia,
    };

    try {
      const updatedTask = await taskService.update(editTask.id, taskData);
      await logActivity("edit_task", editTask.id, taskData.titulo);

      // Atualizar lista local de tarefas
      const formattedTask = {
        ...updatedTask,
        dataVencimento: new Date(updatedTask.dataVencimento),
        dataCriacao: new Date(updatedTask.dataCriacao),
        comprovantes: updatedTask.comprovantes || [],
      };

      setTasks(prev => prev.map(t =>
        t.id === editTask.id ? formattedTask : t
      ));

      // Atualizar tarefa selecionada se for a mesma
      if (selectedTask && selectedTask.id === editTask.id) {
        setSelectedTask(formattedTask);
      }

      setShowEditTaskModal(false);
      setEditingTask(null);
      setEditTask({
        id: "",
        titulo: "",
        responsavel: "",
        responsavelId: "",
        dataVencimento: "",
        observacoes: "",
        recorrente: false,
        frequencia: "mensal",
      });
      alert("Tarefa atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error.message);
      alert("Erro ao atualizar tarefa. Tente novamente.");
    }
  };

  const handleDeleteTask = async (id) => {
    // Verificar se o usuário é admin para poder excluir tarefas
    if (!isAdmin) {
      alert("Apenas administradores podem excluir tarefas.");
      return;
    }

    if (window.confirm("Tem certeza de que deseja excluir esta tarefa?")) {
      try {
        const task = tasks.find((t) => t.id === id);
        await taskService.delete(id);
        await logActivity("delete_task", id, task?.titulo || "Tarefa");
        setTasks((prev) => prev.filter((t) => t.id !== id));
        setShowTaskDetails(false);
        setSelectedTask(null);
      } catch (error) {
        console.error("Erro ao excluir tarefa:", error);
        alert("Erro ao excluir tarefa. Tente novamente.");
      }
    }
  };

  // Função para validar tipo de arquivo
  const validateFileType = (file) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];
    return allowedTypes.includes(file.type);
  };

  // Função para validar tamanho do arquivo (máximo 10MB)
  const validateFileSize = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB em bytes
    return file.size <= maxSize;
  };

  // Função para gerar preview do arquivo
  const generateFilePreview = (file) => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            type: 'image',
            url: e.target.result,
            name: file.name,
            size: file.size
          });
        };
        reader.readAsDataURL(file);
      } else {
        resolve({
          type: 'document',
          url: null,
          name: file.name,
          size: file.size,
          fileType: file.type
        });
      }
    });
  };

  // Função para formatar tamanho do arquivo
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Função para selecionar arquivo e mostrar preview inline
  const handleFileSelect = async (taskId, file) => {
    console.log('[DEBUG] handleFileSelect chamado:', { taskId, fileName: file?.name });
    if (!file) {
      console.log('[DEBUG] Arquivo não fornecido');
      return;
    }

    console.log('[DEBUG] Limpando erros anteriores...');
    setFileError(null);

    // Validar tipo de arquivo
    console.log('[DEBUG] Validando tipo de arquivo:', file.type);
    if (!validateFileType(file)) {
      console.log('[DEBUG] Tipo de arquivo inválido:', file.type);
      setFileError('Tipo de arquivo não suportado. Use imagens (JPEG, PNG, GIF, WebP) ou documentos (PDF, Word, Excel, TXT, CSV).');
      return;
    }

    // Validar tamanho do arquivo
    console.log('[DEBUG] Validando tamanho do arquivo:', file.size);
    if (!validateFileSize(file)) {
      console.log('[DEBUG] Arquivo muito grande:', file.size);
      setFileError('Arquivo muito grande. O tamanho máximo é 10MB.');
      return;
    }

    console.log('[DEBUG] Arquivo válido, configurando states para preview inline...');
    setSelectedFile({ file, taskId });
    const preview = await generateFilePreview(file);
    setFilePreview(preview);
    console.log('[DEBUG] Preview configurado - exibindo controles inline');
  };


  // Função para confirmar upload do arquivo
  const handleConfirmUpload = async () => {
    if (!selectedFile) {
      console.error('[UPLOAD] Erro: selectedFile está vazio');
      return;
    }

    console.log('[UPLOAD] Iniciando processo de upload...');
    console.log('[UPLOAD] selectedFile:', selectedFile);

    setIsUploading(true);
    setUploadProgress(0);
    setFileError(null);
    setUploadStatus('uploading');

    try {
      const { file, taskId } = selectedFile;

      console.log('[UPLOAD] Dados do arquivo:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
      console.log('[UPLOAD] TaskId:', taskId);

      // Verificar se o token de autenticação existe
      const token = localStorage.getItem('authToken');
      console.log('[UPLOAD] Token de autenticação presente:', !!token);
      if (token) {
        console.log('[UPLOAD] Primeiros 20 chars do token:', token.substring(0, 20) + '...');
      }

      // Simular progresso de upload com feedback visual aprimorado
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            setUploadStatus('processing');
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      // Criar FormData para envio do arquivo
      const formData = new FormData();
      formData.append('file', file);
      formData.append('taskId', taskId);

      console.log('[UPLOAD] FormData criado:');
      for (let [key, value] of formData.entries()) {
        console.log(`[UPLOAD] FormData - ${key}:`, value);
      }

      console.log('[UPLOAD] Enviando requisição para /api/upload...');
      console.log('[UPLOAD] URL completa:', axiosInstance.defaults.baseURL + '/api/upload');

      // Enviar arquivo para o backend
      const response = await axiosInstance.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log('[UPLOAD] Progresso real do upload:', progress + '%');
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('completed');

      console.log('[UPLOAD] ✅ Resposta recebida com sucesso!');
      console.log('[UPLOAD] Status da resposta:', response.status);
      console.log('[UPLOAD] Headers da resposta:', response.headers);
      console.log('[UPLOAD] Dados da resposta:', response.data);

      // Verificar se a resposta contém os dados esperados
      if (!response.data || !response.data.url) {
        console.error('[UPLOAD] ❌ Resposta inválida - dados incompletos:', response.data);
        throw new Error('Resposta do servidor incompleta');
      }

      const fileMetadata = {
        url: response.data.url,
        name: response.data.name,
        size: response.data.size,
        type: response.data.type,
        uploadDate: response.data.uploadDate,
        uploadedBy: response.data.uploadedBy,
        id: response.data.id
      };

      console.log('[UPLOAD] Metadata do arquivo criado:', fileMetadata);

      // O arquivo já foi salvo no backend via upload endpoint

      await logActivity("upload_file", taskId, tasks.find((t) => t.id === taskId)?.titulo || "Tarefa");

      // Atualizar estado local
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? {
            ...t,
            comprovantes: [...(t.comprovantes || []), fileMetadata]
          } : t
        )
      );

      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({
          ...selectedTask,
          comprovantes: [...(selectedTask.comprovantes || []), fileMetadata]
        });
      }

      // Limpar estados após um breve delay para mostrar o feedback de sucesso
      setTimeout(() => {
        setSelectedFile(null);
        setFilePreview(null);
        setUploadProgress(0);
        setIsUploading(false);
        setUploadStatus('idle');
      }, 1500);

    } catch (error) {
      console.error("[UPLOAD] ❌ Erro ao fazer upload do arquivo:", error);

      // Log detalhado do erro
      if (error.response) {
        // O servidor respondeu com um código de erro
        console.error("[UPLOAD] Status do erro:", error.response.status);
        console.error("[UPLOAD] Headers do erro:", error.response.headers);
        console.error("[UPLOAD] Dados do erro:", error.response.data);
        console.error("[UPLOAD] Mensagem do servidor:", error.response.data?.error || error.response.data?.message);
      } else if (error.request) {
        // A requisição foi feita mas não houve resposta
        console.error("[UPLOAD] Sem resposta do servidor:", error.request);
        console.error("[UPLOAD] Status da requisição:", error.request.status);
        console.error("[UPLOAD] Ready state:", error.request.readyState);
      } else {
        // Erro na configuração da requisição
        console.error("[UPLOAD] Erro na configuração:", error.message);
      }

      console.error("[UPLOAD] Config da requisição:", error.config);
      console.error("[UPLOAD] Stack trace:", error.stack);

      // Limpar progresso em caso de erro
      const progressInterval = setInterval(() => {}, 1);
      clearInterval(progressInterval);

      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.message ||
                          error.message ||
                          "Erro ao fazer upload do arquivo. Tente novamente.";

      setFileError(errorMessage);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus('error');
    }
  };

  // Função para cancelar upload
  const handleCancelUpload = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadProgress(0);
    setIsUploading(false);
    setFileError(null);
    setUploadStatus('idle');
  };

  // Função para obter ícone do tipo de arquivo
  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-600" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-600" />;
    } else if (fileType.includes('word')) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    } else if (fileType.includes('excel') || fileType.includes('sheet')) {
      return <FileText className="w-5 h-5 text-green-600" />;
    } else {
      return <File className="w-5 h-5 text-gray-600" />;
    }
  };

  // Função legada para manter compatibilidade
  const handleFileUpload = async (id, file) => {
    console.log('[DEBUG] handleFileUpload chamado:', { id, file: file?.name });
    if (!file) {
      console.log('[DEBUG] Nenhum arquivo selecionado');
      alert("Selecione um arquivo para upload!");
      return;
    }
    console.log('[DEBUG] Chamando handleFileSelect...');
    await handleFileSelect(id, file);
  };

  const handleCloseModal = (modalType) => {
    if (modalType === "task") {
      setShowTaskModal(false);
      setNewTask({
        titulo: "",
        responsavel: "",
        responsavelId: user?.uid || "",
        dataVencimento: "",
        observacoes: "",
        recorrente: false,
        frequencia: "mensal",
      });
    } else if (modalType === "edit") {
      setShowEditTaskModal(false);
      setEditingTask(null);
      setEditTask({
        id: "",
        titulo: "",
        responsavel: "",
        responsavelId: "",
        dataVencimento: "",
        observacoes: "",
        recorrente: false,
        frequencia: "mensal",
      });
    } else if (modalType === "details") {
      setShowTaskDetails(false);
      setSelectedTask(null);
    } else if (modalType === "logout") {
      setShowLogoutConfirm(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const minimizeSidebar = () => {
    setSidebarCollapsed(true);
  };

  const maximizeSidebar = () => {
    setSidebarCollapsed(false);
  };

  // Função para calcular dados da paginação
  const getPaginationData = (data, currentPage, itemsPerPage) => {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = data.slice(startIndex, endIndex);

    return {
      currentItems,
      totalPages,
      totalItems,
      startIndex,
      endIndex: Math.min(endIndex, totalItems),
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  };

  // Componente de navegação de páginas
  const PaginationControls = ({ currentPage, setCurrentPage, totalPages, totalItems, startIndex, endIndex, label }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-between items-center mt-4 p-4 bg-gray-50 rounded-lg">
        <small className="text-gray-600">
          Mostrando {startIndex + 1} a {endIndex} de {totalItems} {label}
        </small>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>

          {/* Páginas */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
            // Mostrar apenas algumas páginas para não ficar muito longo
            if (totalPages > 7 && page > 3 && page < totalPages - 2 && Math.abs(page - currentPage) > 1) {
              return page === 4 || page === totalPages - 3 ? (
                <span key={page} className="px-2 py-1 text-gray-500">...</span>
              ) : null;
            }

            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  page === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Próxima
          </button>
        </div>
      </div>
    );
  };

  // Estados para o chat estilo WhatsApp com monitoramento
  const [selectedChat, setSelectedChat] = useState(0);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  // Estados específicos para monitoramento WhatsApp
  const [chats, setChats] = useState([]);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [whatsappConnectionStatus, setWhatsappConnectionStatus] = useState('disconnected');
  const [monitoringStats, setMonitoringStats] = useState({
    totalConversations: 0,
    unreadMessages: 0,
    activeAgents: 0,
    responseTime: '0s',
    dailyMessages: 0
  });
  const [filterOptions, setFilterOptions] = useState({
    status: 'all', // all, read, unread, agent, manual
    period: 'today', // today, week, month
    contact: 'all',
    agent: 'all'
  });
  const [conversationHistory, setConversationHistory] = useState([]);
  const [agentActivity, setAgentActivity] = useState([]);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [autoResponseConfig, setAutoResponseConfig] = useState({
    enabled: false,
    businessHours: { start: '09:00', end: '18:00' },
    welcomeMessage: 'Olá! Como posso ajudá-lo?',
    awayMessage: 'Estamos fora do horário de atendimento. Retornaremos em breve.'
  });
  const [contactProfiles, setContactProfiles] = useState({});
  const [messageTemplates, setMessageTemplates] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [isLoadingWhatsApp, setIsLoadingWhatsApp] = useState(false);
  const [whatsappError, setWhatsappError] = useState(null);
  const [showMonitoringPanel, setShowMonitoringPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  // Inicialização do WhatsApp Service e funcionalidades de monitoramento
  useEffect(() => {
    const initializeWhatsApp = async () => {
      if (activeView !== 'home') return;

      try {
        setIsLoadingWhatsApp(true);
        setWhatsappError(null);

        // Verificar status da conexão
        const status = await whatsappService.checkConnectionStatus();
        setWhatsappConnectionStatus(status.status || 'disconnected');
        setWhatsappConnected(status.connected || false);

        if (status.connected) {
          // Buscar conversas e estatísticas
          await loadWhatsAppData();

          // Configurar listeners em tempo real se habilitado
          if (realTimeUpdates) {
            await setupRealTimeListeners();
          }
        }
      } catch (error) {
        console.error('[WHATSAPP] Erro na inicialização:', error);
        setWhatsappError('Erro ao conectar com WhatsApp: ' + error.message);
        setWhatsappConnected(false);
        setWhatsappConnectionStatus('error');
      } finally {
        setIsLoadingWhatsApp(false);
      }
    };

    initializeWhatsApp();
  }, [activeView, realTimeUpdates]);

  // Carregar dados do WhatsApp
  const loadWhatsAppData = async () => {
    try {
      // Buscar conversas
      const conversations = await whatsappService.getChats();
      if (conversations?.length > 0) {
        const formattedChats = conversations.map(chat => ({
          id: chat.id,
          name: chat.name || chat.pushname || 'Contato',
          avatar: '👤',
          lastMessage: chat.lastMessage?.body || '',
          time: chat.lastMessage?.timestamp ? new Date(chat.lastMessage.timestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
          unread: chat.unreadCount || 0,
          online: false,
          messages: []
        }));

        setChats(formattedChats);
      }

      // Buscar estatísticas (método mock se não existir)
      try {
        const stats = await (whatsappService.getAgentStats ? whatsappService.getAgentStats() : Promise.resolve(null));
        if (stats) {
          setMonitoringStats({
            totalConversations: stats.totalChats || 0,
            unreadMessages: stats.unreadMessages || 0,
            activeAgents: stats.activeAgents || 0,
            responseTime: stats.averageResponseTime || '0s',
            dailyMessages: stats.dailyMessages || 0
          });
        }
      } catch (error) {
        console.warn('[WHATSAPP] getAgentStats não implementado:', error);
      }

      // Buscar perfis de contatos (método mock se não existir)
      try {
        const profiles = await (whatsappService.getContactProfiles ? whatsappService.getContactProfiles() : Promise.resolve({}));
        if (profiles) {
          setContactProfiles(profiles);
        }
      } catch (error) {
        console.warn('[WHATSAPP] getContactProfiles não implementado:', error);
      }

      // Buscar templates de mensagem (método mock se não existir)
      try {
        const templates = await (whatsappService.getMessageTemplates ? whatsappService.getMessageTemplates() : Promise.resolve([]));
        if (templates) {
          setMessageTemplates(templates);
        }
      } catch (error) {
        console.warn('[WHATSAPP] getMessageTemplates não implementado:', error);
      }

      // Buscar configurações de auto resposta (método mock se não existir)
      try {
        const autoConfig = await (whatsappService.getAutoReplyConfig ? whatsappService.getAutoReplyConfig() : Promise.resolve(null));
        if (autoConfig) {
          setAutoResponseConfig(autoConfig);
        }
      } catch (error) {
        console.warn('[WHATSAPP] getAutoReplyConfig não implementado:', error);
      }

    } catch (error) {
      console.error('[WHATSAPP] Erro ao carregar dados:', error);
      setWhatsappError('Erro ao carregar dados do WhatsApp');
    }
  };

  // Configurar listeners em tempo real
  const setupRealTimeListeners = async () => {
    try {
      // Listener para novas mensagens (método mock se não existir)
      if (whatsappService.onMessage) {
        await whatsappService.onMessage((message) => {
        console.log('[WHATSAPP] Nova mensagem recebida:', message);

        // Atualizar chat correspondente
        setChats(prevChats => {
          const chatIndex = prevChats.findIndex(chat => chat.id === message.from);
          if (chatIndex !== -1) {
            const updatedChats = [...prevChats];
            const newMessage = {
              id: Date.now(),
              text: message.body || '',
              sent: false,
              time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              read: false,
              sender: message.notifyName || 'Contato'
            };

            updatedChats[chatIndex].messages.push(newMessage);
            updatedChats[chatIndex].lastMessage = message.body || '';
            updatedChats[chatIndex].time = newMessage.time;
            updatedChats[chatIndex].unread += 1;

            return updatedChats;
          }
          return prevChats;
        });

        // Atualizar estatísticas
        setMonitoringStats(prev => ({
          ...prev,
          unreadMessages: prev.unreadMessages + 1,
          dailyMessages: prev.dailyMessages + 1
        }));
      });
      } else {
        console.warn('[WHATSAPP] onMessage não implementado');
      }

      // Listener para status de mensagens (método mock se não existir)
      if (whatsappService.onMessageStatus) {
        await whatsappService.onMessageStatus((status) => {
        console.log('[WHATSAPP] Status da mensagem atualizado:', status);

        // Atualizar status da mensagem no chat
        setChats(prevChats => {
          return prevChats.map(chat => ({
            ...chat,
            messages: chat.messages.map(msg =>
              msg.id === status.messageId
                ? { ...msg, read: status.status === 'read' }
                : msg
            )
          }));
        });
      });
      } else {
        console.warn('[WHATSAPP] onMessageStatus não implementado');
      }

    } catch (error) {
      console.error('[WHATSAPP] Erro ao configurar listeners:', error);
    }
  };

  // Função para conectar ao WhatsApp
  const connectWhatsApp = async () => {
    try {
      setIsLoadingWhatsApp(true);
      setWhatsappError(null);

      const result = await whatsappService.connect();
      if (result.success) {
        setWhatsappConnected(true);
        setWhatsappConnectionStatus('connected');
        await loadWhatsAppData();
      } else {
        throw new Error(result.error || 'Falha na conexão');
      }
    } catch (error) {
      console.error('[WHATSAPP] Erro ao conectar:', error);
      setWhatsappError('Erro ao conectar: ' + error.message);
      setWhatsappConnected(false);
      setWhatsappConnectionStatus('error');
    } finally {
      setIsLoadingWhatsApp(false);
    }
  };

  // Função para desconectar do WhatsApp
  const disconnectWhatsApp = async () => {
    try {
      setIsLoadingWhatsApp(true);

      await whatsappService.disconnect();
      setWhatsappConnected(false);
      setWhatsappConnectionStatus('disconnected');
      setChats([]);
      setMonitoringStats({
        totalConversations: 0,
        unreadMessages: 0,
        activeAgents: 0,
        responseTime: '0s',
        dailyMessages: 0
      });
    } catch (error) {
      console.error('[WHATSAPP] Erro ao desconectar:', error);
      setWhatsappError('Erro ao desconectar: ' + error.message);
    } finally {
      setIsLoadingWhatsApp(false);
    }
  };

  // Função para enviar mensagem integrada com WhatsApp Service
  const sendWhatsAppMessage = async (chatId, messageText) => {
    try {
      const result = await whatsappService.sendMessage(chatId, messageText);

      if (result.success) {
        const message = {
          id: result.messageId || Date.now(),
          text: messageText,
          sent: true,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          read: false
        };

        // Atualizar chat local
        setChats(prevChats =>
          prevChats.map(chat =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: [...(chat.messages || []), message],
                  lastMessage: messageText,
                  time: message.time
                }
              : chat
          )
        );

        // Atualizar estatísticas
        setMonitoringStats(prev => ({
          ...prev,
          dailyMessages: prev.dailyMessages + 1
        }));

        return result;
      } else {
        throw new Error(result.error || 'Falha ao enviar mensagem');
      }
    } catch (error) {
      console.error('[WHATSAPP] Erro ao enviar mensagem:', error);
      setWhatsappError('Erro ao enviar mensagem: ' + error.message);
      throw error;
    }
  };

  // Função para marcar mensagens como lidas
  const markAsRead = async (chatId) => {
    try {
      await whatsappService.markAsRead(chatId);

      // Atualizar estado local
      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === chatId
            ? { ...chat, unread: 0 }
            : chat
        )
      );

      // Atualizar estatísticas
      setMonitoringStats(prev => ({
        ...prev,
        unreadMessages: Math.max(0, prev.unreadMessages - 1)
      }));

    } catch (error) {
      console.error('[WHATSAPP] Erro ao marcar como lida:', error);
    }
  };

  // Função para aplicar filtros nas conversas
  const getFilteredConversations = () => {
    let filtered = chats;

    // Filtro por status de leitura
    if (filterOptions.status === 'unread') {
      filtered = filtered.filter(chat => chat.unread > 0);
    } else if (filterOptions.status === 'read') {
      filtered = filtered.filter(chat => chat.unread === 0);
    }

    // Filtro por período (implementação básica)
    if (filterOptions.period !== 'all') {
      const now = new Date();
      filtered = filtered.filter(chat => {
        if (!chat.time) return false;

        switch (filterOptions.period) {
          case 'today':
            // Para implementar filtro mais preciso, seria necessário timestamp completo
            return true; // Por ora, mostrar todas
          case 'week':
            return true; // Por ora, mostrar todas
          case 'month':
            return true; // Por ora, mostrar todas
          default:
            return true;
        }
      });
    }

    // Filtro por busca de texto
    if (searchTerm) {
      filtered = filtered.filter(chat =>
        chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  // Função para configurar auto resposta
  const updateAutoResponse = async (config) => {
    try {
      if (whatsappService.configureAutoReply) {
        await whatsappService.configureAutoReply(config);
      } else {
        console.warn('[WHATSAPP] configureAutoReply não implementado');
      }
      setAutoResponseConfig(config);
    } catch (error) {
      console.error('[WHATSAPP] Erro ao configurar auto resposta:', error);
      setWhatsappError('Erro ao configurar auto resposta');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat]);

  // Demo data will be replaced by data from WhatsApp service

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        text: newMessage,
        sent: true,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        read: false
      };

      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === chats[selectedChat].id
            ? {
                ...chat,
                messages: [...chat.messages, message],
                lastMessage: newMessage,
                time: message.time
              }
            : chat
        )
      );
      setNewMessage('');

      // Simular resposta automática
      setTimeout(() => {
        const responses = [
          'Obrigado pela sua mensagem!',
          'Nossa equipe entrará em contato em breve.',
          'Recebido! Vamos analisar.',
          'Entendi. Vou verificar isso para você.',
          'Perfeito! Obrigado pelo feedback.'
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        const autoReply = {
          id: Date.now() + 1,
          text: randomResponse,
          sent: false,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          read: false
        };

        setChats(prevChats =>
          prevChats.map(chat =>
            chat.id === chats[selectedChat].id
              ? {
                  ...chat,
                  messages: [...chat.messages, autoReply],
                  lastMessage: randomResponse,
                  time: autoReply.time
                }
              : chat
          )
        );
      }, 1000 + Math.random() * 2000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Contatos - Helpers
  const filteredContacts = contacts.filter(c =>
    [c.name, c.phone, (c.tags || []).join(" ")].join(" ").toLowerCase().includes(contactSearch.toLowerCase())
  );

  const resetContactForm = () => {
    setNewContact({ name: "", phone: "", avatar: "👤", tags: [], note: "" });
    setEditingContactIndex(null);
  };

  const handleAddOrUpdateContact = () => {
    if (!newContact.name || !newContact.phone) return;
    setContacts(prev => {
      const copy = [...prev];
      if (editingContactIndex !== null) {
        copy[editingContactIndex] = { ...copy[editingContactIndex], ...newContact };
        return copy;
      }
      return [{ id: Date.now(), ...newContact }, ...copy];
    });
    setShowContactModal(false);
    resetContactForm();
  };

  const handleEditContact = (index) => {
    setEditingContactIndex(index);
    setNewContact({ ...contacts[index] });
    setShowContactModal(true);
  };

  const handleDeleteContact = (index) => {
    setContacts(prev => prev.filter((_, i) => i !== index));
  };

  const currentChat = chats[selectedChat] || chats[0] || { avatar: '👤', name: 'Sem conversas', online: false, time: '', lastMessage: '', messages: [] };

  const renderChatView = () => (
    <div className="whatsapp-container flex">
      {/* Sidebar de Conversas */}
      <div className="whatsapp-sidebar">
        {/* Header da Sidebar */}
        <div className="whatsapp-header">
          <div className="chat-stats">
            <div className="stat-item">
              <User size={16} />
              <span>{chats.length} conversas</span>
            </div>
            <div className="stat-item">
              <Bell size={16} />
              <span>{chats.reduce((sum, chat) => sum + chat.unread, 0)} não lidas</span>
            </div>
          </div>

          {/* Campo de Busca */}
          <div className="relative">
            <input
              type="text"
              placeholder="Pesquisar conversas..."
              className="whatsapp-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtros de conversas */}
          <div className="chat-controls">
            <button className="filter-btn active">Todas</button>
            <button className="filter-btn">Não lidas</button>
          </div>
        </div>

        {/* Status de conexão */}
        <div className="connection-status connected">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Conectado ao WhatsApp Business API</span>
        </div>

        {/* Lista de Conversas */}
        <div className="chat-list">
          {filteredChats.map((chat, index) => (
            <div
              key={chat.id}
              className={`chat-item ${
                selectedChat === index ? 'active' : ''
              }`}
              onClick={() => setSelectedChat(index)}
            >
              <div className="chat-avatar">
                {chat.avatar}
                {chat.online && <div className="online-indicator"></div>}
              </div>

              <div className="chat-info">
                <div className="chat-name">
                  <span>{chat.name}</span>
                  <span className="chat-time">{chat.time}</span>
                </div>
                <div className="chat-last-message">
                  <span>{chat.lastMessage}</span>
                  {chat.unread > 0 && (
                    <span className="unread-badge">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Área Principal do Chat */}
      <div className="chat-main">
        {/* Header do Chat */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-header-avatar">
              {currentChat.avatar}
            </div>
            <div className="chat-header-text">
              <h3>{currentChat.name}</h3>
              <p>
                {currentChat.online ? (
                  <>
                    <span className="text-green-600">●</span> online
                  </>
                ) : (
                  'visto por último hoje às 13:45'
                )}
              </p>
            </div>
          </div>

          <div className="chat-actions">
            <Search size={20} title="Pesquisar mensagens" />
            <MoreVertical size={20} title="Mais opções" />
          </div>
        </div>

        {/* Área de Mensagens */}
        <div className="messages-container">
          {/* Mensagem de sistema */}

          {(currentChat.messages || []).map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.sent ? 'sent' : 'received'}`}
            >
              <div className={`message-bubble ${msg.sent ? 'sent' : 'received'} ${msg.sender ? 'agent-message' : ''}`}>
                {msg.sender && !msg.sent && (
                  <div className="message-sender">
                    {msg.sender}
                    <span className="ai-status">🤖 IA</span>
                  </div>
                )}
                <div className="message-content">{msg.text}</div>
                <div className="message-meta">
                  <span>{msg.time}</span>
                  {msg.sent && (
                    <div className={`message-status ${msg.read ? 'read' : ''}`}>
                      {msg.read ?
                        <CheckCheck size={12} /> :
                        <Check size={12} />
                      }
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Indicador de digitação */}
          <div className="typing-indicator">
            <span>Texto Teste</span>
            <div className="typing-dots">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>

          <div ref={messagesEndRef} />
        </div>

        {/* Input de Mensagem */}
        <div className="message-input-container">
          <div className="input-actions">
            <button className="input-action-btn" title="Emoji">
              <Smile size={20} />
            </button>
            <button className="input-action-btn" title="Anexar">
              <Paperclip size={20} />
            </button>
          </div>

          <input
            type="text"
            placeholder="Digite uma mensagem"
            className="message-input"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />

          {newMessage.trim() ? (
            <button
              onClick={handleSendMessage}
              className="send-button"
              title="Enviar mensagem"
            >
              <Send size={18} />
            </button>
          ) : (
            <button className="input-action-btn" title="Mensagem de voz">
              <Mic size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderTaskManagerView = () => (
    <div className="flex-1 p-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Gerenciar Contatos</h2>
          <button
            onClick={() => { setShowContactModal(true); resetContactForm(); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Contato
          </button>
        </div>

        {/* Search and quick stats */}
        <div className="flex flex-col md:flex-row items-stretch gap-4 mb-6">
          <div className="flex-1">
            <input
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Pesquisar por nome, número ou tag..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-stretch gap-2 w-full md:w-auto">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center flex-1 md:w-40">
              <div className="text-xs text-gray-500">Contatos</div>
              <div className="text-lg font-semibold text-gray-800">{contacts.length}</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center flex-1 md:w-40">
              <div className="text-xs text-gray-500">Com Tags</div>
              <div className="text-lg font-semibold text-gray-800">{contacts.filter(c => (c.tags || []).length > 0).length}</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center flex-1 md:w-40">
              <div className="text-xs text-gray-500">Sem Número</div>
              <div className="text-lg font-semibold text-gray-800">{contacts.filter(c => !c.phone).length}</div>
            </div>
          </div>
        </div>

        {/* Contacts table/list */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3 font-semibold text-gray-700">Contato</th>
                <th className="text-left p-3 font-semibold text-gray-700">Telefone</th>
                <th className="text-left p-3 font-semibold text-gray-700">Tags</th>
                <th className="text-left p-3 font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">
                    Nenhum contato encontrado.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((c, index) => (
                  <tr key={c.id || index} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm">
                          {c.avatar || '👤'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{c.name || 'Sem nome'}</div>
                          {c.note && <div className="text-xs text-gray-500">{c.note}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-gray-700">{c.phone || '-'}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {(c.tags || []).map((t, i) => (
                          <span key={i} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                            {t}
                          </span>
                        ))}
                        {(c.tags || []).length === 0 && <span className="text-xs text-gray-400">Sem tags</span>}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditContact(index)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(index)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors text-red-600"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de contato */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingContactIndex !== null ? 'Editar Contato' : 'Novo Contato'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: João Silva"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: 11 99999-9999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avatar (emoji)</label>
                <input
                  value={newContact.avatar}
                  onChange={(e) => setNewContact({ ...newContact, avatar: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: 👤"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (separe por vírgula)</label>
                <input
                  value={(newContact.tags || []).join(', ')}
                  onChange={(e) => setNewContact({ ...newContact, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: cliente, vip"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={newContact.note}
                  onChange={(e) => setNewContact({ ...newContact, note: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Observações sobre o contato"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => { setShowContactModal(false); resetContactForm(); }} className="px-3 py-2 text-gray-600 hover:text-gray-800">Cancelar</button>
              <button onClick={handleAddOrUpdateContact} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderReportsView = () => {
    // Debug logs para diagnosticar problemas
    console.log('=== DEBUG REPORTS VIEW ===');
    console.log('activeView:', activeView);
    console.log('atividadeLog length:', atividadeLog.length);
    console.log('currentUser:', currentUser);
    console.log('isAdmin:', isAdmin);
    console.log('Sample logs:', atividadeLog.slice(0, 3));

    // O backend já filtra os logs baseado nas permissões do usuário
    // Não precisamos aplicar filtro adicional no frontend
    const filteredLogs = atividadeLog;

    // Estatísticas dos logs
    const logStats = {
      totalActions: filteredLogs.length,
      tasksCreated: filteredLogs.filter(log => log.action === "create_task").length,
      statusUpdates: filteredLogs.filter(log => log.action === "update_task_status").length,
      tasksDeleted: filteredLogs.filter(log => log.action === "delete_task").length,
      filesUploaded: filteredLogs.filter(log => log.action === "upload_file").length,
    };

    // Função para obter detalhes da ação
    const getActionDetails = (log) => {
      const currentTask = tasks.find(t => t.id === log.taskId);
      const taskTitle = log.taskTitle || currentTask?.titulo || 'Tarefa não encontrada';

      switch (log.action) {
        case 'create_task':
          return {
            icon: <Plus className="w-4 h-4 text-blue-600" />,
            label: 'Tarefa Criada',
            description: `Nova tarefa: "${taskTitle}"`,
            color: 'text-blue-600'
          };
        case 'update_task_status':
          {
            const statusLabelsDetail = {
              pendente: "Pendente",
              em_andamento: "Em Andamento",
              finalizado: "Finalizado",
              vencido: "Vencido/Em Atraso"
            };
            const currentStatus = currentTask?.status || 'unknown';
            const statusLabel = statusLabelsDetail[currentStatus] || currentStatus;
            return {
              icon: <CheckCircle className="w-4 h-4 text-yellow-600" />,
              label: 'Status Atualizado',
              description: `"${taskTitle}" → Status: ${statusLabel}`,
              color: 'text-yellow-600'
            };
          }
        case 'delete_task':
          return {
            icon: <Trash2 className="w-4 h-4 text-red-600" />,
            label: 'Tarefa Excluída',
            description: `Tarefa removida: "${taskTitle}"`,
            color: 'text-red-600'
          };
        case 'upload_file':
          return {
            icon: <FileText className="w-4 h-4 text-green-600" />,
            label: 'Comprovante Anexado',
            description: `Arquivo adicionado à tarefa: "${taskTitle}"`,
            color: 'text-green-600'
          };
        default:
          return {
            icon: <AlertCircle className="w-4 h-4 text-gray-600" />,
            label: 'Ação Desconhecida',
            description: `${log.action} em "${taskTitle}"`,
            color: 'text-gray-600'
          };
      }
    };

    return (
      <div className="flex-1 p-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Relatórios de Atividades</h2>
            <span className="text-sm text-gray-600">
              {isAdmin ? "Visualizando: Todas as atividades" : "Visualizando: Apenas suas atividades"}
            </span>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-gray-600 font-semibold text-sm">Total de Ações</div>
              <div className="text-2xl font-bold text-gray-800">{logStats.totalActions}</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-blue-600 font-semibold text-sm">Tarefas Criadas</div>
              <div className="text-2xl font-bold text-blue-800">{logStats.tasksCreated}</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-yellow-600 font-semibold text-sm">Status Atualizados</div>
              <div className="text-2xl font-bold text-yellow-800">{logStats.statusUpdates}</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-600 font-semibold text-sm">Tarefas Excluídas</div>
              <div className="text-2xl font-bold text-red-800">{logStats.tasksDeleted}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-600 font-semibold text-sm">Arquivos Enviados</div>
              <div className="text-2xl font-bold text-green-800">{logStats.filesUploaded}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold text-gray-700">Ação</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Tarefa</th>
                  {isAdmin && <th className="text-left p-3 font-semibold text-gray-700">Usuário</th>}
                  <th className="text-left p-3 font-semibold text-gray-700">Data/Hora</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 4 : 3} className="p-6 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-8 h-8 text-gray-400" />
                        <span>Nenhum registro de atividade encontrado.</span>
                        {!isAdmin && (
                          <span className="text-sm text-gray-400">Você só pode ver suas próprias atividades.</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const sortedLogs = filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    const reportsPagination = getPaginationData(sortedLogs, currentReportPage, tasksPerPage);
                    return reportsPagination.currentItems.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const actionDetails = getActionDetails(log);
                              return (
                                <>
                                  {actionDetails.icon}
                                  <span className={`font-medium ${actionDetails.color}`}>{actionDetails.label}</span>
                                </>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-medium text-gray-800">{log.taskTitle}</span>
                        </td>
                        {isAdmin && (
                          <td className="p-3">
                            <span className="text-gray-600">{log.userEmail}</span>
                          </td>
                        )}
                        <td className="p-3">
                          <span className="text-gray-600">
                            {log.timestamp instanceof Date
                              ? log.timestamp.toLocaleString("pt-BR")
                              : new Date(log.timestamp).toLocaleString("pt-BR")}
                          </span>
                        </td>
                      </tr>
                    ));
                  })()
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação para relatórios */}
          {(() => {
            const sortedLogs = filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const reportsPagination = getPaginationData(sortedLogs, currentReportPage, tasksPerPage);
            return (
              <PaginationControls
                currentPage={currentReportPage}
                setCurrentPage={setCurrentReportPage}
                totalPages={reportsPagination.totalPages}
                totalItems={reportsPagination.totalItems}
                startIndex={reportsPagination.startIndex}
                endIndex={reportsPagination.endIndex}
                label="registros"
              />
            );
          })()}
        </div>
      </div>
    );
  };


  const renderAgendaTributariaView = () => {
    if (!isAdmin) {
      return (
        <div className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800">Acesso Restrito</h3>
              <p className="text-gray-600">Apenas administradores podem acessar a Agenda Tributária</p>
            </div>
          </div>
        </div>
      );
    }

    const cardsData = [
      { title: "Agente 1", description: "Descrição texte", enabled: false },
      { title: "Agente 2", description: "Descrição texte", enabled: true },
      { title: "Agente 3", description: "Descrição texte", enabled: false },
      { title: "Agente 4", description: "Descrição texte", enabled: true },
    ];

    return (
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4">
            {cardsData.map((card, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border p-6 flex-1 min-w-[250px]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <RefreshCw className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{card.title}</h2>
                      <p className="text-gray-600">{card.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCardsData(prev => prev.map((c, i) => i === index ? { ...c, enabled: !c.enabled } : c))}
                    className={`mt-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      card.enabled ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100' : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                    }`}
                    title={card.enabled ? 'Desabilitar' : 'Habilitar'}
                  >
                    {card.enabled ? 'Desabilitar' : 'Habilitar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeView) {
      case "home":
        return renderChatView();
      case "tasks":
        return renderTaskManagerView();
      case "reports":
        return renderReportsView();
      case "agenda-tributaria":
        return renderAgendaTributariaView();
      default:
        return renderChatView();
    }
  };

  if (!currentUser) {
    return <div className="flex items-center justify-center h-screen">Carregando usuário...</div>;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div
        className={`sidebar bg-white border-r transition-all duration-300 flex flex-col flex-shrink-0 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Header da Sidebar */}
        <div className="sidebar-header p-4 border-b border-gray-100">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="p-1 bg-blue-100 rounded-lg">
                <CircuitBoard className="w-5 h-5 text-blue-600" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Gerenciador</h1>

              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="flex justify-center">

            </div>
          )}
        </div>

        {/* Navegação */}
        <nav className="sidebar-nav flex-1 py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 mx-0 px-3 py-3 rounded-lg text-left transition-all duration-200 group ${
                  activeView === item.id
                    ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
                title={sidebarCollapsed ? item.label : ""}
                aria-label={item.label}
              >
                <div className={`p-1.5 rounded-md transition-colors ${
                  activeView === item.id
                    ? ""
                    : "text-gray-500 group-hover:bg-gray-100 group-hover:text-gray-700"
                }`}>
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>
                {!sidebarCollapsed && (
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    <span className="font-medium text-sm truncate">{item.label}</span>
                    <span className="text-xs opacity-75 truncate">{item.description}</span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer da Sidebar */}
        <div className="p-4 border-t border-gray-100">
          {!sidebarCollapsed && (
            <button
              onClick={minimizeSidebar}
              className="w-full flex items-center justify-center gap-2 p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              title="Minimizar Sidebar"
              aria-label="Minimizar Sidebar"
            >
              <X className="w-4 h-4" aria-hidden="true" />
              <span></span>
            </button>
          )}
          {sidebarCollapsed && (
            <button
              onClick={maximizeSidebar}
              className="w-full flex items-center justify-center p-2.5 text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors shadow-sm"
              title="Maximizar Sidebar"
              aria-label="Maximizar Sidebar"
            >
              <Maximize2 className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {menuItems.find((item) => item.id === activeView)?.label || "Home"}
              </h2>
              <p className="text-sm text-gray-600">
                {menuItems.find((item) => item.id === activeView)?.description || "Dashboard"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">{currentUser.nome}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isAdmin ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {isAdmin ? "Admin" : "Colaborador"}
                </span>
                <button
                  onClick={() => navigate("/home")}
                  className="p-1 hover:bg-gray-100 rounded transition-colors text-blue-600"
                  title="Voltar para Home"
                >
                  <Home className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors text-red-600"
                  title="Sair"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {renderContent()}

        {showTaskModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" ref={modalRef}>
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Nova Tarefa</h3>
                <button onClick={() => handleCloseModal("task")} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Título da tarefa"
                    value={newTask.titulo}
                    onChange={(e) => setNewTask({ ...newTask, titulo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newTask.responsavelId}
                    onChange={(e) => {
                      const usuario = usuarios.find((u) => u.id === e.target.value);
                      setNewTask({
                        ...newTask,
                        responsavelId: e.target.value,
                        responsavel: usuario ? usuario.nome : "",
                      });
                    }}
                  >
                    <option value="">Selecione um responsável</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome} {u.id === user?.uid ? "(Eu)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento</label>
                  <input
                    type="date"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newTask.dataVencimento}
                    onChange={(e) => setNewTask({ ...newTask, dataVencimento: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Observações da tarefa"
                    value={newTask.observacoes}
                    onChange={(e) => setNewTask({ ...newTask, observacoes: e.target.value })}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1"></label>
                  <input
                    type="checkbox"
                    className="mr-2 leading-tight"
                    checked={newTask.recorrente}
                    onChange={(e) => setNewTask({ ...newTask, recorrente: e.target.checked })}
                  />
                  <span>Recorrente</span>
                </div>
                {newTask.recorrente && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequência</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={newTask.frequencia}
                      onChange={(e) => setNewTask({ ...newTask, frequencia: e.target.value })}
                    >
                      <option value="mensal">Mensal</option>
                      <option value="semanal">Semanal</option>
                      <option value="diario">Diário</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => handleCloseModal("task")}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateTask}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  Criar Tarefa
                </button>
              </div>
            </div>
          </div>
        )}

        {showTaskDetails && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-sm max-h-sm overflow-y-auto mx-4">
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-full ${statusColors[selectedTask.status]}`}>
                    {statusIcons[selectedTask.status]}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{selectedTask.titulo}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedTask.status]} mt-1`}>
                      {statusLabels[selectedTask.status]}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleCloseModal("details")}
                  className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                  title="Fechar detalhes"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4">
                <div className="space-y-4">
                  {/* Informações da Tarefa */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Informações da Tarefa
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-600 mb-1">Responsável:</span>
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-sm font-medium text-gray-800">{selectedTask.responsavel}</span>
                          {selectedTask.responsavelId === user?.uid && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">Você</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-600 mb-1">Data de Vencimento:</span>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className={`text-sm font-medium ${
                            selectedTask.dataVencimento && new Date(selectedTask.dataVencimento) < new Date() && selectedTask.status !== 'finalizado'
                              ? 'text-red-600' : 'text-gray-800'
                          }`}>
                            {selectedTask.dataVencimento ? new Date(selectedTask.dataVencimento).toLocaleDateString("pt-BR") : "Data não definida"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-600 mb-1">Status:</span>
                        {isAdmin || selectedTask.responsavelId === user?.uid ? (
                          <select
                            className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                            value={selectedTask.status}
                            onChange={(e) => handleUpdateTaskStatus(selectedTask.id, e.target.value)}
                          >
                            <option value="pendente">Pendente</option>
                            <option value="em_andamento">Em Andamento</option>
                            <option value="finalizado">Finalizado</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedTask.status]} w-fit`}>
                            {statusIcons[selectedTask.status]}
                            <span className="ml-1">{statusLabels[selectedTask.status]}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-600 mb-1">Data de Criação:</span>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-sm font-medium text-gray-800">
                            {selectedTask.dataCriacao ? new Date(selectedTask.dataCriacao).toLocaleDateString("pt-BR") : "Data não definida"}
                          </span>
                        </div>
                      </div>

                      {selectedTask.recorrente && (
                        <div className="flex flex-col md:col-span-2">
                          <span className="text-xs font-medium text-blue-700 mb-1">Tarefa Recorrente:</span>
                          <span className="text-sm font-medium text-blue-800 capitalize bg-blue-50 px-2 py-1 rounded w-fit">{selectedTask.frequencia}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Observações */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      Observações
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-md border-l-4 border-blue-500">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {selectedTask.observacoes || "Nenhuma observação foi adicionada para esta tarefa."}
                      </p>
                    </div>
                  </div>

                  {/* Comprovantes */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-green-600" />
                      Comprovantes
                      <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {selectedTask.comprovantes?.length || 0} arquivo(s)
                      </span>
                    </h4>

                    {(isAdmin || selectedTask.responsavelId === user?.uid) && (
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <label className="block text-xs font-medium text-blue-800 mb-2">
                          Adicionar novo comprovante:
                        </label>
                        <input
                          type="file"
                          className="w-full p-2 text-sm border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          onChange={(e) => handleFileUpload(selectedTask.id, e.target.files[0])}
                          accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                        />
                        <p className="text-xs text-blue-600 mt-1">
                          Formatos aceitos: JPG, PNG, PDF, DOC, XLS, TXT, CSV (máx. 10MB)
                        </p>

                        {/* Preview e controles de upload inline */}
                        {selectedFile && selectedFile.taskId === selectedTask.id && (
                          <div className="mt-4 p-4 bg-white border border-blue-300 rounded-lg">
                            <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                              <Upload className="w-4 h-4 text-blue-600" />
                              Preview do Arquivo
                            </h5>

                            {fileError ? (
                              <div className="text-red-600 mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                <span className="text-sm">{fileError}</span>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex-shrink-0">
                                    {getFileIcon(filePreview?.fileType || selectedFile.file.type)}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800">
                                      {filePreview?.name || selectedFile.file.name}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      {formatFileSize(filePreview?.size || selectedFile.file.size)}
                                    </p>
                                  </div>
                                </div>

                                {filePreview?.type === "image" && (
                                  <div className="border rounded-lg overflow-hidden">
                                    <img
                                      src={filePreview.url}
                                      alt="Preview"
                                      className="max-w-full max-h-32 mx-auto"
                                    />
                                  </div>
                                )}

                                {/* Barra de progresso */}
                                {isUploading && (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-gray-600">Enviando arquivo...</span>
                                      <span className="text-blue-600 font-medium">{uploadProgress}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-300 ${
                                          uploadProgress === 100
                                            ? "bg-green-500"
                                            : "bg-blue-500"
                                        }`}
                                        style={{ width: `${uploadProgress}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}

                                {/* Status de upload */}
                                {uploadStatus === 'completed' && (
                                  <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">Arquivo enviado com sucesso!</span>
                                  </div>
                                )}

                                {uploadStatus === 'error' && (
                                  <div className="flex items-center gap-2 text-red-600">
                                    <XCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">Erro no upload</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Botões de ação */}
                            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-200">
                              <button
                                onClick={handleCancelUpload}
                                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                                disabled={isUploading}
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={handleConfirmUpload}
                                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-1"
                                disabled={isUploading || !!fileError}
                              >
                                {isUploading ? (
                                  <>
                                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                    Enviando...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-3 h-3" />
                                    Confirmar Upload
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedTask.comprovantes && selectedTask.comprovantes.length > 0 ? (
                        selectedTask.comprovantes.map((proof, index) => {
                          // Lidar com comprovantes antigos (strings) e novos (objetos)
                          const fileUrl = typeof proof === 'string' ? proof : proof.url;
                          const fileName = typeof proof === 'string' ? proof.split("/").pop() : proof.name;
                          const fileType = typeof proof === 'string' ? 'unknown' : proof.type;
                          const fileSize = typeof proof === 'string' ? null : proof.size;
                          const uploadDate = typeof proof === 'string' ? null : proof.uploadDate;
                          const uploadedBy = typeof proof === 'string' ? null : proof.uploadedBy;

                          return (
                            <div key={index} className="group flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 border border-gray-200">
                              <div className="flex-shrink-0">
                                {getFileIcon(fileType)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium text-gray-800 truncate" title={fileName}>
                                    {fileName}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                  {fileSize && (
                                    <span className="flex items-center gap-1">
                                      <File className="w-3 h-3" />
                                      {formatFileSize(fileSize)}
                                    </span>
                                  )}
                                  {uploadDate && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {new Date(uploadDate).toLocaleDateString('pt-BR')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = fileUrl;
                                    link.download = fileName;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                  className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-full transition-colors"
                                  title="Baixar arquivo"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-6">
                          <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-xs">
                            Nenhum comprovante anexado ainda.
                          </p>
                          {(isAdmin || selectedTask.responsavelId === user?.uid) && (
                            <p className="text-gray-400 text-xs mt-1">
                              Use o campo acima para adicionar arquivos.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 p-4 border-t bg-gray-50">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Bell className="w-3 h-3" />
                  {selectedTask.dataVencimento && new Date(selectedTask.dataVencimento) < new Date() && selectedTask.status !== 'finalizado' ? (
                    <span className="text-red-600 font-medium">⚠️ Tarefa em atraso</span>
                  ) : selectedTask.dataVencimento && new Date(selectedTask.dataVencimento).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000 && selectedTask.status !== 'finalizado' ? (
                    <span className="text-yellow-600 font-medium">⏰ Vence em breve</span>
                  ) : (
                    <span>Última atualização: {new Date().toLocaleDateString('pt-BR')}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCloseModal("details")}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Fechar
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => handleEditTask(selectedTask)}
                        className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-2"
                      >
                        <Edit className="w-3 h-3" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteTask(selectedTask.id)}
                        className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-3 h-3" />
                        Excluir
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showEditTaskModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" ref={modalRef}>
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Editar Tarefa</h3>
                <button onClick={() => handleCloseModal("edit")} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Título da tarefa"
                    value={editTask.titulo}
                    onChange={(e) => setEditTask({ ...editTask, titulo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editTask.responsavelId}
                    onChange={(e) => {
                      const usuario = usuarios.find((u) => u.id === e.target.value);
                      setEditTask({
                        ...editTask,
                        responsavelId: e.target.value,
                        responsavel: usuario ? usuario.nome : "",
                      });
                    }}
                  >
                    <option value="">Selecione um responsável</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome} {u.id === user?.uid ? "(Eu)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento</label>
                  <input
                    type="date"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editTask.dataVencimento}
                    onChange={(e) => setEditTask({ ...editTask, dataVencimento: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Observações da tarefa"
                    value={editTask.observacoes}
                    onChange={(e) => setEditTask({ ...editTask, observacoes: e.target.value })}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1"></label>
                  <input
                    type="checkbox"
                    className="mr-2 leading-tight"
                    checked={editTask.recorrente}
                    onChange={(e) => setEditTask({ ...editTask, recorrente: e.target.checked })}
                  />
                  <span>Recorrente</span>
                </div>
                {editTask.recorrente && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequência</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={editTask.frequencia}
                      onChange={(e) => setEditTask({ ...editTask, frequencia: e.target.value })}
                    >
                      <option value="mensal">Mensal</option>
                      <option value="semanal">Semanal</option>
                      <option value="diario">Diário</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => handleCloseModal("edit")}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateTask}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  Atualizar Tarefa
                </button>
              </div>
            </div>
          </div>
        )}

        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-xs mx-3 p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirmar Logout</h3>
              <p className="text-gray-600 text-sm mb-4 text-center">Tem certeza de que deseja sair?</p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => handleCloseModal("logout")}
                  className="px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dash;
