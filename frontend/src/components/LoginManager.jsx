import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUserContext } from '../context/UserProvider';

const USER_URL   = 'http://localhost:8000/booked/api/user/';
const LOGOUT_URL = 'http://localhost:8000/booked/api/logout/';

const LoginManager = () => {
    const { user, setUser } = useUserContext();
    const navigate          = useNavigate();

    // Estados para controlar o menu dropdown
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Verifica a sessão ao iniciar
    useEffect(() => {
        axios.get(USER_URL, { withCredentials: true })
            .then(res => setUser(res.data))
            .catch(() => setUser(null));
    }, [setUser]);

    // Lógica para fechar o dropdown se o utilizador clicar fora dele
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        axios.get(LOGOUT_URL, { withCredentials: true })
            .then(() => {
                setUser(null);
                setIsDropdownOpen(false);
                navigate('/');
            })
            .catch(() => console.log('Logout failed'));
    };

    if (user) {
        return (
            <div className="d-flex align-items-center gap-3">

                <button
                    className="btn btn-light fw-bold shadow-sm"
                    onClick={() => navigate('/bookform')}
                    style={{ color: "var(--dark-brown)" }}
                >
                    + Vender Livro
                </button>

                <div className="position-relative" ref={dropdownRef}>
                    <button
                        className="btn btn-outline-gold d-flex align-items-center gap-2"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        style={{ borderRadius: '50px', padding: '6px 16px', backgroundColor: isDropdownOpen ? 'var(--gold)' : 'transparent', color: isDropdownOpen ? 'var(--dark-brown)' : 'var(--gold)' }}
                    >
                        <span className="fw-bold">{user.username}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                            <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
                        </svg>
                    </button>

                    {isDropdownOpen && (
                        <div
                            className="dropdown-menu show position-absolute end-0 mt-2 shadow-lg border-0"
                            style={{
                                backgroundColor: "var(--cream)",
                                minWidth: '220px',
                                borderRadius: '10px'
                            }}
                        >
                            <button
                                className="dropdown-item py-2"
                                onClick={() => { setIsDropdownOpen(false); navigate('/profile'); }}
                            >
                                O meu perfil
                            </button>
                            <button
                                className="dropdown-item py-2"
                                onClick={() => { setIsDropdownOpen(false); navigate('/bookshelf'); }}
                            >
                                A minha estante
                            </button>
                            <button
                                className="dropdown-item py-2"
                                onClick={() => { setIsDropdownOpen(false); navigate('/favorites'); }}
                            >
                                Lista de favoritos
                            </button>

                            <div className="dropdown-divider border-secondary opacity-25"></div>

                            <button
                                className="dropdown-item text-danger py-2 fw-bold"
                                onClick={handleLogout}
                            >
                                Sair
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="d-flex gap-3">
            <button
                className="btn btn-outline-gold px-4 fw-bold"
                onClick={() => navigate('/login')}
                style={{ borderRadius: '50px' }}
            >
                Entrar
            </button>
            <button
                className="btn px-4 fw-bold"
                style={{ backgroundColor: "var(--gold)", color: "var(--dark-brown)", borderRadius: '50px' }}
                onClick={() => navigate('/signup')}
            >
                Registar
            </button>
        </div>
    );
};

export default LoginManager;