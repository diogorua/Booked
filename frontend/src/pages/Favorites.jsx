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

export default function Favoritos() {
    const { user } = useUserContext();
    const navigate = useNavigate();
    const [favoritos, setFavoritos] = useState([]);

    useEffect(() => {
        // Pede ao Django a lista de favoritos
        axios.get(`${BASE_URL}/favorites/`, { withCredentials: true })
            .then(res => setFavoritos(res.data))
            .catch(err => navigate("/login"));
    }, [navigate]);

    // Função para remover da página de favoritos instantaneamente
    const removeFavorite = (livroId) => {
        axios.post(`${BASE_URL}/favorites/`, { book_id: livroId }, {
            withCredentials: true,
            headers: { 'X-CSRFToken': getCSRFToken() }
        })
        .then(() => {
            setFavoritos(favoritos.filter(livro => livro.id !== livroId));
        })
        .catch(error => {
            console.error("Erro ao remover favorito:", error);
        });
    };

    if (!user) return <div className="container mt-5 text-center"><div className="spinner-border" style={{color: "var(--dark-brown)"}}/></div>;

    return (
        <div className="container mt-5 mb-5">
            <h2 className="mb-4 fw-bold" style={{ color: "var(--dark-brown)" }}>A Minha Lista de Favoritos</h2>

            <div className="row g-4">
                {favoritos.length > 0 ? (
                    favoritos.map((livro) => (
                        <div className="col-md-4 col-lg-3" key={livro.id}>
                            <div className="card h-100 shadow-sm border-0 transition-hover position-relative">

                                <button
                                    className="btn btn-light rounded-circle shadow-sm position-absolute d-flex align-items-center justify-content-center"
                                    style={{
                                        top: "10px", right: "10px", zIndex: 10,
                                        width: "35px", height: "35px", padding: 0,
                                        color: "#dc3545",
                                        transition: "transform 0.2s ease-in-out"
                                    }}
                                    onClick={() => removeFavorite(livro.id)}
                                    title="Remover dos favoritos"
                                    onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.8)"}
                                    onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                        <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
                                    </svg>
                                </button>

                                {livro.imagem_capa ? (
                                    <img src={livro.imagem_capa} className="card-img-top" alt={livro.titulo} style={{ height: "350px", objectFit: "cover" }} />
                                ) : (
                                    <div className="card-img-top bg-light d-flex align-items-center justify-content-center" style={{ height: "350px" }}>
                                        <span className="text-muted">Sem capa</span>
                                    </div>
                                )}

                                <div className="card-body d-flex flex-column" style={{ backgroundColor: "var(--cream)" }}>
                                    <h5 className="card-title fw-bold text-truncate" title={livro.titulo}>{livro.titulo}</h5>
                                    <h6 className="card-subtitle mb-3 text-muted">{livro.autor}</h6>

                                    <div className="mt-auto d-flex justify-content-between align-items-center">
                                        <h4 className="mb-0 fw-bold" style={{ color: "var(--dark-brown)" }}>{livro.preco}€</h4>
                                        <button className="btn btn-sm btn-outline-gold">Ver Detalhes</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-12 text-center py-5 shadow-sm rounded" style={{ backgroundColor: "var(--cream)" }}>
                        <h4 className="text-muted mb-3">Ainda não tens favoritos!</h4>
                        <p className="text-muted">Navega pela página inicial e clica no coração dos livros que mais gostares.</p>
                        <button className="btn btn-dark mt-3" onClick={() => navigate('/')}>Explorar Livros</button>
                    </div>
                )}
            </div>
        </div>
    );
}