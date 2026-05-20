import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../context/UserProvider";

const BASE_URL = "http://localhost:8000/booked/api";

const getCSRFToken = () => {
    return document.cookie.split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
}

function ComprasTab() {
    const [compras, setCompras] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get(`${BASE_URL}/my-purchases/`, { withCredentials: true })
            .then(res => setCompras(res.data))
            .catch(err => console.error("Erro ao carregar compras", err));
    }, []);

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
                                    <img
                                        src={compra.livro.imagem_capa}
                                        className="card-img-top"
                                        alt={compra.livro.titulo}
                                        style={{ height: "250px", objectFit: "cover" }}
                                    />
                                ) : (
                                    <div className="card-img-top bg-light d-flex align-items-center justify-content-center" style={{ height: "250px" }}>
                                        <span className="text-muted small">Sem capa</span>
                                    </div>
                                )}
                                <div className="card-body d-flex flex-column" style={{ backgroundColor: "white" }}>
                                    <h6 className="card-title fw-bold text-truncate mb-1">{compra.livro.titulo}</h6>
                                    <p className="text-muted small mb-1">{compra.livro.autor}</p>
                                    <p className="text-muted small mb-1">{compra.livro.preco}€ • {compra.livro.estado_conservacao}</p>
                                    <p className="text-muted small mb-3">Comprado em: {compra.data_compra}</p>

                                    <div className="mt-auto">
                                        <button
                                            className="btn btn-sm btn-dark w-100 fw-medium"
                                            onClick={() => navigate(`/livro/${compra.livro.id}`)}
                                        >
                                            Ver Detalhes
                                        </button>
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
        </div>
    );
}

export default function BookShelf() {
    const { user } = useUserContext();
    const navigate = useNavigate();

    const [meusLivros, setMeusLivros] = useState([]);
    const [activeTab, setActiveTab] = useState("anuncios");

    const handleEliminar = async (livroId) => {
        if (window.confirm("Eliminar este anúncio permanentemente?")) {
            try {
                await axios.delete(`${BASE_URL}/books/${livroId}/`, {
                    withCredentials: true,
                    headers: { 'X-CSRFToken': getCSRFToken() }
                });
                setMeusLivros(meusLivros.filter(l => l.id !== livroId));
            } catch (err) { alert("Não foi possível eliminar."); }
        }
    };

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        axios.get(`${BASE_URL}/my-books/`, { withCredentials: true })
            .then(res => setMeusLivros(res.data))
            .catch(err => console.error("Erro ao carregar livros", err));
    }, [user, navigate]);

    if (!user) return null;

    return (
        <div className="container mt-5 mb-5">
            <h2 className="mb-4 fw-bold" style={{ color: "var(--dark-brown)" }}>A Minha Estante</h2>

            <ul className="nav nav-tabs mb-4 border-secondary border-opacity-25">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'anuncios' ? 'active fw-bold border-bottom-0' : 'text-muted border-0'}`}
                        onClick={() => setActiveTab('anuncios')}
                        style={{
                            color: activeTab === 'anuncios' ? 'var(--dark-brown)' : '',
                            backgroundColor: activeTab === 'anuncios' ? 'var(--cream)' : 'transparent'
                        }}
                    >
                        Anúncios
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'compras' ? 'active fw-bold border-bottom-0' : 'text-muted border-0'}`}
                        onClick={() => setActiveTab('compras')}
                        style={{
                            color: activeTab === 'compras' ? 'var(--dark-brown)' : '',
                            backgroundColor: activeTab === 'compras' ? 'var(--cream)' : 'transparent'
                        }}
                    >
                        Compras
                    </button>
                </li>
            </ul>

            {activeTab === 'anuncios' && (
                <div>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="fw-bold text-dark">Os teus anúncios ativos</h5>
                    </div>

                    <div className="row g-4">
                        {meusLivros.length > 0 ? (
                            meusLivros.map((livro) => (
                                <div className="col-md-4 col-lg-3" key={livro.id}>
                                    <div className="card h-100 shadow-sm border-0">
                                        {livro.imagem_capa ? (
                                            <img
                                                src={livro.imagem_capa}
                                                className="card-img-top"
                                                alt={livro.titulo}
                                                style={{ height: "250px", objectFit: "cover" }}
                                            />
                                        ) : (
                                            <div className="card-img-top bg-light d-flex align-items-center justify-content-center" style={{ height: "250px" }}>
                                                <span className="text-muted small">Sem capa</span>
                                            </div>
                                        )}

                                        <div className="card-body d-flex flex-column" style={{ backgroundColor: "white" }}>
                                            <h6 className="card-title fw-bold text-truncate mb-1">{livro.titulo}</h6>
                                            <p className="text-muted small mb-3">{livro.preco}€ • {livro.estado_conservacao}</p>

                                            <div className="mt-auto d-flex gap-2">
                                                <button className="btn btn-sm btn-dark w-100 fw-medium" onClick={() => navigate(`/editbook/${livro.id}`)}>Editar</button>
                                                <button className="btn btn-sm btn-outline-danger w-100 fw-medium" onClick={() => handleEliminar(livro.id)}>Eliminar</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-12 text-center py-5 bg-white shadow-sm rounded">
                                <p className="text-muted mb-0">Ainda não tens nenhum livro à venda.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'compras' && <ComprasTab />}
        </div>
    );
}