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
    const {user} = useUserContext();
    const [profile, setProfile] = useState(null);
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [biografia, setBiografia] = useState('');
    const [distrito, setDistrito] = useState('');

    const carregarPerfil = () => {
        axios.get(PROFILE_URL, {withCredentials: true})
            .then(res => {
                setProfile(res.data);
                setBiografia(res.data.biografia || '');
                setDistrito(res.data.distrito || '');
            })
            .catch(err => console.error('Erro ao carregar perfil:', err));
    };

    useEffect(() => {
        carregarPerfil();
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
            carregarPerfil();
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            alert("Erro ao atualizar o perfil.");
        }
    };

    const cancelarEdicao = () => {
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
                {/* Coluna esquerda */}
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

                {/* Coluna direita */}
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
                                            onClick={cancelarEdicao}>Cancelar
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
                                    <div className="fs-6 text-dark fw-medium">
                                        {user.role === 'Admin' ? 'Administrador' : user.plano}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;