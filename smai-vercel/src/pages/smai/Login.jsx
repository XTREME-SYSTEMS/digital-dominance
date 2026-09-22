import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ArrowRight, LogIn } from "lucide-react";
import SmaiNav from "@/components/smai/SmaiNav";
import SmaiFooter from "@/components/smai/SmaiFooter";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate("/smai/portal");
    }
  };

  return (
    <div className="min-h-screen bg-stone-950">
      <SmaiNav />
      <div className="max-w-md mx-auto px-6 py-20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl electric-bg flex items-center justify-center mx-auto mb-6 electric-glow">
            <LogIn className="w-8 h-8 text-stone-950" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Welcome Back</h1>
          <p className="text-stone-400">Log in to your client portal</p>
        </div>

        {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-stone-800 bg-stone-900/50 p-7 space-y-4">
          <div>
            <label className="text-xs font-bold tracking-wide text-stone-500 uppercase mb-1.5 block">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full h-11 rounded-lg border border-stone-700 bg-stone-950 px-4 text-sm text-white outline-none focus:border-cyan-400 transition" placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-xs font-bold tracking-wide text-stone-500 uppercase mb-1.5 block">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full h-11 rounded-lg border border-stone-700 bg-stone-950 px-4 text-sm text-white outline-none focus:border-cyan-400 transition" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="w-full h-12 rounded-xl electric-bg text-stone-950 font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 electric-glow">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Log In <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="text-center text-sm text-stone-500 mt-6">
          Don't have an account? <Link to="/smai/register" className="text-cyan-400 hover:underline">Register here</Link>
        </p>
      </div>
      <SmaiFooter />
    </div>
  );
}