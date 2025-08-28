import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import { userService } from "../services/api";
import "../styles/Auth.css";

// URL da API - pode ser movida para um arquivo de configuração
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Cadastro = () => {
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [codigoAdmin, setCodigoAdmin] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Se o usuário já está logado, redirecionar para home
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const fazerCadastro = async () => {
    if (isLoading) return; // Prevenir múltiplos cliques
    
    try {
      setIsLoading(true);
      setError("");
      setSuccessMessage("");

      // Validações
      if (!nomeCompleto.trim() || !email.trim() || !senha || !confirmSenha) {
        setError("Por favor, preencha todos os campos.");
        return;
      }
      
      // Validar nome completo (pelo menos 2 palavras)
      if (nomeCompleto.trim().split(' ').length < 2) {
        setError("Por favor, insira seu nome completo (nome e sobrenome).");
        return;
      }
      
      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError("Por favor, insira um email válido.");
        return;
      }
      
      // Validar senhas
      if (senha !== confirmSenha) {
        setError("As senhas não coincidem.");
        return;
      }
      
      if (senha.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres.");
        return;
      }
      
      // Validar força da senha
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(senha)) {
        setError("A senha deve conter pelo menos: 1 letra maiúscula, 1 minúscula e 1 número.");
        return;
      }

      // Determinar cargo baseado no código administrativo
      const cargo = codigoAdmin.trim() === "adm7258" ? "admin" : "usuario";
      
      const userData = {
        nomeCompleto: nomeCompleto.trim(),
        email: email.toLowerCase().trim(),
        password: senha,
        cargo: cargo
      };

      console.log("[CADASTRO] Iniciando registro na API...", { email: userData.email, cargo });

      // Registrar usuário via API
      const response = await userService.register(userData);

      if (response.error) {
        throw new Error(response.error);
      }

      // Se o cadastro foi bem-sucedido, fazer login automático
      setSuccessMessage("Cadastro realizado com sucesso! Fazendo login...");
      
      try {
        // Fazer login automático imediatamente
        await login(userData.email, userData.password);
        console.log("[CADASTRO] Login automático realizado com sucesso!");
        // A navegação para /home é feita pelo AuthContext
      } catch (loginError) {
        console.error("[CADASTRO] Erro no login automático:", loginError);
        // Se o login automático falhar, redirecionar para login manual
        setSuccessMessage("Cadastro realizado! Por favor, faça login para continuar.");
        setTimeout(() => navigate("/"), 3000); // Redirecionar para login em vez de /home
      }

    } catch (error) {
      console.error("[CADASTRO] Erro no cadastro:", error);
      
      // Tratar diferentes tipos de erro
      let errorMessage = "Erro ao cadastrar. Tente novamente.";
      
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.error || "Dados inválidos. Verifique as informações.";
      } else if (error.response?.status === 409) {
        errorMessage = "Este email já está cadastrado. Tente fazer login.";
      } else if (error.response?.status === 500) {
        errorMessage = "Erro interno do servidor. Tente novamente mais tarde.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-logo-container">
        <img src="/imgs/Calendario.png" alt="Logo" className="auth-logo" />
      </div>
      <div className="auth-card">
        <div className="card-body">
          {error && <div className="auth-alert-danger" role="alert">{error}</div>}
          {successMessage && <div className="auth-alert-success" role="alert">{successMessage}</div>}
          
          <div className="auth-form-group">
            <label htmlFor="nomeCompleto">Nome Completo</label>
            <div className="auth-input-group">
              <input
                type="text"
                className="auth-form-control"
                id="nomeCompleto"
                placeholder="Digite seu nome completo"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                disabled={isLoading}
                minLength={3}
                maxLength={100}
              />
              <span className="auth-input-icon"><i className="bi bi-person-fill"></i></span>
            </div>
          </div>
          
          <div className="auth-form-group">
            <label htmlFor="email">Email</label>
            <div className="auth-input-group">
              <input
                type="email"
                className="auth-form-control"
                id="email"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                maxLength={100}
                autoComplete="email"
              />
              <span className="auth-input-icon"><i className="bi bi-envelope-fill"></i></span>
            </div>
          </div>
          
          <div className="auth-form-group">
            <label htmlFor="password">Senha</label>
            <div className="auth-input-group">
              <input
                type="password"
                className="auth-form-control"
                id="password"
                placeholder="Digite sua senha (min. 6 caracteres)"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={isLoading}
                minLength={6}
                maxLength={50}
                autoComplete="new-password"
              />
              <span className="auth-input-icon"><i className="bi bi-lock-fill"></i></span>
            </div>
            <small className="text-muted">A senha deve ter pelo menos 6 caracteres, com letra maiúscula, minúscula e número.</small>
          </div>
          
          <div className="auth-form-group">
            <label htmlFor="confirmPassword">Confirmar Senha</label>
            <div className="auth-input-group">
              <input
                type="password"
                className="auth-form-control"
                id="confirmPassword"
                placeholder="Confirme sua senha"
                value={confirmSenha}
                onChange={(e) => setConfirmSenha(e.target.value)}
                disabled={isLoading}
                minLength={6}
                maxLength={50}
                autoComplete="new-password"
              />
              <span className="auth-input-icon">
                <i className={`bi ${confirmSenha && (senha === confirmSenha ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger')}`}></i>
              </span>
            </div>
          </div>
          
          <div className="auth-form-group">
            <label htmlFor="codigoAdmin">Código Administrativo (Opcional)</label>
            <div className="auth-input-group">
              <input
                type="text"
                className="auth-form-control"
                id="codigoAdmin"
                placeholder="Digite o código administrativo (se aplicável)"
                value={codigoAdmin}
                onChange={(e) => setCodigoAdmin(e.target.value)}
                disabled={isLoading}
                maxLength={20}
              />
              <span className="auth-input-icon">
                <i className={`bi ${codigoAdmin.trim() === 'adm7258' ? 'bi-shield-check text-success' : 'bi-shield'}`}></i>
              </span>
            </div>
            <small className="text-muted">Deixe em branco para cadastro como usuário comum. Use o código especial para acesso administrativo.</small>
          </div>
          
          <button 
            className="auth-btn-primary w-100 mb-3" 
            onClick={fazerCadastro}
            disabled={isLoading}
            type="button"
          >
            {isLoading ? (
              <><i className="bi bi-arrow-clockwise" style={{animation: 'spin 1s linear infinite'}}></i> Cadastrando...</>
            ) : (
              <><i className="bi bi-person-plus-fill"></i> Cadastrar</>
            )}
          </button>
          
          <div className="auth-separator-line"></div>
          
          <div className="auth-link-container">
            <Link 
              to="/" 
              className="auth-btn-professional"
              style={{ pointerEvents: isLoading ? 'none' : 'auto', opacity: isLoading ? 0.6 : 1 }}
            >
              Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cadastro;
