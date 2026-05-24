import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import {useUserContext} from '../context/UserProvider';

const PROFILE_URL = 'http://localhost:8000/booked/api/profile/';

const getCSRFToken = () => {
    return document.cookie.split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
}

const DISTRITOS = [
    'Aveiro', 'Beja', 'Braga', 'Bragança', 'Castelo Branco', 'Coimbra',
    'Évora', 'Faro', 'Guarda', 'Leiria', 'Lisboa', 'Portalegre', 'Porto',
    'Santarém', 'Setúbal', 'Viana do Castelo', 'Vila Real', 'Viseu', 'Açores', 'Madeira'
];

const Profile = () => {
    // Injetado o setUser aqui para atualizar o estado global do site
    const {user, setUser} = useUserContext();
    const [profile, setProfile] = useState(null);
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [biografia, setBiografia] = useState('');
    const [distrito, setDistrito] = useState('');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const LoadProfile = () => {
        axios.get(PROFILE_URL, {withCredentials: true})
            .then(res => {
                setProfile(res.data);
                setBiografia(res.data.biografia || '');
                setDistrito(res.data.distrito || '');
            })
            .catch(err => console.error('Erro ao carregar perfil:', err));
    };

    const handleUpgrade = () => {
        axios.put(PROFILE_URL, {plano: 'Premium'}, {
            withCredentials: true,
            headers: {'X-CSRFToken': getCSRFToken()}
        })
            .then(() => {
                setShowUpgradeModal(false);
                LoadProfile();
                return axios.get('http://localhost:8000/booked/api/user/', {withCredentials: true});
            })
            .then(resUser => {
                setUser(resUser.data);
                alert("Parabéns! A tua conta foi atualizada para Premium com sucesso! 💎");
            })
            .catch(error => {
                console.error("Erro ao fazer upgrade:", error);
                alert("Não foi possível processar o upgrade.");
            });
    };

    const handleDowngrade = () => {
        if (!window.confirm("Tens a certeza que queres cancelar o plano Premium e voltar ao plano Base?")) return;

        axios.put(PROFILE_URL, {plano: 'Base'}, {
            withCredentials: true,
            headers: {'X-CSRFToken': getCSRFToken()}
        })
            .then(() => {
                LoadProfile();
                return axios.get('http://localhost:8000/booked/api/user/', {withCredentials: true});
            })
            .then(resUser => {
                setUser(resUser.data);
                alert("O teu plano foi revertido para Base.");
            })
            .catch(error => {
                console.error("Erro ao cancelar premium:", error);
                alert("Não foi possível cancelar o plano Premium.");
            });
    };

    useEffect(() => {
        LoadProfile();
    }, []);

    if (!user) {
        return (
            <div className="container mt-5 text-center">
                <p className="lead text-muted">Precisas de estar autenticado para ver o teu perfil.</p>
                <button className="btn btn-outline-gold px-4" onClick={() => navigate('/login')}>Entrar</button>
            </div>
        );
    }

    const handleImageSelection = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setImageFile(null);
            setPreviewUrl('');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        if (imageFile) formData.append('imagem', imageFile);
        formData.append('biografia', biografia);
        formData.append('distrito', distrito);

        try {
            await axios.put(PROFILE_URL, formData, {
                withCredentials: true,
                headers: {'X-CSRFToken': getCSRFToken(), 'Content-Type': 'multipart/form-data'}
            });
            setIsEditing(false);
            setImageFile(null);
            setPreviewUrl('');
            LoadProfile();
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            alert("Erro ao atualizar o perfil.");
        }
    };

    const cancelEdition = () => {
        setIsEditing(false);
        setImageFile(null);
        setPreviewUrl('');
    };

    const avatarSrc = previewUrl
        ? previewUrl
        : (profile?.imagem && !profile.imagem.includes('default.png')
            ? profile.imagem
            : 'https://res.cloudinary.com/dub0qps5u/image/upload/v1778581892/default_nmibr3.png');

    return (
        <div className="container mt-5 mb-5">
            <h2 className="mb-5 pb-3 border-bottom border-secondary border-opacity-25 fw-bold"
                style={{color: "var(--dark-brown)"}}>
                Configurações de Perfil
            </h2>

            <div className="row">
                <div className="col-md-4 col-lg-3 d-flex flex-column align-items-center mb-5 mb-md-0">
                    <img
                        src={avatarSrc}
                        alt="Foto de perfil"
                        className="rounded-circle shadow-sm mb-4"
                        style={{width: '210px', height: '210px', objectFit: 'cover', border: '4px solid white'}}
                    />
                    <div
                        className="bg-white rounded-4 shadow-sm p-4 text-center border border-secondary border-opacity-10"
                        style={{maxWidth: '280px'}}
                    >
                        <h4
                            className="fw-bold mb-2"
                            style={{
                                color: "var(--dark-brown)",
                                letterSpacing: '-0.5px'
                            }}
                        >
                            {user.username}
                        </h4>

                        <div className="d-flex justify-content-center align-items-center gap-2 mb-3">
                            {profile?.vendedor_top && <span className="badge bg-warning text-dark">Vendedor Top</span>}

                            {profile?.is_premium_viewer || user?.role === 'Admin' ? (
                                <div className="text-warning small">
                                    {"★".repeat(Math.round(profile?.media_estrelas || 0))}
                                    {"☆".repeat(5 - Math.round(profile?.media_estrelas || 0))}
                                    <span className="text-muted ms-1">({profile?.total_avaliacoes || 0})</span>
                                </div>
                            ) : (
                                <div className="badge bg-light text-muted border px-2 py-1 small">
                                    Acesso premium
                                </div>
                            )}
                        </div>

                        <span
                            className="badge rounded-pill px-3 py-2 mb-3"
                            style={{
                                backgroundColor: '#f5eee6',
                                color: '#6b4f3b',
                                fontWeight: '500'
                            }}
                        >
                            {user.role === 'Admin'
                                ? 'Administrador'
                                : `Plano ${user.plano}`}
                        </span>

                        {profile?.distrito && (
                            <div className="text-muted mb-3" style={{fontSize: '0.95rem'}}>
                                📍 {profile.distrito}
                            </div>
                        )}

                        {profile?.biografia ? (
                            <p
                                className="mb-0 text-muted"
                                style={{
                                    fontSize: '0.92rem',
                                    lineHeight: '1.6',
                                    fontStyle: 'italic'
                                }}
                            >
                                “{profile.biografia}”
                            </p>
                        ) : (
                            <p className="mb-0 text-muted fst-italic" style={{fontSize: '0.9rem'}}>
                                Sem biografia definida
                            </p>
                        )}
                    </div>
                </div>

                <div className="col-md-8 col-lg-7 text-start ps-md-3">

                    {isEditing ? (
                        <>
                            <h5 className="fw-bold mb-4 text-dark">Editar Perfil</h5>
                            <form onSubmit={handleSave}
                                  className="p-4 border rounded border-secondary border-opacity-25 bg-white shadow-sm"
                                  style={{maxWidth: '600px'}}>
                                <div className="mb-4">
                                    <label className="form-label fw-bold text-dark">Foto de perfil</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept="image/*"
                                        onChange={handleImageSelection}
                                    />
                                    <div className="form-text mt-2 text-muted">Formatos recomendados: JPG, PNG.</div>
                                </div>
                                <div className="mb-4">
                                    <label className="form-label fw-bold text-dark">Distrito</label>
                                    <select className="form-select" value={distrito}
                                            onChange={(e) => setDistrito(e.target.value)}>
                                        <option value="">Seleciona o teu distrito</option>
                                        {DISTRITOS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="form-label fw-bold text-dark">Biografia</label>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        maxLength={300}
                                        placeholder="Conta algo sobre ti..."
                                        value={biografia}
                                        onChange={(e) => setBiografia(e.target.value)}
                                    />
                                    <div className="form-text text-muted">{biografia.length}/300 caracteres</div>
                                </div>
                                <div className="d-flex gap-2">
                                    <button type="submit" className="btn btn-dark px-4 fw-medium">Guardar</button>
                                    <button type="button" className="btn btn-light border px-4 fw-medium"
                                            onClick={cancelEdition}>Cancelar
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="fw-bold mb-0 text-dark">Detalhes da Conta</h5>
                                <button
                                    className="btn btn-outline-dark btn-sm rounded-pill px-4 fw-medium"
                                    onClick={() => setIsEditing(true)}
                                >
                                    Editar Perfil
                                </button>
                            </div>

                            <div className="d-flex flex-column gap-4" style={{maxWidth: '600px'}}>
                                <div className="pb-3 border-bottom border-secondary border-opacity-10">
                                    <label className="text-muted text-uppercase fw-bold d-block mb-1"
                                           style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>Username</label>
                                    <div className="fs-6 text-dark fw-medium">{user.username}</div>
                                </div>
                                <div className="pb-3 border-bottom border-secondary border-opacity-10">
                                    <label className="text-muted text-uppercase fw-bold d-block mb-1"
                                           style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>Email</label>
                                    <div className="fs-6 text-dark fw-medium">
                                        {user.email ||
                                            <span className="fst-italic text-muted fw-normal">Não definido</span>}
                                    </div>
                                </div>
                                <div className="pb-3 border-bottom border-secondary border-opacity-10">
                                    <label className="text-muted text-uppercase fw-bold d-block mb-1"
                                           style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>Distrito</label>
                                    <div className="fs-6 text-dark fw-medium">
                                        {profile?.distrito ||
                                            <span className="fst-italic text-muted fw-normal">Não definido</span>}
                                    </div>
                                </div>
                                <div className="pb-3 border-bottom border-secondary border-opacity-10">
                                    <label className="text-muted text-uppercase fw-bold d-block mb-1"
                                           style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>Biografia</label>
                                    <div className="fs-6 text-dark fw-medium">
                                        {profile?.biografia ||
                                            <span className="fst-italic text-muted fw-normal">Não definida</span>}
                                    </div>
                                </div>
                                <div className="pb-3 border-bottom border-secondary border-opacity-10">
                                    <label className="text-muted text-uppercase fw-bold d-block mb-1"
                                           style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
                                        {user.role === 'Admin' ? 'Tipo de Conta' : 'Plano Subscrito'}
                                    </label>
                                    <div className="d-flex align-items-center gap-3">
        <span className="fs-6 text-dark fw-medium">
            {user.role === 'Admin' ? 'Administrador' : user.plano}
        </span>
                                        {user.role !== 'Admin' && user.plano !== 'Premium' && (
                                            <button
                                                className="btn btn-sm btn-warning fw-bold rounded-pill px-3"
                                                style={{fontSize: '0.8rem'}}
                                                onClick={() => setShowUpgradeModal(true)}
                                            >
                                                💎 Upgrade para Premium
                                            </button>
                                        )}
                                        {user.role !== 'Admin' && user.plano === 'Premium' && (
                                            <button
                                                className="btn btn-sm btn-outline-danger rounded-pill px-3"
                                                style={{fontSize: '0.8rem'}}
                                                onClick={handleDowngrade}
                                            >
                                                Cancelar Premium
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="mt-5 pt-4 border-top border-secondary border-opacity-25"
                         style={{maxWidth: '600px'}}>
                        <h5 className="fw-bold mb-4 text-dark">As Minhas Avaliações</h5>

                        {!(profile?.plano === 'Premium' || user?.role === 'Admin') ? (
                            <div className="p-4 border rounded border-secondary border-opacity-25 bg-light text-center">
                                <div className="fs-3 mb-2">🔒</div>
                                <h6 className="fw-bold text-dark mb-2">Acesso Premium</h6>
                                <p className="text-muted small mb-0">
                                    Precisas do plano Premium para conseguires ler o feedback escrito detalhado deixado
                                    pelos teus compradores.
                                </p>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-3">
                                {profile?.avaliacoes && profile.avaliacoes.length > 0 ? (
                                    profile.avaliacoes.map((av) => (
                                        <div key={av.id}
                                             className="p-3 border rounded border-secondary border-opacity-10 bg-white shadow-sm">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span className="fw-bold text-dark"
                                                      style={{fontSize: '0.9rem'}}>@{av.avaliador_name}</span>
                                                <span className="text-muted"
                                                      style={{fontSize: '0.8rem'}}>{av.data_avaliacao}</span>
                                            </div>
                                            <div className="text-warning small mb-2">
                                                {"★".repeat(av.estrelas)}{"☆".repeat(5 - av.estrelas)}
                                            </div>
                                            {av.comentario && <p className="text-muted mb-0 fst-italic"
                                                                 style={{fontSize: '0.9rem'}}>"{av.comentario}"</p>}
                                        </div>
                                    ))
                                ) : (
                                    <div
                                        className="text-center py-4 text-muted small border rounded border-secondary border-opacity-10 bg-white shadow-sm">
                                        Ainda não recebeste nenhuma avaliação escrita.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>
            {showUpgradeModal && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}
                    onClick={() => setShowUpgradeModal(false)}
                >
                    <div
                        className="bg-white rounded-4 shadow-lg p-5"
                        style={{maxWidth: '480px', width: '90%'}}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="text-center mb-4">
                            <div style={{fontSize: '2.5rem'}}>💎</div>
                            <h4 className="fw-bold mt-2" style={{color: 'var(--dark-brown)'}}>Plano Premium</h4>
                            <div className="mt-1">
                                <span className="fs-3 fw-bold text-dark">2,99€</span>
                                <span className="text-muted">/mês</span>
                            </div>
                        </div>

                        <ul className="list-unstyled d-flex flex-column gap-2 mb-4">
                            {[
                                'Acesso ao feedback escrito detalhado dos compradores',
                                'Visualização do rating e histórico completo de avaliações de outros vendedores',
                                'Badge de destaque nos teus anúncios',
                                'Destaque nos resultados de pesquisa',
                            ].map((vantagem, i) => (
                                <li key={i} className="d-flex align-items-start gap-2" style={{fontSize: '0.92rem'}}>
                                    <span className="text-warning fw-bold">✓</span>
                                    <span className="text-muted">{vantagem}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-warning fw-bold flex-grow-1 rounded-pill py-2"
                                onClick={handleUpgrade}
                            >
                                Confirmar Upgrade
                            </button>
                            <button
                                className="btn btn-light border rounded-pill px-4 py-2"
                                onClick={() => setShowUpgradeModal(false)}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;