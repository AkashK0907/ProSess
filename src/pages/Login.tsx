import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-background via-background to-secondary/20 animate-gradient" />

      {/* Floating decorative orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-32 right-1/3 w-80 h-80 bg-gradient-to-br from-accent/8 to-transparent rounded-full blur-3xl animate-float-delay-1" />
      </div>
      
      <div className="w-full max-w-md relative z-10 animate-fade-up">
        {/* Glassmorphism Card */}
        <div className="backdrop-blur-xl bg-card/60 border border-border/50 p-8 rounded-2xl shadow-xl ring-1 ring-white/5">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2 gradient-text">Welcome Back</h1>
            <p className="text-muted-foreground text-base">Sign in to your ProSess account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-background/50 border-input/50 focus:bg-background transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="bg-background/50 border-input/50 focus:bg-background transition-all"
              />
            </div>

            <Button type="submit" className="w-full h-11 text-base shadow-lg hover:shadow-primary/25 transition-all duration-300" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:text-primary/80 hover:underline font-semibold transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
