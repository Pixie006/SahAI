import React, { useState } from 'react';
import { SAMPLE_DOCUMENTS, SampleDocument } from '../data/sampleDocuments';
import { Camera, Upload, Sparkles, X, FileText, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (base64Data: string, queryPrompt?: string, docTitle?: string) => void;
  language: string;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onAnalyze,
  language,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<SampleDocument | null>(null);
  const [customImageBase64, setCustomImageBase64] = useState<string | null>(null);
  const [customFileName, setCustomFileName] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select an image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image file size must be under 10MB.');
      return;
    }

    setErrorMsg(null);
    setCustomFileName(file.name);
    setSelectedDoc(null);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setCustomImageBase64(base64);
    };
    reader.onerror = () => {
      setErrorMsg('Could not read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: SampleDocument) => {
    setSelectedDoc(sample);
    setCustomImageBase64(null);
    setCustomFileName('');
    setCustomPrompt(sample.simulatedQuery);
    setErrorMsg(null);
  };

  const handleConfirmAnalyze = () => {
    if (selectedDoc) {
      onAnalyze(selectedDoc.svgPreview, customPrompt || selectedDoc.simulatedQuery, selectedDoc.title);
      onClose();
    } else if (customImageBase64) {
      onAnalyze(
        customImageBase64,
        customPrompt || 'Inspect this document for an informal worker. Explain any deductions, clauses, or fees in simple words and give a next step.',
        customFileName || 'Uploaded Document'
      );
      onClose();
    } else {
      setErrorMsg('Please upload a document photo or select one of the sample worker documents.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs">
      <div 
        id="document-upload-modal"
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-emerald-700 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Document Photo Scanner</h3>
              <p className="text-xs text-emerald-100">
                Payslips, Informal Loans, Insurance & Subsidy Notices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content scroll area */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Option A: Take Photo or Upload from device */}
          <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-5 text-center bg-slate-50/50 hover:bg-emerald-50/30 transition-all relative">
            <input
              id="document-file-input"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                Snap Photo or Upload Document
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Takes a photo on mobile camera or select JPG/PNG from gallery
              </p>
            </div>
          </div>

          {/* Custom image preview if uploaded */}
          {customImageBase64 && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-900 font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Photo Ready: {customFileName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCustomImageBase64(null);
                    setCustomFileName('');
                  }}
                  className="text-emerald-700 hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
              <div className="max-h-40 overflow-hidden rounded-lg border border-emerald-200">
                <img
                  src={customImageBase64}
                  alt="Document preview"
                  className="w-full object-contain max-h-40 bg-white"
                />
              </div>
            </div>
          )}

          {/* Option B: One-Tap Sample Worker Documents */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Or Try Sample Worker Documents:
              </span>
              <span className="text-[11px] text-slate-400">One-tap evaluation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SAMPLE_DOCUMENTS.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                return (
                  <button
                    type="button"
                    key={doc.id}
                    onClick={() => handleSelectSample(doc)}
                    className={`text-left p-3 rounded-xl border text-xs transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 mb-1.5">
                        {doc.badge}
                      </span>
                      <h4 className="font-bold text-slate-900 leading-snug">{doc.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{doc.subtitle}</p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-emerald-700">
                      <span>{isSelected ? '✓ Selected' : 'Preview'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sample Document preview if selected */}
          {selectedDoc && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Preview: {selectedDoc.title}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold uppercase">Active Selection</span>
              </div>
              <div className="rounded-lg overflow-hidden border border-slate-200 shadow-inner">
                <img
                  src={selectedDoc.svgPreview}
                  alt={selectedDoc.title}
                  className="w-full object-cover max-h-44 bg-white"
                />
              </div>
            </div>
          )}

          {/* Optional specific question */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Your Specific Question (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Is this interest rate legal? Why was money deducted?"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="confirm-doc-analyze-btn"
            type="button"
            onClick={handleConfirmAnalyze}
            disabled={!selectedDoc && !customImageBase64}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Analyze Document</span>
          </button>
        </div>
      </div>
    </div>
  );
};
