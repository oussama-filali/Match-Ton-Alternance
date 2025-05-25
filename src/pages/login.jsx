import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert(error.message);
    else {
      alert("Connecté !");
      navigate("/profile");
    }
  };

  return (
    <div className="max-w-md p-10 mx-auto">
      <h2 className="mb-4 text-xl font-bold">Connexion</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Adresse email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button type="submit" className="w-full py-2 text-white bg-blue-600 rounded">
          Se connecter
        </button>
      </form>
      <div className="mt-4 text-center">
        <span>Pas encore de compte ? </span>
        <Link to="/register" className="text-blue-600 underline">
          S'inscrire
        </Link>
      </div>
    </div>
  );
}
