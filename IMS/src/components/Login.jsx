// IMS/src/components/Login.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin } from '../services/api';

function Login() {
  const API_BASE = 'http://localhost:3000/api';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Состояния для регистрации
  const [mode, setMode] = useState('login'); // 'login' или 'register'
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCode, setRegCode] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const response = await apiLogin({ username, password });
      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error or server is unreachable');
      console.error(err);
    }
  };

  const handleRegisterRequest = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: regUsername, password: regPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setRegSuccess(true);
        setError('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Network error or server is unreachable');
    }
  };

  const handleConfirmRegistration = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/auth/confirm-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: regUsername, confirmation_code: regCode }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Registration successful! You can now log in.');
        setMode('login');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Network error or server is unreachable');
    }
  };

  return (
    <div className="login-container"> {/* <= Вот этот класс */}
      <div className="login-box">     {/* <= И этот */}
        {mode === 'login' && (
          <>
            <h2 className="login-title">Вход в IMS</h2>
            {error && <p className="login-error">{error}</p>}
            <form onSubmit={handleLogin} className="login-form">
              <div>
                <label>Имя пользователя:</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Пароль:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit">Войти</button>
              <button type="button" onClick={() => setMode('register')}>Регистрация</button>
            </form>
          </>
        )}

        {mode === 'register' && (
          <div>
            {!regSuccess ? (
              <>
                <h2 className="login-title">Запрос регистрации</h2>
                {error && <p className="login-error">{error}</p>}
                <form onSubmit={handleRegisterRequest} className="login-form">
                  <div>
                    <label>Имя пользователя:</label>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label>Пароль:</label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit">Запросить регистрацию</button>
                  <button type="button" onClick={() => setMode('login')}>Назад</button>
                </form>
              </>
            ) : (
              <>
                <h2 className="login-title">Введите код подтверждения</h2>
                {error && <p className="login-error">{error}</p>}
                <form onSubmit={handleConfirmRegistration} className="login-form">
                  <div>
                    <label>Код подтверждения:</label>
                    <input
                      type="text"
                      value={regCode}
                      onChange={(e) => setRegCode(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit">Подтвердить регистрацию</button>
                  <button type="button" onClick={() => setMode('login')}>Назад</button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;