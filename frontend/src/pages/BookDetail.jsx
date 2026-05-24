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

export default function BookDetail() {
    const {id} = useParams();
    const navigate = useNavigate();
    const {user} = useUserContext();
    const [livro, setLivro] = useState(null);
    const [erro, setErro] = useState(false);
    const [sugestoes, setSugestoes] = useState([]);

    // Estados do Reporte
    const [showReportModal, setShowReportModal] = useState(false);
    const [motivoReport, setMotivoReport] = useState("Fraude/Burla");
    const [descricaoReport, setDescricaoReport] = useState("");

    useEffect(() => {
        window.scrollTo(0, 0);

        axios.get(`${BASE_URL}/books/${id}/`, {withCredentials: true})
            .then(res => {
                setLivro(res.data);

                // Vai buscar sugestões da mesma categoria
                axios.get(`${BASE_URL}/books/?categoria=${res.data.categoria}`, {withCredentials: true})
                    .then(r => {
                        const filtrados = r.data.results.filter(l => l.id !== res.data.id);
                        if (filtrados.length >= 4) {
                            setSugestoes(filtrados.slice(0, 4));
                        } else {
                            axios.get(`${BASE_URL}/books/`, {withCredentials: true})
                                .then(r2 => {
                                    const idsJaSugeridos = filtrados.map(f => f.id);
                                    idsJaSugeridos.push(res.data.id);
                                    const extra = r2.data.results.filter(l => !idsJaSugeridos.includes(l.id));
                                    setSugestoes([...filtrados, ...extra].slice(0, 4));
                                });
                        }
                    });
            })
            .catch(() => setErro(true));
    }, [id]);

    const handleBuy = () => {
        if (!user) {
            navigate("/login");
            return;
        }
        if (window.confirm(`Queres mesmo comprar "${livro.titulo}" por ${livro.preco}€?`)) {
            axios.post(`${BASE_URL}/books/${livro.id}/buy/`, {}, {
                withCredentials: true,
                headers: {'X-CSRFToken': getCSRFToken()}
            })
                .then(() => {
                    alert("Compra realizada com sucesso! O livro já está na tua Estante (Aba Compras).");
                    setLivro({...livro, vendido: true});
                })
                .catch(err => {
                    alert(err.response?.data?.error || "Erro ao efetuar compra.");
                });
        }
    };

    const sendReport = (e) => {
        e.preventDefault();

        axios.post(`${BASE_URL}/reports/`, {
            tipo: 'livro',
            alvo_id: livro.id,
            alvo_nome: livro.titulo,
            motivo: motivoReport,
            descricao: descricaoReport
        }, {
            withCredentials: true,
            headers: {'X-CSRFToken': getCSRFToken()}
        })
            .then(() => {
                alert("Denúncia submetida com sucesso. Obrigado por protegeres a comunidade!");
                setShowReportModal(false);
                setDescricaoReport("");
            })
            .catch(err => {
                alert(err.response?.data?.error || "Erro ao submeter denúncia.");
            });
    };

    if (erro) return <div className="container mt-5 text-center"><h4 className="text-muted">Livro não encontrado.</h4>
    </div>;
    if (!livro) return <div className="container mt-5 text-center">
        <div className="spinner-border"/>
    </div>;

    return (
        <div className="container mt-5 mb-5">
            <button className="btn btn-outline-secondary mb-4" onClick={() => navigate(-1)}>← Voltar</button>

            <div className="card shadow-sm border-0 mb-5">
                <div className="row g-0">
                    <div className="col-md-5 bg-light d-flex align-items-center justify-content-center p-4">
                        {livro.imagem_capa ? (
                            <img src={livro.imagem_capa} alt={livro.titulo} className="img-fluid rounded shadow"
                                 style={{maxHeight: "500px", objectFit: "contain"}}/>
                        ) : (
                            <span className="text-muted">Sem imagem de capa</span>
                        )}
                    </div>
                    <div className="col-md-7">
                        <div className="card-body p-4 p-md-5 d-flex flex-column h-100"
                             style={{backgroundColor: "var(--cream)"}}>
                            <div>
                                <h2 className="fw-bold mb-1" style={{color: "var(--dark-brown)"}}>{livro.titulo}</h2>
                                <h5 className="text-muted mb-4">{livro.autor}</h5>
                                <div className="mb-4">
                                    <span className="badge bg-secondary me-2">{livro.categoria_name}</span>
                                    <span
                                        className="badge border border-dark text-dark">{livro.estado_conservacao}</span>
                                </div>
                                <h3 className="fw-bold mb-4" style={{color: "var(--dark-brown)"}}>{livro.preco}€</h3>

                                <div className="p-3 border rounded mb-4"
                                     style={{backgroundColor: "rgba(255,255,255,0.6)"}}>
                                    <p className="mb-0 small">
                                        Vendido por: <button
                                        className="btn btn-link p-0 fw-bold text-dark text-decoration-none"
                                        onClick={() => navigate(`/profile/${livro.vendedor_name}`)}>@{livro.vendedor_name}</button>
                                        {user && (user.plano === 'Premium' || user.role === 'Admin') && livro.vendedor_top &&
                                            <span className="badge bg-warning text-dark ms-2">Vendedor Top</span>}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-auto">
                                {livro.vendido ? (
                                    <button className="btn btn-secondary w-100 fw-bold py-3" disabled>Vendido</button>
                                ) : (
                                    (!user || livro.vendedor_name !== user.username) ? (
                                        <button className="btn btn-dark w-100 fw-bold py-3" onClick={handleBuy}>Comprar
                                            Livro</button>
                                    ) : null
                                )}

                                {user && livro.vendedor_name !== user.username && (
                                    <button
                                        className="btn btn-link text-danger text-decoration-none mt-3 p-0 d-flex align-items-center gap-1 small fw-medium"
                                        onClick={() => setShowReportModal(true)}
                                    >
                                        Reportar este anúncio
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {sugestoes.length > 0 && (
                <div>
                    <h4 className="fw-bold mb-4" style={{color: "var(--dark-brown)"}}>Também te pode interessar</h4>
                    <div className="row g-4">
                        {sugestoes.map(s => (
                            <div className="col-md-4 col-lg-3" key={s.id}>
                                <div className="card h-100 shadow-sm border-0">
                                    {s.imagem_capa ? (
                                        <img src={s.imagem_capa} className="card-img-top" alt={s.titulo}
                                             style={{height: "250px", objectFit: "cover"}}/>
                                    ) : (
                                        <div
                                            className="card-img-top bg-light d-flex align-items-center justify-content-center"
                                            style={{height: "250px"}}><span className="text-muted small">Sem capa</span>
                                        </div>
                                    )}
                                    <div className="card-body d-flex flex-column" style={{backgroundColor: "white"}}>
                                        <h6 className="card-title fw-bold text-truncate mb-1">{s.titulo}</h6>
                                        <h6 className="card-subtitle small text-muted mb-2">{s.autor}</h6>
                                        <div className="mb-2">
                                            <span className="badge bg-secondary me-1">{s.categoria_name}</span>
                                            <span
                                                className="badge border border-dark text-dark">{s.estado_conservacao}</span>
                                        </div>
                                        <div className="mt-auto d-flex justify-content-between align-items-center">
                                            <h5 className="mb-0 fw-bold"
                                                style={{color: "var(--dark-brown)"}}>{s.preco}€</h5>
                                            <button className="btn btn-sm btn-outline-gold"
                                                    onClick={() => navigate(`/livro/${s.id}`)}>Ver
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showReportModal && (
                <div className="modal show d-block" style={{backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 p-2 shadow-lg" style={{backgroundColor: "var(--cream)"}}>
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold text-dark">Denunciar Anúncio</h5>
                                <button type="button" className="btn-close"
                                        onClick={() => setShowReportModal(false)}></button>
                            </div>
                            <form onSubmit={sendReport}>
                                <div className="modal-body py-4">
                                    <div className="mb-4">
                                        <label className="form-label fw-bold small text-dark">Motivo principal:</label>
                                        <select className="form-select border-0 shadow-sm" value={motivoReport}
                                                onChange={(e) => setMotivoReport(e.target.value)}>
                                            <option value="Fraude/Burla">Fraude / Tentativa de Burla</option>
                                            <option value="Conteúdo Impróprio">Fotografia ou Linguagem Imprópria
                                            </option>
                                            <option value="Preço Abusivo">Preço Irrealista / Abusivo</option>
                                            <option value="Outro motivo">Outro (especificar abaixo)</option>
                                        </select>
                                    </div>
                                    <div className="mb-2">
                                        <label className="form-label fw-bold small text-dark">Explicação adicional
                                            (opcional):</label>
                                        <textarea className="form-control border-0 shadow-sm" rows="3"
                                                  placeholder="Escreve detalhes sobre a infração..."
                                                  value={descricaoReport}
                                                  onChange={(e) => setDescricaoReport(e.target.value)} maxLength="400"
                                                  style={{resize: "none"}}/>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 pt-0 gap-2">
                                    <button type="button" className="btn btn-light px-4"
                                            onClick={() => setShowReportModal(false)}>Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-danger px-4 fw-bold">Enviar Denúncia
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}