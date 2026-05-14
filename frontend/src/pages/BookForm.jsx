import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useUserContext } from "../context/UserProvider";

const BASE_URL = "http://localhost:8000/booked/api";

const getCSRFToken = () => {
    return document.cookie.split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
}

export default function BookForm() {
    const { user } = useUserContext();
    const navigate = useNavigate();
    const { id } = useParams();

    const [categorias, setCategorias] = useState([]);
    const [imagemAtual, setImagemAtual] = useState("");
    const [imagemNova, setImagemNova] = useState(null);

    const [formData, setFormData] = useState({
        titulo: "",
        autor: "",
        categoria: "",
        estado_conservacao: "Novo",
        preco: ""
    });

    useEffect(() => {
        if (!user) { navigate("/login"); return; }

        axios.get(`${BASE_URL}/categories/`).then(res => setCategorias(res.data));

        if (id) {
            axios.get(`${BASE_URL}/books/${id}/`, { withCredentials: true })
                .then(res => {
                    setFormData({
                        titulo: res.data.titulo,
                        autor: res.data.autor,
                        categoria: res.data.categoria,
                        estado_conservacao: res.data.estado_conservacao,
                        preco: res.data.preco
                    });
                    setImagemAtual(res.data.imagem_capa);
                })
                .catch(() => navigate("/bookshelf"));
        }
    }, [id, user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        if (imagemNova) data.append("imagem_capa", imagemNova);

        try {
            const config = {
                withCredentials: true,
                headers: { 'X-CSRFToken': getCSRFToken(), 'Content-Type': 'multipart/form-data' }
            };

            if (id) {
                await axios.put(`${BASE_URL}/books/${id}/`, data, config);
                alert("Anúncio atualizado!");
            } else {
                await axios.post(`${BASE_URL}/books/`, data, config);
                alert("Anúncio criado!");
            }
            navigate("/bookshelf");
        } catch (err) { alert("Erro ao guardar o livro."); }
    };

    return (
        <div className="container mt-5">
            <h2 className="mb-4">{id ? "Editar Anúncio" : "Vender Livro"}</h2>
            <form onSubmit={handleSubmit} className="card p-4 shadow-sm border-0" style={{backgroundColor: "var(--cream)"}}>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="fw-bold">Título</label>
                        <input type="text" className="form-control" value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} required />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="fw-bold">Autor</label>
                        <input type="text" className="form-control" value={formData.autor} onChange={e => setFormData({...formData, autor: e.target.value})} required />
                    </div>
                    <div className="col-md-4 mb-3">
                        <label className="fw-bold">Categoria</label>
                        <select className="form-select" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} required>
                            <option value="">Selecionar...</option>
                            {categorias.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="col-md-4 mb-3">
                        <label className="fw-bold">Preço (€)</label>
                        <input type="number" step="0.01" className="form-control" value={formData.preco} onChange={e => setFormData({...formData, preco: e.target.value})} required />
                    </div>
                    <div className="col-md-4 mb-3">
                        <label className="fw-bold">Estado</label>
                        <select className="form-select" value={formData.estado_conservacao} onChange={e => setFormData({...formData, estado_conservacao: e.target.value})}>
                            <option value="Novo">Novo</option>
                            <option value="Usado">Usado</option>
                            <option value="Usado">Muito Usado</option>
                        </select>
                    </div>
                </div>
                <div className="mb-4">
                    <label className="fw-bold">Capa do Livro {id && "(Opcional se não quiseres mudar)"}</label>
                    <input type="file" className="form-control" onChange={e => setImagemNova(e.target.files[0])} required={!id} />
                </div>
                <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-dark w-100">{id ? "Guardar Alterações" : "Publicar"}</button>
                    <button type="button" className="btn btn-light border w-100" onClick={() => navigate(-1)}>Cancelar</button>
                </div>
            </form>
        </div>
    );
}