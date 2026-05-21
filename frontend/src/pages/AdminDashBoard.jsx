import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../context/UserProvider";

const ADMIN_URL = "http://localhost:8000/booked/api/admin-dashboard/";
const DELETE_URL = "http://localhost:8000/booked/api/admin-delete/";
const RESOLVE_URL = "http://localhost:8000/booked/api/reports/";

const getCSRFToken = () => {
    return document.cookie.split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
}

export default function AdminDashboard() {
    const { user } = useUserContext();
    const navigate = useNavigate();
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState(false);
    const [activeTab, setActiveTab] = useState("estatisticas");

    const LoadData = () => {
        axios.get(ADMIN_URL, { withCredentials: true })
            .then(res => setDados(res.data))
            .catch(err => {
                console.error("Erro ao carregar dashboard admin:", err);
                setErro(true);
            });
    };

    useEffect(() => {
        if (!user || user.role !== 'Admin') {
            navigate('/');
            return;
        }
        LoadData();
    }, [user, navigate]);

    const handleDelete = (type, id, nome) => {
        const confirmar = window.confirm(`Tem a certeza que deseja eliminar este ${type === 'user' ? 'utilizador' : 'anúncio'} (${nome})? Esta ação é irreversível.`);
        if (!confirmar) return;

        return axios.delete(`${DELETE_URL}${type}/${id}/`, {
            withCredentials: true,
            headers: { 'X-CSRFToken': getCSRFToken() }
        })
        .then(() => {
            alert(`${type === 'user' ? 'Utilizador' : 'Anúncio'} eliminado.`);
            LoadData();
        })
        .catch(error => {
            alert(error.response?.data?.error || "Erro ao tentar eliminar.");
            throw error; // Lança o erro para parar o .then() encadeado abaixo
        });
    };

    const handleArchiveReport = (reporteId) => {
        return axios.post(`${RESOLVE_URL}${reporteId}/resolve/`, {}, {
            withCredentials: true,
            headers: { 'X-CSRFToken': getCSRFToken() }
        })
        .then(() => {
            alert("Denúncia resolvida e arquivada.");
            LoadData();
        })
        .catch(() => {
            alert("Erro ao arquivar reporte.");
        });
    };

    if (erro) return <div className="container mt-5 text-center text-danger"><h4>Erro de permissão ou falha de ligação.</h4></div>;
    if (!dados) return <div className="container mt-5 text-center"><div className="spinner-border" /></div>;

    return (
        <div className="container mt-5 mb-5">
            <div className="d-flex align-items-center mb-4 gap-3">
                <div className="fs-1">⚙️</div>
                <div>
                    <h2 className="fw-bold mb-0" style={{ color: "var(--dark-brown)" }}>Painel de Administração</h2>
                    <p className="text-muted mb-0">Gestão global, moderação e análise da plataforma.</p>
                </div>
            </div>

            <ul className="nav nav-tabs mb-4 border-secondary border-opacity-25">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'estatisticas' ? 'active fw-bold border-bottom-0' : 'text-muted border-0'}`}
                        onClick={() => setActiveTab('estatisticas')}
                        style={{ color: activeTab === 'estatisticas' ? 'var(--dark-brown)' : '', backgroundColor: activeTab === 'estatisticas' ? 'white' : 'transparent' }}
                    >
                        Visão Geral
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'denuncias' ? 'active fw-bold border-bottom-0 text-danger bg-light' : 'text-danger border-0 fw-medium'}`}
                        onClick={() => setActiveTab('denuncias')}
                        style={{ backgroundColor: activeTab === 'denuncias' ? 'white' : 'transparent' }}
                    >
                        Denúncias ({dados.denuncias?.length || 0})
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'moderacao' ? 'active fw-bold border-bottom-0' : 'text-muted border-0'}`}
                        onClick={() => setActiveTab('moderacao')}
                        style={{ color: activeTab === 'moderacao' ? 'var(--dark-brown)' : '', backgroundColor: activeTab === 'moderacao' ? 'white' : 'transparent' }}
                    >
                        Moderação
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'utilizadores' ? 'active fw-bold border-bottom-0' : 'text-muted border-0'}`}
                        onClick={() => setActiveTab('utilizadores')}
                        style={{ color: activeTab === 'utilizadores' ? 'var(--dark-brown)' : '', backgroundColor: activeTab === 'utilizadores' ? 'white' : 'transparent' }}
                    >
                        Gestão de Contas
                    </button>
                </li>
            </ul>

            {/* ESTATÍSTICAS */}
            {activeTab === 'estatisticas' && (
                <div>
                    <div className="row g-4 mb-4">
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm p-3 text-center h-100 bg-white">
                                <h6 className="text-muted text-uppercase fw-bold mb-2" style={{ fontSize: "0.8rem" }}>Contas Ativas</h6>
                                <h3 className="fw-bold mb-0 text-dark">{dados.estatisticas.total_users}</h3>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm p-3 text-center h-100 bg-white">
                                <h6 className="text-muted text-uppercase fw-bold mb-2" style={{ fontSize: "0.8rem" }}>Livros Publicados</h6>
                                <h3 className="fw-bold mb-0 text-dark">{dados.estatisticas.total_livros}</h3>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm p-3 text-center h-100 bg-white">
                                <h6 className="text-muted text-uppercase fw-bold mb-2" style={{ fontSize: "0.8rem" }}>À Venda</h6>
                                <h3 className="fw-bold mb-0 text-primary">{dados.estatisticas.livros_ativos}</h3>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm p-3 text-center h-100 bg-white">
                                <h6 className="text-muted text-uppercase fw-bold mb-2" style={{ fontSize: "0.8rem" }}>Transações Feitas</h6>
                                <h3 className="fw-bold mb-0 text-success">{dados.estatisticas.total_compras}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="card border-0 shadow-sm bg-white p-4">
                        <h6 className="fw-bold mb-3 text-dark">Distribuição de Livros por Categoria</h6>
                        <div className="row g-2">
                            {dados.categorias.map((cat, idx) => (
                                <div className="col-md-4" key={idx}>
                                    <div className="d-flex justify-content-between align-items-center p-2 border rounded bg-light">
                                        <span className="fw-medium text-dark small">{cat.name}</span>
                                        <span className="badge bg-dark rounded-pill">{cat.num_livros}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* DENÚNCIAS */}
            {activeTab === 'denuncias' && (
                <div className="card border-0 shadow-sm bg-white p-4">
                    <h5 className="fw-bold mb-4 text-dark text-danger">Denúncias por Analisar</h5>
                    {dados.denuncias && dados.denuncias.length > 0 ? (
                        <div className="d-flex flex-column gap-3">
                            {dados.denuncias.map((rep) => (
                                <div key={rep.id} className="p-3 border border-danger border-opacity-25 rounded bg-light bg-opacity-10 shadow-sm">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                            <span className="badge bg-danger me-2">{rep.tipo.toUpperCase()}</span>
                                            <strong className="text-dark">Alvo: {rep.alvo_nome}</strong>
                                            <span className="text-muted small ms-2">(ID #{rep.alvo_id})</span>
                                        </div>
                                        <span className="text-muted small">{rep.data}</span>
                                    </div>
                                    <p className="mb-1 text-dark small"><strong>Motivo:</strong> {rep.motivo}</p>
                                    {rep.descricao && <p className="text-muted small bg-white p-2 rounded border mb-3">"{rep.descricao}"</p>}
                                    <div className="d-flex justify-content-between align-items-center border-top pt-2">
                                        <span className="small text-muted">Enviado por: @{rep.denunciante}</span>
                                        <div className="d-flex gap-2">
                                            <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(rep.tipo === 'livro' ? `/livro/${rep.alvo_id}` : `/profile/${rep.alvo_nome}`)}>Ver Conteúdo</button>
                                            <button className="btn btn-sm btn-success fw-medium" onClick={() => handleArchiveReport(rep.id)}>Ignorar Queixa</button>
                                            <button className="btn btn-sm btn-danger fw-bold" onClick={async () => {
                                                await handleDelete(rep.tipo === 'livro' ? 'book' : 'user', rep.alvo_id, rep.alvo_nome);
                                                await handleArchiveReport(rep.id);
                                            }}>
                                                Eliminar Infrator
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-5 text-muted">
                            Excelente! Não há nenhuma queixa pendente de moderação na plataforma.
                        </div>
                    )}
                </div>
            )}

            {/* MODERAÇÃO DE LIVROS */}
            {activeTab === 'moderacao' && (
                <div className="card border-0 shadow-sm bg-white p-4">
                    <h5 className="fw-bold mb-4 text-dark">Fiscalização de Anúncios</h5>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr><th>ID</th><th>Título</th><th>Vendedor</th><th>Preço</th><th>Estado</th><th>Status</th><th className="text-end">Ações</th></tr>
                            </thead>
                            <tbody>
                                {dados.livros.map(b => (
                                    <tr key={b.id}>
                                        <td className="text-muted small">#{b.id}</td>
                                        <td className="fw-medium text-truncate" style={{ maxWidth: '200px' }}>{b.titulo}</td>
                                        <td>@{b.vendedor}</td><td>{b.preco}€</td><td className="small">{b.estado}</td>
                                        <td>{b.vendido ? <span className="badge bg-success">Vendido</span> : <span className="badge bg-primary">Ativo</span>}</td>
                                        <td className="text-end">
                                            <button className="btn btn-sm btn-outline-dark me-2" onClick={() => navigate(`/livro/${b.id}`)}>Ver</button>
                                            <button className="btn btn-sm btn-danger fw-bold" onClick={() => handleDelete('book', b.id, b.titulo)}>Eliminar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* GESTÃO DE UTILIZADORES */}
            {activeTab === 'utilizadores' && (
                <div className="card border-0 shadow-sm bg-white p-4">
                    <h5 className="fw-bold mb-4 text-dark">Controlo de Contas</h5>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr><th>ID</th><th>Username</th><th>Email</th><th>Plano</th><th>Registo</th><th className="text-end">Ações</th></tr>
                            </thead>
                            <tbody>
                                {dados.utilizadores.map(u => (
                                    <tr key={u.id}>
                                        <td className="text-muted small">#{u.id}</td>
                                        <td className="fw-bold text-dark">@{u.username} {u.is_admin && <span className="text-danger ms-1">👑</span>}</td>
                                        <td className="small">{u.email}</td>
                                        <td><span className={`badge ${u.plano === 'Premium' ? 'bg-warning text-dark' : (u.plano === 'Admin' ? 'bg-danger' : 'bg-secondary')}`}>{u.plano}</span></td>
                                        <td className="small">{u.data_registo}</td>
                                        <td className="text-end">
                                            <button className="btn btn-sm btn-outline-danger fw-bold" onClick={() => handleDelete('user', u.id, u.username)} disabled={u.is_admin}>Banir Conta</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}