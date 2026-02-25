import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/hooks/useData';

export default function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email, password);
      // Seed React Query cache so Profile page shows user data immediately
      queryClient.setQueryData([QUERY_KEYS.user], user);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col lg:grid lg:grid-cols-2 bg-gray-50/50 lg:bg-background">
      {/* Mobile-only Branding and Background */}
      <div className="lg:hidden absolute top-0 left-0 w-full h-[45%] bg-primary overflow-hidden">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 w-full animate-fade-in">
           <div className="flex items-center gap-3">
             <img 
              src="/logo.png" 
              alt="ProSess Logo" 
              className="w-96 h-96 object-contain drop-shadow-xl" 
            />
           </div>
        </div>
        {/* Geometric Network Background (Mobile) */}
         <div className="absolute inset-0 pointer-events-none opacity-20">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid-pattern-mobile" width="50" height="50" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="currentColor" className="text-white" />
                </pattern>
              </defs>
              {/* Abstract constellation lines - Scaled for mobile */}
              <path d="M50 50 L150 150 M250 50 L150 150 M150 150 L150 300" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-white" />
              <circle cx="150" cy="150" r="2" fill="currentColor" className="text-white" />
              <circle cx="50" cy="50" r="1.5" fill="currentColor" className="text-white" />
              <circle cx="250" cy="50" r="1.5" fill="currentColor" className="text-white" />
              <path d="M-50 100 L100 250 L300 100" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.5" className="text-white" />
              <rect width="100%" height="100%" fill="url(#grid-pattern-mobile)" opacity="0.3" />
            </svg>
        </div>
      </div>

      {/* Left Column - Desktop Branding */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-primary text-primary-foreground p-12 relative overflow-hidden h-full">
        {/* Geometric Network Background */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="currentColor" />
              </pattern>
            </defs>
            {/* Abstract constellation lines */}
            <path d="M100 100 L300 300 M500 100 L300 300 M300 300 L300 600" stroke="currentColor" strokeWidth="0.5" fill="none" />
            <circle cx="300" cy="300" r="3" fill="currentColor" />
            <circle cx="100" cy="100" r="2" fill="currentColor" />
            <circle cx="500" cy="100" r="2" fill="currentColor" />
            <path d="M-100 200 L200 500 L600 200" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.5" />
            <path d="M800 0 L600 400 L900 800" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.5" />
            <rect width="100%" height="100%" fill="url(#grid-pattern)" opacity="0.1" />
          </svg>
        </div>

        <div className="relative z-10 max-w-md text-center flex flex-col items-center">
          <img 
            src="/logo.png" 
            alt="ProSess Logo" 
            className="w-96 h-96 object-contain mb-8 drop-shadow-2xl hover:scale-105 transition-transform duration-500" 
          />
         
          <div className="absolute bottom-[-200px] text-center w-full">
             <p className="text-2xl opacity-90 leading-relaxed font-light tracking-wide">
              Focus & Flow.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 relative z-10">
        <div className="w-full max-w-[400px] space-y-8 animate-fade-up bg-white p-8 rounded-3xl shadow-xl lg:shadow-none lg:p-0 lg:bg-transparent">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Sign in to ProSess.</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Enter your details to access your workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80 font-medium">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="pl-10 h-11 bg-background border-input transition-all rounded-lg focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground/80 font-medium">Password</Label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                 className="pl-10 h-11 bg-background border-input transition-all rounded-lg focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-full bg-gradient-to-r from-primary to-primary/90" 
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : 'Sign In'}
            </Button>
          </form>

          <div className="text-center text-sm pt-4">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
