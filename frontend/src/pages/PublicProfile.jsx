import {useState, useEffect} from "react";
import {useParams, useNavigate} from "react-router-dom";
import axios from "axios";

const BASE_URL = "http://localhost:8000/booked/api";

export default function PublicProfile() {
    const {username} = useParams();
    const navigate = useNavigate();
    const [perfil, setPerfil] = useState(null);
    const [erro, setErro] = useState(false);
    const [activeTab, setActiveTab] = useState("livros");

    useEffect(() => {
        axios.get(`${BASE_URL}/profile/${username}/`)
            .then(res => setPerfil(res.data))
            .catch(() => setErro(true));
    }, [username]);

    if (erro) return (
        <div className="container mt-5 text-center">
            <h4 className="text-muted">Utilizador não encontrado.</h4>
            <button className="btn btn-outline-secondary mt-3" onClick={() => navigate('/')}>
                Voltar à Home
            </button>
        </div>
    );

    if (!perfil) return (
        <div className="container mt-5 text-center">
            <div className="spinner-border" style={{color: "var(--dark-brown)"}}/>
        </div>
    );

    return (
        <div className="container mt-5 mb-5">
            <button className="btn btn-outline-secondary mb-4" onClick={() => navigate(-1)}>
                ← Voltar
            </button>

            {/* Cabeçalho do perfil */}
            <div className="card border-0 shadow-sm p-4 mb-5"
                 style={{backgroundColor: "var(--cream)", borderRadius: "15px"}}>
                <div className="d-flex align-items-center gap-4">
                    <div className="d-flex align-items-center gap-4">
                        {perfil.imagem ? (
                            <img
                                src={perfil.imagem}
                                alt={perfil.username}
                                className="rounded-circle"
                                style={{width: "80px", height: "80px", objectFit: "cover", flexShrink: 0}}
                            />
                        ) : (
                            <div
                                className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white fw-bold"
                                style={{width: "80px", height: "80px", fontSize: "2rem", flexShrink: 0}}
                            >
                                {perfil.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h2 className="fw-bold mb-1" style={{color: "var(--dark-brown)"}}>{perfil.username}</h2>
                            {perfil.biografia && (
                                <p className="text-muted mb-1" style={{maxWidth: "500px"}}>{perfil.biografia}</p>
                            )}
                            <div className="d-flex gap-3 mt-1">
                                {perfil.distrito && (
                                    <span className="text-muted small">📍 {perfil.distrito}</span>
                                )}
                                <span className="text-muted small">📅 Membro desde {perfil.date_joined}</span>
                                <span className="text-muted small">📚 {perfil.livros.length} anúncio(s) ativo(s)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <ul className="nav nav-tabs mb-4 border-secondary border-opacity-25">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'livros' ? 'active fw-bold border-bottom-0' : 'text-muted border-0'}`}
                        onClick={() => setActiveTab('livros')}
                        style={{
                            color: activeTab === 'livros' ? 'var(--dark-brown)' : '',
                            backgroundColor: activeTab === 'livros' ? 'var(--cream)' : 'transparent'
                        }}
                    >
                        Livros à venda
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'comentarios' ? 'active fw-bold border-bottom-0' : 'text-muted border-0'}`}
                        onClick={() => setActiveTab('comentarios')}
                        style={{
                            color: activeTab === 'comentarios' ? 'var(--dark-brown)' : '',
                            backgroundColor: activeTab === 'comentarios' ? 'var(--cream)' : 'transparent'
                        }}
                    >
                        Comentários
                    </button>
                </li>
            </ul>

            {activeTab === 'livros' && (
                <div className="row g-4">
                    {perfil.livros.length > 0 ? (
                        perfil.livros.map(livro => (
                            <div className="col-md-4 col-lg-3" key={livro.id}>
                                <div className="card h-100 shadow-sm border-0">
                                    {livro.imagem_capa ? (
                                        <img
                                            src={livro.imagem_capa}
                                            className="card-img-top"
                                            alt={livro.titulo}
                                            style={{height: "300px", objectFit: "cover"}}
                                        />
                                    ) : (
                                        <div
                                            className="card-img-top bg-light d-flex align-items-center justify-content-center"
                                            style={{height: "300px"}}>
                                            <span className="text-muted">Sem capa</span>
                                        </div>
                                    )}
                                    <div className="card-body d-flex flex-column"
                                         style={{backgroundColor: "var(--cream)"}}>
                                        <h5 className="card-title fw-bold text-truncate">{livro.titulo}</h5>
                                        <h6 className="card-subtitle mb-3 text-muted">{livro.autor}</h6>
                                        <div className="mb-2">
                                            <span className="badge bg-secondary me-2">{livro.categoria_name}</span>
                                            <span
                                                className="badge border border-dark text-dark">{livro.estado_conservacao}</span>
                                        </div>
                                        <div className="mt-auto d-flex justify-content-between align-items-center">
                                            <h4 className="mb-0 fw-bold"
                                                style={{color: "var(--dark-brown)"}}>{livro.preco}€</h4>
                                            <button
                                                className="btn btn-sm btn-outline-gold"
                                                onClick={() => navigate(`/livro/${livro.id}`)}
                                            >
                                                Ver Detalhes
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-12 text-center py-5">
                            <p className="text-muted">Este utilizador não tem livros à venda.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'comentarios' && (
                <div className="text-center py-5 bg-white shadow-sm rounded">
                    <h4 className="text-muted mb-3">Comentários</h4>
                    <p className="text-muted">Por implementar</p>
                </div>
            )}

        </div>
    );
}