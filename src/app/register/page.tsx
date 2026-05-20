'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  full_name: z.string().min(1, 'Full name is required'),
  role: z.enum(['Faculty', 'HOD', 'IQAC', 'Principal', 'Admin']),
  stream: z.enum(['Aided', 'Unaided']),
  designation: z.string().min(1, 'Designation is required'),
  department_id: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface Department {
  id: string;
  name: string;
}

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      full_name: '',
      designation: '',
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get('/auth/departments');
        setDepartments(res.data);
      } catch (err) {
        console.error('Failed to fetch departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Clean up department_id if empty
      const payload = {
        ...data,
        department_id: data.department_id || undefined,
      };

      await api.post('/auth/register', payload);
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(Array.isArray(err.response.data.message) ? err.response.data.message.join(', ') : err.response.data.message);
      } else {
        setError('An error occurred during registration. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4 py-12">
      <Card className="w-full max-w-lg shadow-xl border-t-4 border-t-blue-800">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto bg-blue-900 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-xl shadow-inner mb-4">
            BKB
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Faculty Registration</CardTitle>
          <CardDescription className="text-slate-500">Create your appraisal portal account</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-8 space-y-3">
              <div className="mx-auto text-green-600 bg-green-50 rounded-full w-12 h-12 flex items-center justify-center font-bold text-2xl shadow-inner border border-green-200 animate-bounce">
                ✓
              </div>
              <p className="text-green-800 font-semibold">Registration Successful!</p>
              <p className="text-sm text-slate-500">Redirecting to the login page...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    placeholder="Dr. John Doe"
                    className="bg-slate-50 border-slate-200"
                    {...register('full_name')}
                  />
                  {errors.full_name && <p className="text-sm text-red-600">{errors.full_name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@bkbirlacollege.edu"
                    className="bg-slate-50 border-slate-200"
                    {...register('email')}
                  />
                  {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="bg-slate-50 border-slate-200"
                    {...register('password')}
                  />
                  {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    className="bg-slate-50 border border-slate-200 text-slate-900 rounded-md p-2 w-full focus:ring-2 focus:ring-blue-800 focus:border-transparent outline-none h-9 text-sm"
                    {...register('role')}
                  >
                    <option value="">Select Role</option>
                    <option value="Faculty">Faculty</option>
                    <option value="HOD">HOD</option>
                    <option value="IQAC">IQAC Coordinator</option>
                    <option value="Principal">Principal</option>
                    <option value="Admin">Administrator</option>
                  </select>
                  {errors.role && <p className="text-sm text-red-600">{errors.role.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stream">Stream</Label>
                  <select
                    id="stream"
                    className="bg-slate-50 border border-slate-200 text-slate-900 rounded-md p-2 w-full focus:ring-2 focus:ring-blue-800 focus:border-transparent outline-none h-9 text-sm"
                    {...register('stream')}
                  >
                    <option value="">Select Stream</option>
                    <option value="Aided">Aided</option>
                    <option value="Unaided">Unaided</option>
                  </select>
                  {errors.stream && <p className="text-sm text-red-600">{errors.stream.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    placeholder="Assistant Professor"
                    className="bg-slate-50 border-slate-200"
                    {...register('designation')}
                  />
                  {errors.designation && <p className="text-sm text-red-600">{errors.designation.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department_id">Department</Label>
                  <select
                    id="department_id"
                    className="bg-slate-50 border border-slate-200 text-slate-900 rounded-md p-2 w-full focus:ring-2 focus:ring-blue-800 focus:border-transparent outline-none h-9 text-sm"
                    {...register('department_id')}
                  >
                    <option value="">Select Department (Optional)</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {errors.department_id && <p className="text-sm text-red-600">{errors.department_id.message}</p>}
                </div>
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200 mt-2">{error}</p>}
              
              <Button
                type="submit"
                className="w-full bg-blue-800 hover:bg-blue-900 text-white font-medium shadow-md transition-all mt-4"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Register Securely'}
              </Button>
              
              <div className="text-center mt-4 text-sm text-slate-600">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-800 hover:underline font-medium">
                  Sign In
                </Link>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter className="justify-center text-xs text-slate-500 border-t border-slate-100 pt-4">
          Strictly On-Premise &middot; Authorized Personnel Only
        </CardFooter>
      </Card>
    </div>
  );
}
