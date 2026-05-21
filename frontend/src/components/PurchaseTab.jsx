import { useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = "http://localhost:8000/booked/api";

const getCSRFToken = () => {
    return document.cookie.split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1] || '';
}

export default function PurchaseTab() {
    const [compras, setCompras] = useState([]);

    // Estados para controlar a janela de avaliação
    const [showModal, setShowModal] = useState(false);
    const [alvoAvaliacao, setAlvoAvaliacao] = useState(null); // Vai guardar { vendedorId, nomeVendedor, tituloLivro }
    const [estrelas, setEstrelas] = useState(5);
    const [comentario, setComentario] = useState("");

    useEffect(() => {
        axios.get(`${BASE_URL}/my-purchases/`, { withCredentials: true })
            .then(res => setCompras(res.data))
            .catch(err => console.error("Erro ao carregar compras", err));
    }, []);

    const openAvaliationForm = (compra) => {
        setAlvoAvaliacao({
            compraId: compra.id,
            vendedorId: compra.livro.vendedor,
            nomeVendedor: compra.livro.vendedor_name,
            tituloLivro: compra.livro.titulo
        });
        setEstrelas(5);
        setComentario("");
        setShowModal(true);
    };

    const submitAvaliation = (e) => {
        e.preventDefault();
        axios.post(`${BASE_URL}/reviews/`, {
            compra_id: alvoAvaliacao.compraId,
            vendedor_id: alvoAvaliacao.vendedorId,
            estrelas: estrelas,
            comentario: comentario
        }, {
            withCredentials: true,
            headers: { 'X-CSRFToken': getCSRFToken() }
        })
        .then(() => {
            alert(`Obrigado! Avaliaste o utilizador ${alvoAvaliacao.nomeVendedor} com ${estrelas} estrelas.`);
            setCompras(compras.map(c => c.id === alvoAvaliacao.compraId ? { ...c, avaliada: true } : c));
            setShowModal(false);
        })
        .catch(err => {
            console.error(err);
            alert("Ocorreu um erro ao enviar a tua avaliação.");
        });
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold text-dark">Os teus livros comprados</h5>
            </div>

            <div className="row g-4">
                {compras.length > 0 ? (
                    compras.map(compra => (
                        <div className="col-md-4 col-lg-3" key={compra.id}>
                            <div className="card h-100 shadow-sm border-0">
                                {compra.livro.imagem_capa ? (
                                    <img src={compra.livro.imagem_capa} className="card-img-top" alt={compra.livro.titulo} style={{ height: "250px", objectFit: "cover" }} />
                                ) : (
                                    <div className="card-img-top bg-light d-flex align-items-center justify-content-center" style={{ height: "250px" }}>
                                        <span className="text-muted small">Sem capa</span>
                                    </div>
                                )}

                                <div className="card-body d-flex flex-column" style={{ backgroundColor: "white" }}>
                                    <h6 className="card-title fw-bold text-truncate mb-1">{compra.livro.titulo}</h6>
                                    <p className="text-muted small mb-1">Vendedor: <span className="fw-medium text-dark">{compra.livro.vendedor_name}</span></p>
                                    <p className="text-muted small mb-3">Comprado em: {compra.data_compra}</p>

                                    <div className="mt-auto">
                                        {compra.avaliada ? (
                                            <button className="btn btn-sm btn-success text-white w-100 fw-bold d-flex align-items-center justify-content-center gap-1" disabled>
                                                Vendedor Avaliado
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-sm btn-outline-warning text-dark w-100 fw-bold d-flex align-items-center justify-content-center gap-1"
                                                onClick={() => openAvaliationForm(compra)}
                                            >
                                                Avaliar Vendedor
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-12 text-center py-5 bg-white shadow-sm rounded">
                        <p className="text-muted mb-0">Ainda não fizeste nenhuma compra.</p>
                    </div>
                )}
            </div>

            {showModal && alvoAvaliacao && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ backgroundColor: "var(--cream)" }}>
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold text-dark">Avaliar Experiência</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <form onSubmit={submitAvaliation}>
                                <div className="modal-body py-4">
                                    <p className="text-muted small mb-3">
                                        Como correu o negócio de <strong className="text-dark">"{alvoAvaliacao.tituloLivro}"</strong> com o vendedor <strong className="text-dark">@{alvoAvaliacao.nomeVendedor}</strong>?
                                    </p>

                                    <div className="mb-4 text-center">
                                        <label className="form-label d-block fw-bold mb-2">A tua classificação:</label>
                                        <div className="fs-2" style={{ cursor: "pointer" }}>
                                            {[1, 2, 3, 4, 5].map((num) => (
                                                <span
                                                    key={num}
                                                    className={num <= estrelas ? "text-warning mx-1" : "text-secondary mx-1"}
                                                    onClick={() => setEstrelas(num)}
                                                >
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                        <small className="text-muted fw-medium mt-1 d-block">
                                            {estrelas === 5 && "Excelente vendedor!"}
                                            {estrelas === 4 && "Muito bom negócio!"}
                                            {estrelas === 3 && "Correu tudo normal."}
                                            {estrelas === 2 && "Poderia ter sido melhor."}
                                            {estrelas === 1 && "Má experiência."}
                                        </small>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold small text-dark">Deixa uma mensagem (Opcional):</label>
                                        <textarea
                                            className="form-control border-0 shadow-sm"
                                            rows="3"
                                            maxLength="500"
                                            placeholder="Ex: Livro chegou impecável e muito bem embalado. Recomendo!"
                                            value={comentario}
                                            onChange={(e) => setComentario(e.target.value)}
                                            style={{ resize: "none" }}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer border-0 pt-0 gap-2">
                                    <button type="button" className="btn btn-light px-4" onClick={() => setShowModal(false)}>Cancelar</button>
                                    <button type="submit" className="btn btn-dark px-4 fw-bold">Enviar Avaliação</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}