import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUserContext } from '../context/UserProvider';

const PROFILE_URL = 'http://localhost:8000/booked/api/profile/';

const getCSRFToken = () => {
    return document.cookie.split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
}

const Profile = () => {
    const { user } = useUserContext();
    const [profile, setProfile] = useState(null);
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    const carregarPerfil = () => {
        axios.get(PROFILE_URL, { withCredentials: true })
            .then(res => setProfile(res.data))
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

        if (!imageFile) {
            setIsEditing(false);
            return;
        }

        const formData = new FormData();
        formData.append('imagem', imageFile);

        try {
            await axios.put(PROFILE_URL, formData, {
                withCredentials: true,
                headers: {
                    'X-CSRFToken': getCSRFToken(),
                    'Content-Type': 'multipart/form-data'
                }
            });

            setIsEditing(false);
            setImageFile(null);
            setPreviewUrl('');
            carregarPerfil();
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            alert("Erro ao atualizar a imagem de perfil.");
        }
    };

    const cancelarEdicao = () => {
        setIsEditing(false);
        setImageFile(null);
        setPreviewUrl('');
    };

    return (
        <div className="container mt-5 mb-5">

            <h2 className="mb-5 pb-3 border-bottom border-secondary border-opacity-25 fw-bold" style={{ color: "var(--dark-brown)" }}>
                Configurações de Perfil
            </h2>

            <div className="row">

                <div className="col-md-4 col-lg-3 text-center text-md-start mb-5 mb-md-0 d-flex flex-column align-items-center align-items-md-start">
                    {profile && (
                        <div className="position-relative d-inline-block mb-3">
                            <img
                                src={
                                    previewUrl
                                    ? previewUrl
                                    : (profile.imagem && !profile.imagem.includes('default.png')
                                        ? profile.imagem
                                        : 'https://res.cloudinary.com/dub0qps5u/image/upload/v1778581892/default_nmibr3.png')
                                }
                                alt="Foto de perfil"
                                className="rounded-circle shadow-sm"
                                style={{ width: '180px', height: '180px', objectFit: 'cover', border: '4px solid white' }}
                            />
                        </div>
                    )}

                    <h5 className="fw-bold mb-1" style={{ color: "var(--dark-brown)" }}>{user.username}</h5>
                    <p className="text-muted small mb-4">
                        {user.role === 'Admin' ? 'Administrador' : `Cliente ${user.plano}`}
                    </p>

                    {!isEditing && (
                        <button className="btn btn-outline-dark btn-sm rounded-pill px-4 fw-medium" onClick={() => setIsEditing(true)}>
                            Editar Fotografia
                        </button>
                    )}
                </div>

                <div className="col-md-8 col-lg-9 text-start ps-md-5">
                    <h5 className="fw-bold mb-4 text-dark">Detalhes da Conta</h5>

                    {isEditing ? (
                        <form onSubmit={handleSave} className="p-4 border rounded border-secondary border-opacity-25 bg-white shadow-sm" style={{ maxWidth: '600px' }}>
                            <div className="mb-4">
                                <label className="form-label fw-bold text-dark">Carregar nova imagem</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    accept="image/*"
                                    onChange={handleImageSelection}
                                />
                                <div className="form-text mt-2 text-muted">Formatos recomendados: JPG, PNG.</div>
                            </div>
                            <div className="d-flex gap-2">
                                <button type="submit" className="btn btn-dark px-4 fw-medium">Guardar</button>
                                <button type="button" className="btn btn-light border px-4 fw-medium" onClick={cancelarEdicao}>Cancelar</button>
                            </div>
                        </form>
                    ) : (
                        <div className="d-flex flex-column gap-4" style={{ maxWidth: '600px' }}>

                            <div className="pb-3 border-bottom border-secondary border-opacity-10">
                                <label className="text-muted text-uppercase fw-bold d-block mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                                    Username
                                </label>
                                <div className="fs-6 text-dark fw-medium">{user.username}</div>
                            </div>

                            <div className="pb-3 border-bottom border-secondary border-opacity-10">
                                <label className="text-muted text-uppercase fw-bold d-block mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                                    Endereço de Email
                                </label>
                                <div className="fs-6 text-dark fw-medium">
                                    {user.email || <span className="fst-italic text-muted fw-normal">Não definido</span>}
                                </div>
                            </div>

                            <div className="pb-3 border-bottom border-secondary border-opacity-10">
                                <label className="text-muted text-uppercase fw-bold d-block mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                                    {user.role === 'Admin' ? 'Tipo de Conta' : 'Plano Subscrito'}
                                </label>
                                <div className="fs-6 text-dark fw-medium">
                                    {user.role === 'Admin' ? 'Administrador' : user.plano}
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;