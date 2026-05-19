'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LogOut, FileText, CheckCircle, ShieldCheck, Download, Upload } from 'lucide-react';

interface Document {
  id: number;
  filename: string;
}

interface Appraisal {
  id: number;
  academic_year: string;
  state: string;
  faculty_id: number;
  created_at: string;
  updated_at: string | null;
  documents: Document[];
}

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [isLoadingAppraisals, setIsLoadingAppraisals] = useState(true);

  const fetchAppraisals = useCallback(async () => {
    try {
      const res = await api.get('/appraisals/');
      setAppraisals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAppraisals(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      fetchAppraisals();
    }
  }, [user, loading, router, fetchAppraisals]);

  const handleAction = async (id: number, action: string) => {
    try {
      await api.post(`/appraisals/${id}/transition`, { action });
      fetchAppraisals();
    } catch {
      alert('Action failed. Ensure you have the right permissions.');
    }
  };

  const downloadDoc = async (docId: number) => {
    try {
      const res = await api.get(`/documents/${docId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'document.pdf');
      document.body.appendChild(link);
      link.click();
    } catch {
      alert('Failed to download document');
    }
  };

  if (loading || !user) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-3">
                <div className="bg-blue-900 text-white rounded-md w-10 h-10 flex items-center justify-center font-bold text-lg shadow-sm">
                  BKB
                </div>
                <span className="font-bold text-xl text-slate-800 tracking-tight">Appraisal Portal</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col text-right">
                <span className="text-sm font-semibold text-slate-900">{user.name}</span>
                <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full inline-block">{user.role}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} className="text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome, {user.name}</h1>
          <p className="mt-1 text-slate-500 text-lg">Manage and review academic appraisals efficiently.</p>
        </header>

        {user.role === 'Faculty' && (
          <div className="flex justify-end">
            <Button className="bg-blue-800 hover:bg-blue-900 text-white shadow-md">
              <FileText className="mr-2 h-4 w-4" /> Start New Appraisal
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoadingAppraisals ? (
            <div className="col-span-full py-12 text-center text-slate-500">Loading appraisals...</div>
          ) : appraisals.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white border border-dashed border-slate-300 rounded-xl">
              No appraisals found.
            </div>
          ) : (
            appraisals.map((appraisal) => (
              <Card key={appraisal.id} className="shadow-sm hover:shadow-md transition-shadow border-slate-200 overflow-hidden">
                <div className="h-2 bg-blue-800"></div>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold text-slate-800">
                      {appraisal.academic_year}
                    </CardTitle>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      appraisal.state === 'Draft' ? 'bg-slate-100 text-slate-600' :
                      appraisal.state === 'Approved_Principal' ? 'bg-green-100 text-green-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {appraisal.state.replace('_', ' ')}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-slate-600">
                    <p><span className="font-medium text-slate-900">Faculty ID:</span> {appraisal.faculty_id}</p>
                    <p><span className="font-medium text-slate-900">Last Updated:</span> {new Date(appraisal.updated_at || appraisal.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  {appraisal.documents && appraisal.documents.length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Attached Documents</p>
                      <div className="space-y-2">
                        {appraisal.documents.map((doc: Document) => (
                          <div key={doc.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-md border border-slate-100">
                            <span className="text-xs text-slate-700 truncate max-w-[150px]" title={doc.filename}>{doc.filename}</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-blue-700 hover:text-blue-900 hover:bg-blue-100" onClick={() => downloadDoc(doc.id)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex flex-wrap gap-2 justify-end">
                    {/* Role-based actions */}
                    {user.role === 'Faculty' && appraisal.state === 'Draft' && (
                      <Button size="sm" onClick={() => handleAction(appraisal.id, 'submit')} className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                        <Upload className="mr-2 h-4 w-4" /> Submit to HOD
                      </Button>
                    )}
                    {user.role === 'HOD' && appraisal.state === 'Submitted_HOD' && (
                      <Button size="sm" onClick={() => handleAction(appraisal.id, 'verify')} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full">
                        <CheckCircle className="mr-2 h-4 w-4" /> Verify & Forward
                      </Button>
                    )}
                    {user.role === 'IQAC' && appraisal.state === 'Verified_HOD' && (
                      <Button size="sm" onClick={() => handleAction(appraisal.id, 'screen')} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full">
                        <ShieldCheck className="mr-2 h-4 w-4" /> Screen & Forward
                      </Button>
                    )}
                    {user.role === 'Principal' && appraisal.state === 'Screened_IQAC' && (
                      <Button size="sm" onClick={() => handleAction(appraisal.id, 'approve')} className="bg-green-600 hover:bg-green-700 text-white w-full">
                        <CheckCircle className="mr-2 h-4 w-4" /> Final Approve
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
