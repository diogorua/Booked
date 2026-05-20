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

    useEffect(() => {
        window.scrollTo(0, 0);

        axios.get(`${BASE_URL}/books/${id}/`, {withCredentials: true})
            .then(res => {
                setLivro(res.data);

                axios.get(`${BASE_URL}/books/?categoria=${res.data.categoria}`, {withCredentials: true})
                    .then(r => {
                        const filtrados = r.data.results.filter(l => l.id !== res.data.id);

                        if (filtrados.length >= 4) {
                            setSugestoes(filtrados.slice(0, 4));
                        } else {
                            axios.get(`${BASE_URL}/books/`, {withCredentials: true})
                                .then(r2 => {
                                    const idsJa = [res.data.id, ...filtrados.map(l => l.id)];
                                    const doVendedor = r2.data.results
                                        .filter(l => l.vendedor_name === res.data.vendedor_name && !idsJa.includes(l.id));

                                    const combinados = [...filtrados, ...doVendedor];

                                    if (combinados.length >= 4) {
                                        setSugestoes(combinados.slice(0, 4));
                                    } else {
                                        const idsJa2 = [res.data.id, ...combinados.map(l => l.id)];
                                        const aleatorios = r2.data.results
                                            .filter(l => !idsJa2.includes(l.id))
                                            .slice(0, 4 - combinados.length);
                                        setSugestoes([...combinados, ...aleatorios]);
                                    }
                                });
                        }
                    });
            })
            .catch(() => setErro(true));
    }, [id]);

    if (erro) return (
        <div className="container mt-5 text-center">
            <h4 className="text-muted">Livro não encontrado.</h4>
            <button className="btn btn-outline-secondary mt-3" onClick={() => navigate('/')}>
                Voltar à Home
            </button>
        </div>
    );

    if (!livro) return (
        <div className="container mt-5 text-center">
            <div className="spinner-border" style={{color: "var(--dark-brown)"}}/>
        </div>
    );

    return (
        <div className="container mt-5 mb-5">
            <button className="btn btn-outline-secondary mb-4" onClick={() => navigate(-1)}>
                ← Voltar
            </button>

            <div className="row g-5">
                {/* Imagem — clicável e tamanho fixo */}
                <div className="col-md-4">
                    {livro.imagem_capa ? (
                        <img
                            src={livro.imagem_capa}
                            alt={livro.titulo}
                            className="rounded shadow"
                            style={{width: "100%", height: "550px", objectFit: "cover"}}
                        />
                    ) : (
                        <div
                            className="bg-light rounded d-flex align-items-center justify-content-center"
                            style={{height: "450px"}}
                        >
                            <span className="text-muted">Sem capa</span>
                        </div>
                    )}
                </div>

                {/* Detalhes */}
                <div className="col-md-8">
                    <h1 className="fw-bold" style={{color: "var(--dark-brown)"}}>{livro.titulo}</h1>
                    <h4 className="text-muted mb-4">{livro.autor}</h4>

                    <div className="mb-4">
                        <span className="badge bg-secondary me-2 fs-6">{livro.categoria_name}</span>
                        <span className="badge border border-dark text-dark fs-6">{livro.estado_conservacao}</span>
                    </div>

                    <h2 className="fw-bold mb-4" style={{color: "var(--dark-brown)"}}>
                        {livro.preco}€
                    </h2>

                    <hr/>

                    {/* Vendedor */}
                    <div className="d-flex align-items-center justify-content-between mt-4 mb-4">
                        <div>
                            <p className="text-muted mb-1 small text-uppercase fw-bold">Vendedor</p>
                            <h5 className="mb-0">{livro.vendedor_name}</h5>
                        </div>
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => navigate(`/profile/${livro.vendedor_name}`)}
                        >
                            Ver Perfil
                        </button>
                    </div>

                    <hr/>

                    {/* Botão de contacto */}
                    <div className="mt-4">
                        {livro.vendido ? (
                            <button className="btn w-100 py-3 fs-5 fw-medium" disabled
                                    style={{backgroundColor: "var(--cream)", color: "gray", border: "1px solid gray"}}>
                                Livro já vendido
                            </button>
                        ) : user && user.username !== livro.vendedor_name ? (
                            <button
                                className="btn btn-outline-gold w-100 py-3 fs-5 fw-medium"
                                onClick={async () => {
                                    if (window.confirm(`Confirmas a compra de "${livro.titulo}" por ${livro.preco}€?`)) {
                                        try {
                                            await axios.post(`${BASE_URL}/books/${livro.id}/buy/`, {}, {
                                                withCredentials: true,
                                                headers: {'X-CSRFToken': getCSRFToken()}
                                            });
                                            alert("Compra realizada com sucesso!");
                                            setLivro({...livro, vendido: true});
                                        } catch (err) {
                                            alert(err.response?.data?.error || "Erro ao realizar compra.");
                                        }
                                    }
                                }}
                            >
                                Comprar — {livro.preco}€
                            </button>
                        ) : !user ? (
                            <button
                                className="btn btn-outline-gold w-100 py-3 fs-5 fw-medium"
                                onClick={() => navigate('/login')}
                            >
                                Inicia sessão para comprar
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>

            {sugestoes.length > 0 && (
                <div className="mt-5">
                    <hr/>
                    <h4 className="fw-bold mb-4 mt-4" style={{color: "var(--dark-brown)"}}>
                        Também te pode interessar
                    </h4>
                    <div className="row g-4">
                        {sugestoes.map(s => (
                            <div className="col-md-4 col-lg-3" key={s.id}>
                                <div className="card h-100 shadow-sm border-0 position-relative">

                                    {/* Imagem clicável */}
                                    <div style={{cursor: "pointer"}} onClick={() => navigate(`/livro/${s.id}`)}>
                                        {s.imagem_capa ? (
                                            <img
                                                src={s.imagem_capa}
                                                className="card-img-top"
                                                alt={s.titulo}
                                                style={{height: "350px", objectFit: "cover"}}
                                            />
                                        ) : (
                                            <div
                                                className="card-img-top bg-light d-flex align-items-center justify-content-center"
                                                style={{height: "350px"}}>
                                                <span className="text-muted">Sem capa</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="card-body d-flex flex-column"
                                         style={{backgroundColor: "var(--cream)"}}>
                                        <h5 className="card-title fw-bold text-truncate"
                                            title={s.titulo}>{s.titulo}</h5>
                                        <h6 className="card-subtitle mb-3 text-muted">{s.autor}</h6>

                                        <div className="mb-2">
                                            <span className="badge bg-secondary me-2">{s.categoria_name}</span>
                                            <span
                                                className="badge border border-dark text-dark">{s.estado_conservacao}</span>
                                        </div>

                                        <p className="small text-muted mb-3">Vendido por: {s.vendedor_name}</p>

                                        <div className="mt-auto d-flex justify-content-between align-items-center">
                                            <h4 className="mb-0 fw-bold"
                                                style={{color: "var(--dark-brown)"}}>{s.preco}€</h4>
                                            <button
                                                className="btn btn-sm btn-outline-gold"
                                                onClick={() => navigate(`/livro/${s.id}`)}
                                            >
                                                Ver Detalhes
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}