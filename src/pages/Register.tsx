import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register(
        formData.email,
        formData.password,
        formData.name,
        formData.phone || undefined
      );
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
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
            <h1 className="text-4xl font-bold tracking-tight mb-2 gradient-text">Create Account</h1>
            <p className="text-muted-foreground text-base">Join ProSess to track your habits</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
                autoComplete="name"
                className="bg-background/50 border-input/50 focus:bg-background transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="bg-background/50 border-input/50 focus:bg-background transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={handleChange}
                autoComplete="tel"
                className="bg-background/50 border-input/50 focus:bg-background transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                className="bg-background/50 border-input/50 focus:bg-background transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                className="bg-background/50 border-input/50 focus:bg-background transition-all"
              />
            </div>

            <Button type="submit" className="w-full h-11 text-base shadow-lg hover:shadow-primary/25 transition-all duration-300 mt-2" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:text-primary/80 hover:underline font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
