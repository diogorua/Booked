import {useState, useEffect} from "react";
import {useParams, useNavigate} from "react-router-dom";
import axios from "axios";
import {useUserContext} from "../context/UserProvider";

const BASE_URL = "http://localhost:8000/booked/api";

const getCSRFToken = () => {
    return document.cookie.split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
}

export default function PublicProfile() {
    const {username} = useParams();
    const navigate = useNavigate();
    const {user, setUser} = useUserContext();

    const [perfil, setPerfil] = useState(null);
    const [erro, setErro] = useState(false);
    const [activeTab, setActiveTab] = useState("livros");

    // Estados do Reporte
    const [showReportModal, setShowReportModal] = useState(false);
    const [motivoReport, setMotivoReport] = useState("Fraude/Burla");
    const [descricaoReport, setDescricaoReport] = useState("");

    const LoadPublicProfile = () => {
        axios.get(`${BASE_URL}/profile/${username}/`, { withCredentials: true })
            .then(res => setPerfil(res.data))
            .catch(() => setErro(true));
    };

    useEffect(() => {
        LoadPublicProfile();
    }, [username]);

    const handleUpgrade = async () => {
        axios.put(`${BASE_URL}/profile/`, { plano: 'Premium' }, {
            withCredentials: true,
            headers: {'X-CSRFToken': getCSRFToken()}
        })
        .then(() => axios.get(`${BASE_URL}/user/`, { withCredentials: true }))
        .then(resUser => {
            setUser(resUser.data);
            LoadPublicProfile();
            alert("Upgrade concluído! Já tens acesso total às opiniões dos compradores.");
        })
        .catch(() => alert("Não foi possível processar o upgrade."));
    };

    const sendReportProfile = (e) => {
        e.preventDefault();

        axios.post(`${BASE_URL}/reports/`, {
            tipo: 'perfil',
            alvo_id: perfil.livros[0]?.vendedor || 0,
            alvo_nome: perfil.username,
            motivo: motivoReport,
            descricao: descricaoReport
        }, {
            withCredentials: true,
            headers: { 'X-CSRFToken': getCSRFToken() }
        })
        .then(() => {
            alert("Perfil denunciado com sucesso.");
            setShowReportModal(false);
            setDescricaoReport("");
        })
        .catch(() => alert("Erro ao submeter denúncia."));
    };

    if (erro) return <div className="container mt-5 text-center"><h4 className="text-muted">Utilizador não encontrado.</h4></div>;
    if (!perfil) return <div className="container mt-5 text-center"><div className="spinner-border" style={{color: "var(--dark-brown)"}}/></div>;

    return (
        <div className="container mt-5 mb-5">
            <button className="btn btn-outline-secondary mb-4" onClick={() => navigate(-1)}>← Voltar</button>

            <div className="card border-0 shadow-sm p-4 mb-4" style={{backgroundColor: "var(--cream)"}}>
                <div className="d-flex flex-column flex-md-row align-items-center gap-4">
                    <img
                        src={(perfil.imagem && !perfil.imagem.includes('default.png'))
                            ? (perfil.imagem.startsWith('http') ? perfil.imagem : `http://localhost:8000${perfil.imagem}`)
                            : 'https://res.cloudinary.com/dub0qps5u/image/upload/v1778581892/default_nmibr3.png'}
                        alt={perfil.username}
                        className="rounded-circle shadow-sm"
                        style={{width: "120px", height: "120px", objectFit: "cover", border: "4px solid white", backgroundColor: "white"}}
                    />
                    <div className="text-center text-md-start">
                        <div className="d-flex flex-column flex-md-row align-items-center align-items-md-baseline gap-2 mb-1">
                            <h3 className="fw-bold mb-0" style={{color: "var(--dark-brown)"}}>{perfil.username}</h3>
                            {user && (user.plano === 'Premium' || user.role === 'Admin') && perfil.vendedor_top && <span className="badge bg-warning text-dark">Vendedor Top</span>}
                        </div>

                        {perfil.is_premium_viewer || user?.role === 'Admin' ? (
                            <div className="text-warning fs-5 mb-2">
                                {"★".repeat(Math.round(perfil.media_estrelas || 0))}
                                {"☆".repeat(5 - Math.round(perfil.media_estrelas || 0))}
                                <span className="text-muted ms-2" style={{fontSize: "0.9rem"}}>({perfil.total_avaliacoes} avaliações)</span>
                            </div>
                        ) : (
                            <div className="badge bg-light text-muted border mb-3 px-2 py-1 shadow-sm">
                                Acesso Premium para visualizar avaliações
                            </div>
                        )}

                        <p className="text-muted mb-2">{perfil.biografia || <span className="fst-italic">Sem biografia.</span>}</p>
                        <p className="small mb-0 fw-medium">📍 {perfil.distrito || "Não definido"} • 📅 Membro desde {perfil.date_joined}</p>

                        {/* BOTÃO DE REPORTAR USER */}
                        {user && perfil.username !== user.username && (
                            <button
                                className="btn btn-link text-danger text-decoration-none p-0 mt-2 small fw-medium d-block"
                                onClick={() => setShowReportModal(true)}
                            >
                                Denunciar este utilizador
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <ul className="nav nav-tabs mb-4 border-secondary border-opacity-25">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'livros' ? 'active fw-bold border-bottom-0' : 'text-muted border-0'}`}
                        onClick={() => setActiveTab('livros')}
                        style={{color: activeTab === 'livros' ? 'var(--dark-brown)' : '', backgroundColor: activeTab === 'livros' ? 'white' : 'transparent'}}
                    >
                        À Venda ({perfil.livros.filter(l => !l.vendido).length})
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'comentarios' ? 'active fw-bold border-bottom-0' : 'text-muted border-0'}`}
                        onClick={() => setActiveTab('comentarios')}
                        style={{color: activeTab === 'comentarios' ? 'var(--dark-brown)' : '', backgroundColor: activeTab === 'comentarios' ? 'white' : 'transparent'}}
                    >
                        Avaliações
                    </button>
                </li>
            </ul>

            {activeTab === 'livros' && (
                <div className="row g-4">
                    {perfil.livros.filter(l => !l.vendido).length > 0 ? (
                        perfil.livros.filter(l => !l.vendido).map((livro) => (
                            <div className="col-md-4 col-lg-3" key={livro.id}>
                                <div className="card h-100 shadow-sm border-0">
                                    {livro.imagem_capa ? (
                                        <img src={livro.imagem_capa} className="card-img-top" alt={livro.titulo} style={{height: "250px", objectFit: "cover"}}/>
                                    ) : (
                                        <div className="card-img-top bg-light d-flex align-items-center justify-content-center" style={{height: "250px"}}><span className="text-muted small">Sem capa</span></div>
                                    )}
                                    <div className="card-body d-flex flex-column" style={{backgroundColor: "var(--cream)"}}>
                                        <h6 className="card-title fw-bold text-truncate mb-1">{livro.titulo}</h6>
                                        <p className="text-muted small mb-3">{livro.estado_conservacao}</p>
                                        <div className="mt-auto d-flex justify-content-between align-items-center">
                                            <h5 className="mb-0 fw-bold" style={{color: "var(--dark-brown)"}}>{livro.preco}€</h5>
                                            <button className="btn btn-sm btn-outline-gold" onClick={() => navigate(`/livro/${livro.id}`)}>Ver</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-12 text-center py-5"><p className="text-muted">Este utilizador não tem livros à venda.</p></div>
                    )}
                </div>
            )}

            {activeTab === 'comentarios' && (
                <div className="bg-white shadow-sm rounded p-4 border-0">
                    <h5 className="fw-bold mb-4 text-dark">O que dizem os compradores</h5>

                    {!perfil.is_premium_viewer || user?.role === 'Admin' ? (
                        <div className="text-center py-5 border rounded bg-light bg-opacity-50">
                            <div className="fs-1 mb-3">🔒</div>
                            <h5 className="fw-bold text-dark">Acesso Exclusivo Premium</h5>
                            <p className="text-muted mb-4 mx-auto" style={{ maxWidth: "450px" }}>
                                Atualiza o teu plano para leres as opiniões detalhadas de outros compradores e garantires negócios mais seguros.
                            </p>
                            <button className="btn btn-warning fw-bold px-4 rounded-pill shadow" onClick={handleUpgrade}>
                                Fazer Upgrade para Premium
                            </button>
                        </div>
                    ) : (
                        <div className="avaliacoes-list">
                            {perfil.avaliacoes && perfil.avaliacoes.length > 0 ? (
                                perfil.avaliacoes.map((av) => (
                                    <div key={av.id} className="border-bottom pb-4 mb-4">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <span className="fw-bold text-dark me-2">@{av.avaliador_name}</span>
                                                <div className="text-warning d-inline-block small">
                                                    {"★".repeat(av.estrelas)}{"☆".repeat(5 - av.estrelas)}
                                                </div>
                                            </div>
                                            <span className="text-muted small">{av.data_avaliacao}</span>
                                        </div>
                                        {av.comentario && <p className="text-muted mb-0 mt-2 fst-italic">"{av.comentario}"</p>}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-5">
                                    <h5 className="text-muted">Sem comentários</h5>
                                    <p className="text-muted mb-0">Este vendedor ainda não recebeu nenhuma avaliação escrita.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* MODAL DE REPORTAR USER */}
            {showReportModal && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 p-2 shadow-lg" style={{ backgroundColor: "var(--cream)" }}>
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold text-dark">Reportar @{perfil.username}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowReportModal(false)}></button>
                            </div>
                            <form onSubmit={sendReportProfile}>
                                <div className="modal-body py-4">
                                    <div className="mb-4">
                                        <label className="form-label fw-bold small text-dark">Qual é o problema?</label>
                                        <select className="form-select border-0 shadow-sm" value={motivoReport} onChange={(e) => setMotivoReport(e.target.value)}>
                                            <option value="Fraude/Burla">Contas Falsas / Mensagens Suspeitas</option>
                                            <option value="Conteúdo Impróprio">Biografia ou Imagem Ofensiva</option>
                                            <option value="Outro motivo">Comportamento Tóxico / Outros</option>
                                        </select>
                                    </div>
                                    <div className="mb-2">
                                        <label className="form-label fw-bold small text-dark">Explica o que aconteceu (opcional):</label>
                                        <textarea className="form-control border-0 shadow-sm" rows="3" placeholder="Detalhes que ajudem o Admin a decidir..." value={descricaoReport} onChange={(e) => setDescricaoReport(e.target.value)} maxLength="400" style={{ resize: "none" }}/>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 pt-0 gap-2">
                                    <button type="button" className="btn btn-light px-4" onClick={() => setShowReportModal(false)}>Cancelar</button>
                                    <button type="submit" className="btn btn-danger px-4 fw-bold">Enviar Reporte</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}