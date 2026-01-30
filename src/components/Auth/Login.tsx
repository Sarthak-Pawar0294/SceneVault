import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Film } from 'lucide-react';

interface LoginProps {
  onToggle: () => void;
}

export function Login({ onToggle }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Film className="w-8 h-8 text-[var(--accent-red)]" />
            <h1 className="text-4xl font-bold text-white">SceneVault</h1>
          </div>
          <p className="text-[var(--text-secondary)]">Organize and manage your personal scene collection</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-6 shadow-2xl shadow-black/50">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-[12px] text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-[var(--text-secondary)]">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onToggle}
              className="text-[var(--accent-red)] hover:text-white font-medium transition"
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
