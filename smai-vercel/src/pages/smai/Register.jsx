import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ArrowRight, UserPlus } from "lucide-react";
import SmaiNav from "@/components/smai/SmaiNav";
import SmaiFooter from "@/components/smai/SmaiFooter";

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmMsg, setConfirmMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setConfirmMsg("");
    const { data, error } = await signUp(email, password, fullName);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.user && !data.session) {
      setConfirmMsg("Check your email for a confirmation link, then log in.");
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
            <UserPlus className="w-8 h-8 text-stone-950" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Create Account</h1>
          <p className="text-stone-400">Get access to your client portal</p>
        </div>

        {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 mb-4">{error}</div>}
        {confirmMsg && <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-400 mb-4">{confirmMsg}</div>}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-stone-800 bg-stone-900/50 p-7 space-y-4">
          <div>
            <label className="text-xs font-bold tracking-wide text-stone-500 uppercase mb-1.5 block">Full Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full h-11 rounded-lg border border-stone-700 bg-stone-950 px-4 text-sm text-white outline-none focus:border-cyan-400 transition" placeholder="Jane Smith" />
          </div>
          <div>
            <label className="text-xs font-bold tracking-wide text-stone-500 uppercase mb-1.5 block">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full h-11 rounded-lg border border-stone-700 bg-stone-950 px-4 text-sm text-white outline-none focus:border-cyan-400 transition" placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-xs font-bold tracking-wide text-stone-500 uppercase mb-1.5 block">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full h-11 rounded-lg border border-stone-700 bg-stone-950 px-4 text-sm text-white outline-none focus:border-cyan-400 transition" placeholder="Min 6 characters" />
          </div>
          <button type="submit" disabled={loading} className="w-full h-12 rounded-xl electric-bg text-stone-950 font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 electric-glow">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="text-center text-sm text-stone-500 mt-6">
          Already have an account? <Link to="/smai/login" className="text-cyan-400 hover:underline">Log in</Link>
        </p>
      </div>
      <SmaiFooter />
    </div>
  );
}