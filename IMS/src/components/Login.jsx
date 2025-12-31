import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import backgroundImage from './back.jpg'
function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Состояния для регистрации (без телефона)
  const [mode, setMode] = useState('login');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  // const [regPhone, setRegPhone] = useState(''); // <= Убираем телефон
  const [regCode, setRegCode] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  const API_BASE = '/api';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      setError('');
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
        setLoading(false);
      } else {
        setError(data.error || 'Login failed');
        setLoading(false); // <= Выключаем загрузку при ошибке
      }
    } catch (err) {
      setError('Network error or server is unreachable');
      console.error(err);
      setLoading(false); // <= Выключаем загрузку при ошибке
    }
  };

  const handleRegisterRequest = async (e) => {
    e.preventDefault();
    setLoading(true); // <= Включаем загрузку
    try {
      setError(''); // <= Очищаем ошибку
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: regUsername, password: regPassword }), // <= Убираем phone
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
    } finally {
      setLoading(false); // <= Выключаем загрузку
    }
  };

  const handleConfirmRegistration = async (e) => {
    e.preventDefault();
    setLoading(true); // <= Включаем загрузку
    try {
      setError(''); // <= Очищаем ошибку
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
    } finally {
      setLoading(false); // <= Выключаем загрузку
    }
  };

  return (
    <div className="login-container">
      {/* <<<--- Вот тут добавим спиннер --->>> */}

      {loading && <LoadingSpinner message={mode === 'login' ? 'Вход в систему...' : mode === 'register' && !regSuccess ? 'Запрос регистрации...' : 'Подтверждение регистрации...'} />}
      
      <div className="login-box">
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
                  {/* Убираем поле телефона */}
                  <button type="submit">Запросить регистрацию</button>
                  <div>
                    <a href="#!" onClick={() => setMode('login')} style={{ display: 'block', marginTop: '10px' }}>
                      Назад
                    </a>
                  </div>
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
                  <div>
                    <a href="#!" onClick={() => setMode('login')} style={{ display: 'block', marginTop: '10px' }}>
                      Назад
                    </a>
                  </div>
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