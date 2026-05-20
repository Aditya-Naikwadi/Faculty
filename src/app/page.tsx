'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  LogOut, 
  FileText, 
  CheckCircle, 
  ShieldCheck, 
  Download, 
  Upload, 
  X,
  AlertTriangle 
} from 'lucide-react';
import axios from 'axios';

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
  const [selectedAppraisalId, setSelectedAppraisalId] = useState<number | null>(null);
  
  // Guard states for transitions
  const [confirmAction, setConfirmAction] = useState<{ id: number; action: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  const fetchAppraisals = useCallback(async (signal?: AbortSignal) => {
    setIsLoadingAppraisals(true);
    setErrorFeedback(null);
    try {
      const res = await api.get('/appraisals/', { signal });
      const data = res.data as Appraisal[];
      setAppraisals(data);
      
      // Auto-select the first cycle if none selected yet
      if (data.length > 0 && selectedAppraisalId === null) {
        setSelectedAppraisalId(data[0].id);
      }
    } catch (err: any) {
      if (axios.isCancel(err)) {
        return; // Silence aborted requests on cleanup
      }
      console.error(err);
      setErrorFeedback('Failed to fetch appraisals. Please refresh the page.');
      toast.error('Failed to load appraisal cycles.');
    } finally {
      setIsLoadingAppraisals(false);
    }
  }, [selectedAppraisalId]);

  // Clean, unbatched API fetch using AbortController for lifecycle hygiene
  useEffect(() => {
    const controller = new AbortController();
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        fetchAppraisals(controller.signal);
      }
    }
    return () => {
      controller.abort();
    };
  }, [user, loading, router, fetchAppraisals]);

  const triggerAction = async () => {
    if (!confirmAction) return;
    setIsSubmitting(true);
    setErrorFeedback(null);
    try {
      await api.post(`/appraisals/${confirmAction.id}/transition`, { 
        action: confirmAction.action 
      });
      toast.success(`Appraisal transitioned successfully: ${confirmAction.action.replace('_', ' ')}`);
      await fetchAppraisals();
      setConfirmAction(null);
    } catch (err) {
      setErrorFeedback('Action unauthorized or failed. Please check permissions.');
      toast.error('Transition action failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadDoc = async (docId: number, filename: string) => {
    let url = '';
    try {
      toast.info('Downloading file securely...');
      const res = await api.get(`/documents/${docId}/download`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      url = window.URL.createObjectURL(blob);
      
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || 'document.pdf');
      window.document.body.appendChild(link);
      link.click();
      
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      
      // Memory Management: Revoke immediately to prevent heap retention
      window.URL.revokeObjectURL(url);
      url = '';
      
      toast.success('Document downloaded successfully');
    } catch (err) {
      setErrorFeedback('Secure file download failed.');
      toast.error('Secure file download failed.');
    } finally {
      if (url) {
        window.URL.revokeObjectURL(url);
      }
    }
  };

  const handleStartAppraisal = () => {
    toast.info("Navigating to new appraisal form...");
    router.push('/appraisals/new');
  };

  const selectedAppraisal = appraisals.find(a => a.id === selectedAppraisalId) || appraisals[0] || null;

  if (loading || !user) {
    return (
      <div 
        className="flex h-screen items-center justify-center bg-slate-50"
        role="alert" 
        aria-busy="true"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Toaster position="top-right" closeButton richColors />

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10" aria-label="Main Navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-3">
                <div className="bg-slate-900 text-white rounded-md w-10 h-10 flex items-center justify-center font-bold text-lg shadow-sm" aria-hidden="true">
                  BKB
                </div>
                <span className="font-extrabold text-xl text-slate-900 tracking-tight">Appraisal Portal</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col text-right">
                <span className="text-sm font-bold text-slate-800">{user.name}</span>
                <span className="text-xs text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                  {user.role}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={logout} 
                className="text-slate-700 hover:text-red-700 hover:bg-red-50 transition-colors"
                aria-label="Logout from account"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Accessibility live error announcer */}
      {errorFeedback && (
        <div 
          className="bg-red-50 border-b border-red-200 py-3 px-4 max-w-7xl mx-auto w-full mt-4 rounded-md flex justify-between items-center text-red-900 text-sm font-semibold shadow-sm"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>{errorFeedback}</span>
          </div>
          <button 
            onClick={() => setErrorFeedback(null)} 
            className="text-red-700 hover:text-red-950 p-1"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Dashboard Panel */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome, {user.name}</h1>
            <p className="mt-1 text-slate-700 text-sm font-medium">Manage and review academic appraisals efficiently.</p>
          </div>
          {user.role === 'Faculty' && (
            <Button 
              onClick={handleStartAppraisal}
              className="bg-slate-900 hover:bg-slate-800 text-white shadow-md font-semibold shrink-0"
              aria-label="Start a new Faculty Appraisal Form"
            >
              <FileText className="mr-2 h-4 w-4" /> Start New Appraisal
            </Button>
          )}
        </div>

        {/* Master-Detail Layout optimized for 1366x768 screens */}
        <section aria-label="Faculty Appraisals List" className="flex-1">
          {isLoadingAppraisals ? (
            <div className="py-24 text-center text-slate-700 font-semibold" aria-busy="true">
              Loading appraisals, please wait...
            </div>
          ) : appraisals.length === 0 ? (
            <div className="py-20 text-center text-slate-700 bg-white border border-dashed border-slate-300 rounded-xl shadow-sm">
              No appraisal cycles active or found.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden h-[calc(100vh-14rem)] min-h-[500px]">
              
              {/* Master Cycle List Pane (Left Column) */}
              <div className="lg:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50 h-full overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Appraisal Cycles</h2>
                  <span className="text-[10px] bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded-full">
                    {appraisals.length} Total
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2" role="tablist" aria-label="Appraisal cycles select list">
                  {appraisals.map((appraisal) => {
                    const isSelected = selectedAppraisalId === appraisal.id;
                    return (
                      <button
                        key={appraisal.id}
                        onClick={() => setSelectedAppraisalId(appraisal.id)}
                        className={cn(
                          "w-full text-left p-3.5 rounded-lg border transition-all flex flex-col gap-2 outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2",
                          isSelected
                            ? "bg-white border-slate-900 shadow-sm ring-1 ring-slate-900"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                        )}
                        aria-selected={isSelected}
                        role="tab"
                        aria-controls={`appraisal-detail-pane`}
                        id={`appraisal-tab-${appraisal.id}`}
                      >
                        <div className="flex justify-between items-center w-full gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">
                            Academic Year {appraisal.academic_year}
                          </span>
                          <span 
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              appraisal.state === 'Draft' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                              appraisal.state === 'Approved_Principal' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                              'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {appraisal.state.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-700 font-semibold">
                          <span>Faculty ID: {appraisal.faculty_id}</span>
                          <span>{new Date(appraisal.updated_at || appraisal.created_at).toLocaleDateString()}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detail Pane (Right Column) */}
              <div 
                id="appraisal-detail-pane"
                className="lg:col-span-8 flex flex-col h-full bg-white overflow-hidden"
                role="tabpanel"
                aria-labelledby={selectedAppraisal ? `appraisal-tab-${selectedAppraisal.id}` : undefined}
              >
                {selectedAppraisal ? (
                  <div className="flex flex-col h-full">
                    {/* Detail Header (Sticky inside column) */}
                    <div className="p-5 border-b border-slate-200 flex justify-between items-center gap-4 bg-slate-50/50">
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h2 className="text-lg font-extrabold text-slate-900">
                            Academic Year {selectedAppraisal.academic_year}
                          </h2>
                          <span 
                            className={`px-3 py-1 rounded-full text-xs font-extrabold shadow-sm border ${
                              selectedAppraisal.state === 'Draft' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                              selectedAppraisal.state === 'Approved_Principal' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                              'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {selectedAppraisal.state.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 mt-1 font-semibold">
                          Last updated on {new Date(selectedAppraisal.updated_at || selectedAppraisal.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Detail Scrollable Body */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Faculty Information</h3>
                          <div className="text-sm space-y-1.5">
                            <p className="flex justify-between">
                              <span className="text-slate-700 font-semibold">Faculty ID:</span>
                              <span className="font-extrabold text-slate-900">{selectedAppraisal.faculty_id}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-slate-700 font-semibold">Designation:</span>
                              <span className="font-extrabold text-slate-900">{user.role === 'Faculty' ? 'Faculty Member' : 'Department Faculty'}</span>
                            </p>
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Appraisal Status Timeline</h3>
                          <div className="text-sm space-y-1.5">
                            <p className="flex justify-between">
                              <span className="text-slate-700 font-semibold">Current Phase:</span>
                              <span className="font-extrabold text-slate-900">
                                {selectedAppraisal.state === 'Draft' ? 'Faculty Draft' :
                                 selectedAppraisal.state === 'Submitted_HOD' ? 'Awaiting HOD Verification' :
                                 selectedAppraisal.state === 'Verified_HOD' ? 'Awaiting IQAC Screening' :
                                 selectedAppraisal.state === 'Screened_IQAC' ? 'Awaiting Principal Approval' :
                                 selectedAppraisal.state === 'Approved_Principal' ? 'Fully Approved' : 'Under Review'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Documents evidence container */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Attached PDF Evidence</h3>
                        {selectedAppraisal.documents && selectedAppraisal.documents.length > 0 ? (
                          <div className="grid grid-cols-1 gap-3">
                            {selectedAppraisal.documents.map((doc) => (
                              <div 
                                key={doc.id} 
                                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200 transition-all gap-4"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <FileText className="h-5 w-5 text-slate-700 shrink-0" aria-hidden="true" />
                                  {/* Allowing wrap-around names to avoid aggressive truncations */}
                                  <span className="text-xs text-slate-800 font-bold break-all whitespace-normal leading-normal">
                                    {doc.filename}
                                  </span>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="shrink-0 border-slate-300 hover:border-slate-400 hover:bg-slate-200 text-slate-800 flex items-center gap-1.5 h-9" 
                                  onClick={() => downloadDoc(doc.id, doc.filename)}
                                  aria-label={`Download document proof: ${doc.filename}`}
                                >
                                  <Download className="h-4 w-4" aria-hidden="true" />
                                  <span className="font-semibold">Download</span>
                                  <span className="sr-only">Download document</span>
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-slate-700 font-semibold text-sm">
                            No documents attached to this cycle.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Detail Footer (Sticky actions) */}
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-xs text-slate-700 font-semibold leading-relaxed max-w-md">
                        {selectedAppraisal.state === 'Draft' && 'Review your form details and uploaded evidence thoroughly before final submission.'}
                        {selectedAppraisal.state === 'Submitted_HOD' && 'Please perform audit checks on all documentation files before forwarding.'}
                        {selectedAppraisal.state === 'Verified_HOD' && 'Forward this cycle to undergo institutional IQAC performance evaluation.'}
                        {selectedAppraisal.state === 'Screened_IQAC' && 'Perform final administrative sign-off on this faculty performance file.'}
                        {selectedAppraisal.state === 'Approved_Principal' && 'This appraisal cycle has been fully completed and signed off.'}
                      </div>
                      <div className="shrink-0 w-full sm:w-auto">
                        {user.role === 'Faculty' && selectedAppraisal.state === 'Draft' && (
                          <Button 
                            onClick={() => setConfirmAction({ id: selectedAppraisal.id, action: 'submit' })} 
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold shadow w-full sm:w-auto"
                          >
                            <Upload className="mr-2 h-4 w-4" /> Submit to HOD
                          </Button>
                        )}
                        {user.role === 'HOD' && selectedAppraisal.state === 'Submitted_HOD' && (
                          <Button 
                            onClick={() => setConfirmAction({ id: selectedAppraisal.id, action: 'verify' })} 
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow w-full sm:w-auto"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" /> Verify & Forward
                          </Button>
                        )}
                        {user.role === 'IQAC' && selectedAppraisal.state === 'Verified_HOD' && (
                          <Button 
                            onClick={() => setConfirmAction({ id: selectedAppraisal.id, action: 'screen' })} 
                            className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold shadow w-full sm:w-auto"
                          >
                            <ShieldCheck className="mr-2 h-4 w-4" /> Screen & Forward
                          </Button>
                        )}
                        {user.role === 'Principal' && selectedAppraisal.state === 'Screened_IQAC' && (
                          <Button 
                            onClick={() => setConfirmAction({ id: selectedAppraisal.id, action: 'approve' })} 
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow w-full sm:w-auto"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" /> Final Approve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-700 font-semibold p-8 text-center">
                    Select an appraisal cycle from the left pane to view details.
                  </div>
                )}
              </div>

            </div>
          )}
        </section>
      </main>

      {/* Controlled Action Guards utilizing shadcn/ui AlertDialog */}
      <AlertDialog open={confirmAction !== null} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-slate-900 font-extrabold text-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" aria-hidden="true" />
              Confirm Status Transition
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-700 font-semibold text-sm leading-relaxed mt-2">
              Are you sure you want to perform the <strong className="text-slate-950 underline">{confirmAction?.action.replace('_', ' ')}</strong> transition? 
              This will submit or sign off this appraisal cycle, locking current edits and transferring control to the next authority.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel 
              disabled={isSubmitting}
              className="border-slate-300 text-slate-800 hover:bg-slate-100 hover:text-slate-950 font-bold"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault(); // Controlled confirmation handling
                triggerAction();
              }}
              disabled={isSubmitting}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold shadow"
            >
              {isSubmitting ? 'Processing...' : 'Yes, Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
