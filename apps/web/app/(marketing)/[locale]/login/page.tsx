'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@ui/components/button';
import { Input } from '@ui/components/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card';
import { Label } from '@ui/components/label';
import { Logo } from '@shared/components/Logo';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@repo/auth/client';
import { useQueryClient } from '@tanstack/react-query';
import { sessionQueryKey } from '@saas/auth/lib/api';
import { config } from '@repo/config';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const getRedirectPath = async (): Promise<string> => {
    try {
      // Obtener organizaciones del usuario
      const { data: organizations, error } = await authClient.organization.list();

      if (error || !organizations || organizations.length === 0) {
        // No tiene organizaciones, ir a onboarding (ruta sin locale)
        return '/app/onboarding';
      }

      // Tiene organizaciones, redirigir al dashboard de marketing de la primera
      const firstOrg = organizations[0];
      if (firstOrg.slug) {
        return `/app/${firstOrg.slug}/marketing/dashboard`;
      }
      
      // Si no tiene slug, ir a onboarding para crear/actualizar org
      return '/app/onboarding';
    } catch (error) {
      console.error('Error getting organizations:', error);
      // En caso de error, ir a onboarding
      return '/app/onboarding';
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { data: signInData, error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

      // Verificar si requiere 2FA
      if ((signInData as any)?.twoFactorRedirect) {
        router.push('/auth/verify');
        return;
      }

      // Invalidar cache de sesión
      queryClient.invalidateQueries({
        queryKey: sessionQueryKey,
      });

      // Obtener ruta de redirección basada en organizaciones
      const redirectPath = await getRedirectPath();
      
      toast.success('Welcome back!');
      router.push(redirectPath);
    } catch (error: any) {
      const errorMessage = error?.message || 'Invalid email or password';
      toast.error(errorMessage);
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const redirectPath = await getRedirectPath();
      const callbackURL = new URL(redirectPath, window.location.origin);
      
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: callbackURL.toString(),
      });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to sign in with Google');
      console.error('Google login error:', error);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LADO IZQUIERDO - Desktop Only */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-12 flex-col justify-between">
        <div>
          <div className="mb-12">
            <Logo />
            <h1 className="text-2xl font-bold mt-4 text-foreground">MarketingOS</h1>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-foreground leading-tight">
              Automatiza tu marketing con IA
            </h2>
            <p className="text-lg text-muted-foreground">
              Gestiona todas tus redes sociales, campañas y contenido desde un solo lugar.
            </p>
          </div>

          {/* Screenshot placeholder */}
          <div className="mt-12 rounded-lg border bg-white dark:bg-gray-900 p-8 shadow-xl">
            <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Dashboard Preview</p>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="mt-8 p-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-lg border">
          <p className="text-foreground italic mb-2">
            "Pasé de 2 horas diarias en redes a 15 minutos"
          </p>
          <p className="text-sm text-muted-foreground">
            - María López, La Quilmeña
          </p>
        </div>
      </div>

      {/* LADO DERECHO - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Logo Mobile */}
          <div className="lg:hidden text-center mb-8">
            <Logo />
            <h1 className="text-2xl font-bold mt-4">MarketingOS</h1>
          </div>

          <Card className="border-2">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription>Sign in to continue to MarketingOS</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Google Login */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      className="pl-10"
                      {...register('email')}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      {...register('password')}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>

              {/* Sign up link */}
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link href="/signup" className="text-primary font-medium hover:underline">
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Trust signals */}
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Trusted by 500+ businesses
            </p>
            <div className="flex items-center justify-center gap-6 opacity-60">
              {/* Placeholder logos */}
              <div className="h-8 w-20 bg-muted rounded" />
              <div className="h-8 w-20 bg-muted rounded" />
              <div className="h-8 w-20 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

