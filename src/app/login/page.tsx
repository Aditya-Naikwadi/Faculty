'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const res = await api.post('/auth/login', formData);
      login(res.data.access_token);
    } catch {
      setError('Invalid email or password');
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
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="faculty@bkbirlacollege.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-50 border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-50 border-slate-200"
              />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-blue-800 hover:bg-blue-900 text-white font-medium shadow-md transition-all"
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Sign In securely'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-xs text-slate-500 border-t border-slate-100 pt-4">
          Strictly On-Premise &middot; Authorized Personnel Only
        </CardFooter>
      </Card>
    </div>
  );
}
