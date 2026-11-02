'use client';

import React, { useState, useRef } from 'react';
import { MawbData, INITIAL_SAMPLE_MAWB, BLANK_MAWB } from '@/types/mawb';
import { MawbForm } from '@/components/mawb/MawbForm';
import { MawbSheet } from '@/components/mawb/MawbSheet';
import { downloadMawbPdf, printMawbPdf } from '@/lib/mawb-pdf-export';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import {
  Plane,
  Printer,
  Download,
  Columns,
  Eye,
  Edit3,
  ZoomIn,
  ZoomOut,
  Loader2,
  FileText,
  Layers,
} from 'lucide-react';

export default function MawbPage() {
  const [mawbData, setMawbData] = useState<MawbData>(INITIAL_SAMPLE_MAWB);
  const [viewMode, setViewMode] = useState<'split' | 'form' | 'preview'>('split');
  const [zoomScale, setZoomScale] = useState<number>(0.72);
  const [activePage, setActivePage] = useState<'both' | 'face' | 'conditions'>('both');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const toastId = toast.info('Preparing print document...', { autoClose: 2000 });

    try {
      await printMawbPdf(activePage);
      toast.dismiss(toastId);
    } catch {
      toast.dismiss(toastId);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const toastId = toast.info('Generating high-resolution MAWB PDF...', { autoClose: false });

    try {
      const cleanPrefix = mawbData.awbPrefix.replace(/[^a-zA-Z0-9]/g, '') || '077';
      const cleanSerial = mawbData.awbSerial.replace(/[^a-zA-Z0-9]/g, '_') || 'AWB';
      const fileName = `MAWB_${cleanPrefix}-${cleanSerial}.pdf`;

      await downloadMawbPdf(fileName, activePage);
      toast.dismiss(toastId);
      toast.success(`MAWB PDF downloaded: ${fileName}`);
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error('Failed to generate PDF. You can also use the "Print / Save PDF" button.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleLoadSample = () => {
    setMawbData(JSON.parse(JSON.stringify(INITIAL_SAMPLE_MAWB)));
    toast.success('Loaded sample MAWB 077-5906 6545 data');
  };

  const handleResetForm = () => {
    setMawbData(JSON.parse(JSON.stringify(BLANK_MAWB)));
    toast.info('Form cleared for new entry');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Application Bar (Hidden in Print) */}
      <div className="no-print sticky top-0 z-20 border-b border-border/80 bg-background/95 backdrop-blur-md px-4 sm:px-6 py-3.5 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between max-w-full">
          {/* Title & Badge */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 shadow-xs">
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-foreground">
                  Master Air Waybill (MAWB) Print &amp; PDF Generator
                </h1>
                <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  IATA Standard
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Full manual entry &bull; Exact replica styling &bull; 2-Page Conditions of Contract &bull; High-Res A4 Print
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Page View Selector */}
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60 text-xs">
              <button
                type="button"
                onClick={() => setActivePage('both')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activePage === 'both'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Both Page 1 (Face) and Page 2 (Conditions)"
              >
                Both Pages
              </button>
              <button
                type="button"
                onClick={() => setActivePage('face')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activePage === 'face'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Page 1 (Air Waybill Face only)"
              >
                Page 1 Face
              </button>
              <button
                type="button"
                onClick={() => setActivePage('conditions')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activePage === 'conditions'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Page 2 (Conditions of Contract only)"
              >
                Page 2 Terms
              </button>
            </div>

            {/* View Mode Toggle Buttons */}
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Side by Side (Editor + Live Preview)"
              >
                <Columns className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Split View</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('form')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  viewMode === 'form'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Editor Only"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Editor Only</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  viewMode === 'preview'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Preview Only"
              >
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Preview Only</span>
              </button>
            </div>

            {/* Print & Download Primary Actions */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="font-semibold text-xs border-2 hover:border-primary/50 cursor-pointer shadow-xs"
              >
                <Printer className="h-4 w-4 mr-1.5 text-primary" />
                Print / Save PDF
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={isExporting}
                onClick={handleDownloadPdf}
                className="bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90 cursor-pointer transition-all"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1.5" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 w-full max-w-full overflow-hidden">
        <div
          className={`h-full grid ${
            viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'
          }`}
        >
          {/* LEFT: Form Editor Panel */}
          {(viewMode === 'split' || viewMode === 'form') && (
            <div
              className={`no-print p-4 sm:p-6 lg:p-8 overflow-y-auto ${
                viewMode === 'split'
                  ? 'lg:col-span-7 xl:col-span-7 2xl:col-span-7 border-r border-border/60 max-h-[calc(100vh-65px)]'
                  : 'max-w-6xl mx-auto w-full'
              }`}
            >
              <MawbForm
                data={mawbData}
                onChange={setMawbData}
                onReset={handleResetForm}
                onLoadSample={handleLoadSample}
              />
            </div>
          )}

          {/* RIGHT: Live A4 PDF Preview Workspace */}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div
              id="mawb-print-container"
              ref={printContainerRef}
              className={`relative bg-neutral-900/10 dark:bg-neutral-950 p-4 sm:p-6 overflow-y-auto ${
                viewMode === 'split'
                  ? 'lg:col-span-5 xl:col-span-5 2xl:col-span-5 max-h-[calc(100vh-65px)]'
                  : 'w-full min-h-[calc(100vh-65px)]'
              }`}
            >
              {/* Preview Zoom Toolbar (Screen only) */}
              <div className="no-print sticky top-0 z-10 flex items-center justify-between pb-4">
                <div className="flex items-center gap-2 bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border shadow-xs text-xs">
                  <span className="font-semibold text-muted-foreground">Zoom:</span>
                  <button
                    type="button"
                    onClick={() => setZoomScale((prev) => Math.max(0.45, prev - 0.08))}
                    className="p-1 hover:bg-muted rounded transition-colors text-foreground cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-mono font-bold w-12 text-center text-foreground">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomScale((prev) => Math.min(1.3, prev + 0.08))}
                    className="p-1 hover:bg-muted rounded transition-colors text-foreground cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomScale(viewMode === 'preview' ? 1.0 : 0.72)}
                    className="ml-1 text-[11px] text-primary hover:underline font-medium cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-border/60">
                    A4 Portrait (210 &times; 297 mm)
                  </span>
                </div>
              </div>

              {/* The Live A4 Document Sheet */}
              <div className="flex justify-center items-start min-h-full pb-16">
                <MawbSheet data={mawbData} scale={zoomScale} activePage={activePage} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

