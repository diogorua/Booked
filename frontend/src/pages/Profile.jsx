import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUserContext } from '../context/UserProvider';

const PROFILE_URL = 'http://localhost:8000/booked/api/profile/';
const BASE_URL    = 'http://localhost:8000';

const Profile = () => {
    const { user }              = useUserContext();
    const [profile, setProfile] = useState(null);
    const navigate              = useNavigate();

    useEffect(() => {
        axios.get(PROFILE_URL, { withCredentials: true })
            .then(res => setProfile(res.data))
            .catch(err => console.error('Erro ao carregar perfil:', err));
    }, []);

    if (!user) {
        return (
            <div className="container mt-5">
                <p>Precisas de estar autenticado para ver o teu perfil.</p>
                <button className="btn btn-dark" onClick={() => navigate('/login')}>Entrar</button>
            </div>
        );
    }

    return (
    <div className="container mt-5">

        {/* Cabeçalho com botão editar */}
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>O meu perfil</h2>
            <button className="btn btn-outline-dark btn-lg">Editar perfil</button>
        </div>

        {/* Imagem + info lado a lado */}
        <div className="d-flex align-items-center gap-4">
            {profile && (
                <img
                    src={BASE_URL + profile.imagem}
                    alt="Foto de perfil"
                    className="rounded-circle"
                    style={{ width: '220px', height: '220px', objectFit: 'cover' }}
                />
            )}

            <div className="fs-5">
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Email:</strong> {user.email}</p>
                {user.role === 'Client' && (
                    <p><strong>Plano:</strong> {user.plano}</p>
                )}
                {user.role === 'Admin' && (
                    <span className="badge bg-dark">Administrador</span>
                )}
            </div>
        </div>

    </div>
);
};

export default Profile;