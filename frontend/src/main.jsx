import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/index.css";

import Navbar from './components/Navbar'; //componentes
import Footer from './components/Footer';
import UserProvider from "./context/UserProvider";

import Home from './pages/Home'; //páginas
import Login   from "./pages/Login";
import Signup  from "./pages/Signup";
import Profile from "./pages/Profile";
import BookForm from "./pages/BookForm.jsx";
import BookShelf from "./pages//BookShelf.jsx"
import Favorites from "./pages//Favorites.jsx"

createRoot(document.getElementById('root')).render(
    <UserProvider>
        <BrowserRouter>
            <Navbar />
            <main>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />}   />
                    <Route path="/signup" element={<Signup />}  />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/bookform" element={<BookForm />} />
                    <Route path="/editbook/:id" element={<BookForm />} />
                    <Route path="/bookshelf" element={<BookShelf />} />
                    <Route path="/favorites" element={<Favorites />} />

                </Routes>
            </main>
            <Footer />
        </BrowserRouter>
    </UserProvider>
);