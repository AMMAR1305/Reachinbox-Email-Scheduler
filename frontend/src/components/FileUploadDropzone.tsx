import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface FileUploadDropzoneProps {
  onEmailsExtracted: (emails: string[]) => void;
}

export const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({
  onEmailsExtracted,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    filename: string;
    detectedCount: number;
    uniqueCount: number;
    duplicatesRemoved: number;
    recipients: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/emails/parse-recipients', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      onEmailsExtracted(res.data.recipients);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to parse file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-slate-900/60 border border-dashed border-slate-700 hover:border-brand-500 transition-all">
      <div className="flex flex-col items-center justify-center text-center space-y-2">
        <div className="p-3 rounded-full bg-slate-800 border border-slate-700 text-brand-400">
          {loading ? (
            <RefreshCw className="w-6 h-6 animate-spin" />
          ) : (
            <Upload className="w-6 h-6" />
          )}
        </div>

        <div>
          <label className="text-sm font-semibold text-brand-400 hover:text-brand-300 cursor-pointer">
            <span>Upload CSV or TXT file</span>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
              disabled={loading}
            />
          </label>
          <span className="text-xs text-slate-400"> to auto-detect recipient emails</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Automated regex detection & duplicate email removal enabled.
        </p>
      </div>

      {result && (
        <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Extracted from {result.filename}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 text-slate-300">
            <div>
              Detected: <strong className="text-white">{result.detectedCount}</strong>
            </div>
            <div>
              Duplicates Removed: <strong className="text-amber-400">{result.duplicatesRemoved}</strong>
            </div>
            <div>
              Unique Added: <strong className="text-emerald-400">{result.uniqueCount}</strong>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
