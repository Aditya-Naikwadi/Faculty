'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

const loginSchema = z.object({
  username: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError('');

    try {
      await api.post('/auth/login', {
        username: data.username,
        password: data.password,
      });
      // Backend sets HttpOnly cookie; refresh auth state.
      login();
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else if (err.response?.data?.message) {
        setError(Array.isArray(err.response.data.message) ? err.response.data.message.join(', ') : err.response.data.message);
      } else {
        setError('An error occurred during login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-blue-800">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto bg-blue-900 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-xl shadow-inner mb-4">
            BKB
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Faculty Appraisal</CardTitle>
          <CardDescription className="text-slate-500">B.K. Birla College (Autonomous)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Email Address</Label>
              <Input
                id="username"
                type="email"
                placeholder="faculty@bkbirlacollege.edu"
                className="bg-slate-50 border-slate-200"
                {...register('username')}
              />
              {errors.username && <p className="text-sm text-red-600">{errors.username.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                className="bg-slate-50 border-slate-200"
                {...register('password')}
              />
              {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-blue-800 hover:bg-blue-900 text-white font-medium shadow-md transition-all"
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Sign In securely'}
            </Button>
            
            <div className="text-center mt-4 text-sm text-slate-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-800 hover:underline font-medium">
                Register here
              </Link>
            </div>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-xs text-slate-500 border-t border-slate-100 pt-4">
          Strictly On-Premise &middot; Authorized Personnel Only
        </CardFooter>
      </Card>
    </div>
  );
}
