import {useState} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import axios from 'axios';
import {useUserContext} from '../context/UserProvider';

const SIGNUP_URL = 'http://localhost:8000/booked/api/signup/';
const USER_URL = 'http://localhost:8000/booked/api/user/';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [plano, setPlano] = useState('Base');
    const [erro, setErro] = useState('');
    const navigate = useNavigate();
    const {setUser} = useUserContext()
    const [distrito, setDistrito] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setErro('');
        axios.post(SIGNUP_URL, {username, email, password, plano, distrito}, {withCredentials: true})
            .then(() => axios.get(USER_URL, {withCredentials: true}))
            .then(res => {
                setUser(res.data);
                navigate('/');
            })
            .catch(err => setErro(err.response?.data?.msg || 'Erro ao registar.'));
    };

    return (
        <div className="container mt-5" style={{maxWidth: '420px'}}>
            <h2 className="mb-4">Criar conta</h2>

            {erro && <div className="alert alert-danger">{erro}</div>}

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Username</label>
                    <input
                        type="text"
                        className="form-control"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                        type="password"
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Distrito</label>
                    <select
                        className="form-select"
                        value={distrito}
                        onChange={(e) => setDistrito(e.target.value)}
                    >
                        <option value="">Seleciona o teu distrito</option>
                        <option value="Aveiro">Aveiro</option>
                        <option value="Beja">Beja</option>
                        <option value="Braga">Braga</option>
                        <option value="Bragança">Bragança</option>
                        <option value="Castelo Branco">Castelo Branco</option>
                        <option value="Coimbra">Coimbra</option>
                        <option value="Évora">Évora</option>
                        <option value="Faro">Faro</option>
                        <option value="Guarda">Guarda</option>
                        <option value="Leiria">Leiria</option>
                        <option value="Lisboa">Lisboa</option>
                        <option value="Portalegre">Portalegre</option>
                        <option value="Porto">Porto</option>
                        <option value="Santarém">Santarém</option>
                        <option value="Setúbal">Setúbal</option>
                        <option value="Viana do Castelo">Viana do Castelo</option>
                        <option value="Vila Real">Vila Real</option>
                        <option value="Viseu">Viseu</option>
                        <option value="Açores">Açores</option>
                        <option value="Madeira">Madeira</option>
                    </select>
                </div>
                <div className="mb-3">
                    <label className="form-label">Plano</label>
                    <select
                        className="form-select"
                        value={plano}
                        onChange={(e) => setPlano(e.target.value)}
                    >
                        <option value="Base">Base</option>
                        <option value="Premium">Premium</option>
                    </select>
                </div>
                <button type="submit" className="btn btn-dark w-100">Registar</button>
            </form>

            <p className="mt-3 text-center">
                Já tens conta? <Link to="/login">Entra aqui</Link>
            </p>
        </div>
    );
};

export default Signup;