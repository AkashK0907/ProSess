import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, User, Phone, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/hooks/useData';

export default function Register() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
      const user = await register(
        formData.email,
        formData.password,
        formData.name,
        formData.phone || undefined
      );
      // Seed React Query cache so Profile page shows user data immediately
      queryClient.setQueryData([QUERY_KEYS.user], user);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
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
                <pattern id="grid-pattern-mobile-reg" width="50" height="50" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="currentColor" className="text-white" />
                </pattern>
              </defs>
              {/* Abstract constellation lines - Scaled for mobile */}
              <path d="M50 50 L150 150 M250 50 L150 150 M150 150 L150 300" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-white" />
              <circle cx="150" cy="150" r="2" fill="currentColor" className="text-white" />
              <circle cx="50" cy="50" r="1.5" fill="currentColor" className="text-white" />
              <circle cx="250" cy="50" r="1.5" fill="currentColor" className="text-white" />
              <path d="M-50 100 L100 250 L300 100" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.5" className="text-white" />
              <rect width="100%" height="100%" fill="url(#grid-pattern-mobile-reg)" opacity="0.3" />
            </svg>
        </div>
      </div>

      {/* Left Column - Branding */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-primary text-primary-foreground p-12 relative overflow-hidden h-full">
        {/* Geometric Network Background */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern-reg" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="currentColor" />
              </pattern>
            </defs>
            <path d="M100 100 L300 300 M500 100 L300 300 M300 300 L300 600" stroke="currentColor" strokeWidth="0.5" fill="none" />
            <circle cx="300" cy="300" r="3" fill="currentColor" />
            <circle cx="100" cy="100" r="2" fill="currentColor" />
            <circle cx="500" cy="100" r="2" fill="currentColor" />
            <path d="M-100 200 L200 500 L600 200" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.5" />
            <path d="M800 0 L600 400 L900 800" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.5" />
            <rect width="100%" height="100%" fill="url(#grid-pattern-reg)" opacity="0.1" />
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
              Start your journey.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 relative z-10">
        <div className="w-full max-w-[400px] space-y-6 animate-fade-up bg-white p-8 rounded-3xl shadow-xl lg:shadow-none lg:p-0 lg:bg-transparent">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Create Account</h2>
             <p className="text-muted-foreground mt-2 text-sm">
              Sign up to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground/80 font-medium">Full Name</Label>
              <div className="relative group">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                  className="pl-10 h-10 bg-background border-input transition-all rounded-lg focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80 font-medium">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className="pl-10 h-10 bg-background border-input transition-all rounded-lg focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground/80 font-medium">Phone (Optional)</Label>
              <div className="relative group">
                <Phone className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  className="pl-10 h-10 bg-background border-input transition-all rounded-lg focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground/80 font-medium">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                   className="pl-10 h-10 bg-background border-input transition-all rounded-lg focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground/80 font-medium">Confirm Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    className="pl-10 h-10 bg-background border-input transition-all rounded-lg focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base font-semibold shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-full mt-2 bg-gradient-to-r from-primary to-primary/90" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : 'Create Account'}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
