import { useState } from "react";
import { Lock, User } from "lucide-react";
import api from "./api";

// Definimos la interfaz para que TypeScript no se queje
interface LoginProps {
  onLogin: (user: any) => void; // Ahora onLogin aceptará los datos del usuario
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setError("");

    try {
      // 1. Enviamos credenciales
      const res = await api.post("/login", {
        username,
        password,
      });

      // 2. Extraemos el objeto 'user' que nos mandó el backend nuevo
      const usuarioData = res.data.user;

      // 3. ¡PASO CLAVE! Guardamos al usuario en el "disco duro" del navegador.
      // Así, las otras pantallas (como Nueva Orden) pueden leer quién está logueado.
      localStorage.setItem("usuario_activo", JSON.stringify(usuarioData));

      // 4. Avisamos a App.tsx y le pasamos los datos (por si quiere poner el nombre en la barra de arriba)
      onLogin(usuarioData);
    } catch (err: any) {
      // Mejoramos el error para leer lo que manda el servidor (ej: "Usuario inactivo")
      if (err.response && err.response.data) {
        setError("❌ " + err.response.data.message);
      } else {
        setError("❌ Error al conectar con el servidor");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-900">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-96">
        {/* Header Visual */}
        <div className="text-center mb-8">
          <div className="bg-blue-100 p-4 rounded-full inline-block mb-4">
            <Lock className="w-8 h-8 text-blue-900" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Compucel</h1>
          <p className="text-gray-500 text-sm">
            Sistema de Control & Auditoría
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                className="pl-10 w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Ej: admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="password"
                className="pl-10 w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="animate-pulse bg-red-100 border-l-4 border-red-500 text-red-700 p-3 text-sm font-bold text-center rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded transition shadow-lg transform active:scale-95"
          >
            INGRESAR AL SISTEMA
          </button>
        </form>
      </div>
    </div>
  );
}
