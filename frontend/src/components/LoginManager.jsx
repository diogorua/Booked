import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUserContext } from '../context/UserProvider';

const USER_URL   = 'http://localhost:8000/booked/api/user/';
const LOGOUT_URL = 'http://localhost:8000/booked/api/logout/';

const LoginManager = () => {
    const { user, setUser } = useUserContext();
    const navigate          = useNavigate();

    // Ao montar o componente, verifica se já há sessão ativa no backend
    useEffect(() => {
        axios.get(USER_URL, { withCredentials: true })
            .then(res => setUser(res.data))
            .catch(() => setUser(null));
    }, []);

    const handleLogout = () => {
        axios.get(LOGOUT_URL, { withCredentials: true })
            .then(() => setUser(null))
            .catch(() => console.log('Logout failed'));
    };

    if (user) {
    return (
        <div className="d-flex align-items-center gap-2">
            <span className="text-white">Olá, <strong>{user.username}</strong>!</span>
            <button
                className="btn btn-outline-gold me-2"
                onClick={() => navigate('/profile')}
            >
                Perfil
            </button>
            <button
                className="btn"
                style={{ backgroundColor: "var(--gold)" }}
                onClick={handleLogout}
            >
                Logout
            </button>
        </div>
    );
    }

    return (
        <div className="d-flex gap-2">
            <button
                className="btn btn-outline-gold me-2"
                onClick={() => navigate('/login')}
            >
                Entrar
            </button>
            <button
                className="btn"
                style={{ backgroundColor: "var(--gold)" }}
                onClick={() => navigate('/signup')}
            >
                Registar
            </button>
        </div>
    );
};

export default LoginManager;