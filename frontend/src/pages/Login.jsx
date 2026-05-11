import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useUserContext } from '../context/UserProvider';

const LOGIN_URL = 'http://localhost:8000/booked/api/login/';
const USER_URL  = 'http://localhost:8000/booked/api/user/';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [erro, setErro]         = useState('');
    const navigate                = useNavigate();
    const { setUser }             = useUserContext();

    const handleLogin = (e) => {
        e.preventDefault();
        setErro('');
        axios.post(LOGIN_URL, { username, password }, { withCredentials: true })
            .then(() => {
                // Depois do login, vai buscar os dados do utilizador ao backend
                // e guarda-os no contexto global
                return axios.get(USER_URL, { withCredentials: true });
            })
            .then(res => {
                setUser(res.data);
                navigate('/');
            })
            .catch(() => {
                setErro('Credenciais inválidas. Tenta novamente.');
            });
    };

    return (
        <div className="container mt-5" style={{ maxWidth: '420px' }}>
            <h2 className="mb-4">Entrar</h2>

            {erro && <div className="alert alert-danger">{erro}</div>}

            <form onSubmit={handleLogin}>
                <div className="mb-3">
                    <label className="form-label">Username</label>
                    <input
                        type="text"
                        className="form-control"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                        type="password"
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-dark w-100">Entrar</button>
            </form>

            <p className="mt-3 text-center">
                Não tens conta? <Link to="/signup">Regista-te aqui</Link>
            </p>
        </div>
    );
};

export default Login;