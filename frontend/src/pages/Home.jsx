import { useState, useEffect } from "react";
import axios from "axios";
import { useUserContext } from "../context/UserProvider";
import { useNavigate } from "react-router-dom";

const BASE_URL = "http://localhost:8000/booked/api";

const getCSRFToken = () => {
    return document.cookie.split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
}

export default function Home() {
    const [livros, setLivros] = useState([]);
    const { user } = useUserContext();
    const navigate = useNavigate();
    const [categorias, setCategorias] = useState([]);
    const [favoritosIds, setFavoritosIds] = useState([]);
    const [pesquisa, setPesquisa] = useState("");
    const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
    const [estadoSelecionado, setEstadoSelecionado] = useState("");
    const [pagina, setPagina] = useState(1);
    const [temMais, setTemMais] = useState(false);
    const [carregando, setCarregando] = useState(false);

    useEffect(() => {
        setCarregando(true);

        const params = new URLSearchParams();
        params.append('page', pagina);
        if (pesquisa)            params.append('search', pesquisa);
        if (categoriaSelecionada) params.append('categoria', categoriaSelecionada);
        if (estadoSelecionado)   params.append('estado', estadoSelecionado);

        axios.get(`${BASE_URL}/books/?${params.toString()}`, { withCredentials: true })
            .then(res => {
                if (pagina === 1) {
                    setLivros(res.data.results);
                } else {
                    setLivros(prev => [...prev, ...res.data.results]);
                }
                setTemMais(!!res.data.next);

                if (pagina === 1) {
                    axios.get(`${BASE_URL}/categories/`)
                        .then(res => setCategorias(res.data))
                        .catch(err => console.error("Erro ao carregar as categorias", err));
                }
            })
            .catch(err => console.error("Erro ao carregar os livros", err))
            .finally(() => setCarregando(false));
    }, [pagina, pesquisa, categoriaSelecionada, estadoSelecionado]);

    useEffect(() => {
        if (user) {
            axios.get(`${BASE_URL}/favorites/`, { withCredentials: true })
                .then(res => {
                    const ids = res.data.map(livro => livro.id);
                    setFavoritosIds(ids);
                })
                .catch(err => console.error("Erro ao carregar favoritos", err));
        } else {
            setFavoritosIds([]);
        }
    }, [user]);

    useEffect(() => {
        setPagina(1);
    }, [pesquisa, categoriaSelecionada, estadoSelecionado]);

    const toggleFavorite = (livroId) => {
        if (!user) {
            alert("Precisas de ter sessão iniciada para adicionar aos favoritos!");
            return;
        }

        axios.post(`${BASE_URL}/favorites/`, { book_id: livroId }, {
            withCredentials: true,
            headers: { 'X-CSRFToken': getCSRFToken() }
        })
        .then(res => {
            if (res.data.status === "adicionado") {
                setFavoritosIds([...favoritosIds, livroId]);
            } else {
                setFavoritosIds(favoritosIds.filter(id => id !== livroId));
            }
        })
        .catch(error => {
            console.error("Erro ao atualizar favoritos:", error);
        });
    };

    const livrosFiltrados = livros.filter((livro) => {
        const termo = pesquisa.toLowerCase();
        const correspondePesquisa =
            livro.titulo.toLowerCase().includes(termo) ||
            livro.autor.toLowerCase().includes(termo);

        const correspondeCategoria = categoriaSelecionada === "" || String(livro.categoria) === categoriaSelecionada;

        const correspondeEstado = estadoSelecionado === "" || livro.estado_conservacao === estadoSelecionado;

        return correspondePesquisa && correspondeCategoria && correspondeEstado;
    });

    const limparFiltros = () => {
        setPesquisa("");
        setCategoriaSelecionada("");
        setEstadoSelecionado("");
    };

    const getNomeCategoria = (idCategoria) => {
        const cat = categorias.find(c => c.id === idCategoria);
        return cat ? cat.name : "Sem Categoria";
    };

    return (
        <div className="container mt-5 mb-5">
            <div className="text-center mb-5">
                <h1 style={{ color: "var(--dark-brown)", fontWeight: "bold" }}>Bem-vindo ao Booked</h1>
                <p className="lead text-muted">A plataforma de economia circular para os apaixonados por leitura.</p>
            </div>

            <div className="card shadow-sm border-0 mb-5" style={{ backgroundColor: "var(--cream)", borderRadius: "15px" }}>
                <div className="card-body p-4">
                    <div className="row g-3 align-items-end">

                        <div className="col-md-4">
                            <label className="form-label fw-bold text-muted small text-uppercase">Pesquisar</label>
                            <input
                                type="text"
                                className="form-control border-secondary border-opacity-25"
                                placeholder="Título ou autor..."
                                value={pesquisa}
                                onChange={(e) => setPesquisa(e.target.value)}
                            />
                        </div>

                        <div className="col-md-3">
                            <label className="form-label fw-bold text-muted small text-uppercase">Categoria</label>
                            <select
                                className="form-select border-secondary border-opacity-25"
                                value={categoriaSelecionada}
                                onChange={(e) => setCategoriaSelecionada(e.target.value)}
                            >
                                <option value="">Todas as categorias</option>
                                {categorias.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-3">
                            <label className="form-label fw-bold text-muted small text-uppercase">Estado</label>
                            <select
                                className="form-select border-secondary border-opacity-25"
                                value={estadoSelecionado}
                                onChange={(e) => setEstadoSelecionado(e.target.value)}
                            >
                                <option value="">Qualquer estado</option>
                                <option value="Novo">Novo</option>
                                <option value="Usado">Usado</option>
                                <option value="Muito Usado">Muito Usado</option>
                            </select>
                        </div>

                        <div className="col-md-2">
                            <button
                                className="btn btn-outline-secondary w-100 fw-medium"
                                onClick={limparFiltros}
                                disabled={!pesquisa && !categoriaSelecionada && !estadoSelecionado}
                            >
                                Limpar
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 style={{ color: "var(--dark-brown)" }}>Últimos Anúncios</h3>
                <span className="text-muted fw-medium">{livrosFiltrados.length} livro(s) encontrado(s)</span>
            </div>

            <div className="row g-4">
                {livrosFiltrados.length > 0 ? (
                    livrosFiltrados.map((livro) => (
                        <div className="col-md-4 col-lg-3" key={livro.id}>
                            <div className="card h-100 shadow-sm border-0 transition-hover position-relative">
                                {user && (user.plano === 'Premium' || user.role === 'Admin') && livro.vendedor_top && (
                                    <span
                                        className="badge bg-warning text-dark position-absolute shadow-sm"
                                        style={{ top: "10px", left: "10px", zIndex: 10, fontSize: "0.8rem", padding: "6px 10px" }}
                                    >
                                        Vendedor Top
                                    </span>
                                )}

                                <button
                                    className="btn btn-light rounded-circle shadow-sm position-absolute d-flex align-items-center justify-content-center"
                                    style={{
                                        top: "10px", right: "10px", zIndex: 10,
                                        width: "35px", height: "35px", padding: 0,
                                        color: favoritosIds.includes(livro.id) ? "#dc3545" : "#6c757d",
                                        transition: "transform 0.2s ease-in-out"
                                    }}
                                    onClick={() => toggleFavorite(livro.id)}
                                    onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.8)"}
                                    onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                >
                                    {favoritosIds.includes(livro.id) ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                            <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="m8 2.748l-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.171C12.72-3.042 23.333 4.867 8 15z"/>
                                        </svg>
                                    )}
                                </button>

                                <div style={{ cursor: "pointer" }} onClick={() => navigate(`/livro/${livro.id}`)}>
                                    {livro.imagem_capa ? (
                                        <img
                                            src={livro.imagem_capa}
                                            className="card-img-top"
                                            alt={livro.titulo}
                                            style={{ height: "350px", objectFit: "cover" }}
                                        />
                                    ) : (
                                        <div className="card-img-top bg-light d-flex align-items-center justify-content-center" style={{ height: "350px" }}>
                                            <span className="text-muted">Sem capa</span>
                                        </div>
                                    )}
                                </div>

                                <div className="card-body d-flex flex-column" style={{ backgroundColor: "var(--cream)" }}>
                                    <h5 className="card-title fw-bold text-truncate" title={livro.titulo}>{livro.titulo}</h5>
                                    <h6 className="card-subtitle mb-3 text-muted">{livro.autor}</h6>

                                    <div className="mb-2">
                                        <span className="badge bg-secondary me-2">{livro.categoria_name || getNomeCategoria(livro.categoria)}</span>
                                        <span className="badge border border-dark text-dark">{livro.estado_conservacao}</span>
                                    </div>

                                    <p className="small text-muted mb-3">Vendido por: {livro.vendedor_name}</p>

                                    <div className="mt-auto d-flex justify-content-between align-items-center">
                                        <h4 className="mb-0 fw-bold" style={{ color: "var(--dark-brown)" }}>{livro.preco}€</h4>
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
                        <h4 className="text-muted">Nenhum livro encontrado.</h4>
                        <p className="text-muted">Tenta usar termos diferentes na pesquisa ou limpa os filtros.</p>
                    </div>
                )}
            </div>
            {temMais && (
                <div className="text-center mt-5">
                    <button
                        className="btn btn-outline-gold px-5 py-2 fw-medium"
                        onClick={() => setPagina(prev => prev + 1)}
                        disabled={carregando}
                    >
                        {carregando
                            ? <><span className="spinner-border spinner-border-sm me-2" />A carregar...</>
                            : "Carregar mais"
                        }
                    </button>
                </div>
            )}
        </div>
    );
}