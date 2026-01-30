import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Film } from 'lucide-react';

interface SignupProps {
  onToggle: () => void;
}

export function Signup({ onToggle }: SignupProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
        <div className="max-w-md w-full">
          <div className="card p-8 space-y-6 text-center shadow-2xl shadow-black/50">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Film className="w-8 h-8 text-[var(--accent-red)]" />
              <h1 className="text-2xl font-bold text-white">Welcome!</h1>
            </div>
            <p className="text-[var(--text-secondary)]">Your account has been created. Sign in to get started.</p>
            <button
              onClick={onToggle}
              className="btn-primary w-full"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Film className="w-8 h-8 text-[var(--accent-red)]" />
            <h1 className="text-4xl font-bold text-white">SceneVault</h1>
          </div>
          <p className="text-[var(--text-secondary)]">Create your account</p>
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

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-[var(--text-secondary)]">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onToggle}
              className="text-[var(--accent-red)] hover:text-white font-medium transition"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
