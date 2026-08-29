import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  ArrowLeft,
  Paperclip,
  Clock,
  Upload,
  Calendar,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  ChevronDown,
  X,
  Image as ImageIcon,
  FileText,
  Plus,
} from 'lucide-react';

interface AttachedFile {
  id: string;
  name: string;
  size: string;
  url: string;
  isImage: boolean;
}

interface ComposeEmailPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const ComposeEmailPage: React.FC<ComposeEmailPageProps> = ({ onBack, onSuccess }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const [fromEmail, setFromEmail] = useState(user?.email || '');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [delaySeconds, setDelaySeconds] = useState('00');
  const [hourlyLimit, setHourlyLimit] = useState('50');
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isSendLaterOpen, setIsSendLaterOpen] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddRecipient = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && recipientInput.trim()) {
      e.preventDefault();

      const email = recipientInput.trim().toLowerCase();
      if (!recipients.includes(email)) {
        setRecipients([...recipients, email]);
      }
      setRecipientInput('');
    }
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/emails/parse-recipients', formData);
      if (res.data.recipients && res.data.recipients.length > 0) {
        const merged = Array.from(new Set([...recipients, ...res.data.recipients]));
        setRecipients(merged);
      }
    } catch (err: any) {
      alert('Failed to parse recipient list from file.');
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      const isImage = file.type.startsWith('image/');
      const reader = new FileReader();

      reader.onload = () => {
        const base64Url = reader.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            name: file.name,
            size: sizeMB,
            url: base64Url,
            isImage,
          },
        ]);
      };

      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const handleScheduleSubmit = async () => {
    if (recipients.length === 0) {
      setError('Please add at least one recipient email.');
      return;
    }
    if (!subject.trim()) {
      setError('Subject is required.');
      return;
    }
    if (!body.trim() && attachments.length === 0) {
      setError('Email body or an attached image is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let scheduledAtTime: string | undefined = undefined;
      let delay = parseInt(delaySeconds || '0', 10);

      if (scheduledDateTime) {
        scheduledAtTime = new Date(scheduledDateTime).toISOString();
      } else if (selectedPreset) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (selectedPreset.includes('10:00 AM')) tomorrow.setHours(10, 0, 0, 0);
        else if (selectedPreset.includes('11:00 AM')) tomorrow.setHours(11, 0, 0, 0);
        else if (selectedPreset.includes('3:00 PM')) tomorrow.setHours(15, 0, 0, 0);
        else tomorrow.setHours(9, 0, 0, 0);
        scheduledAtTime = tomorrow.toISOString();
      }

      // Package body with attached images embedded
      let finalBody = body;
      if (attachments.length > 0) {
        const attachmentsHtml = attachments
          .map(
            (att) =>
              `<div style="margin-top: 16px; display: inline-block; margin-right: 14px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; padding: 8px; background: #ffffff; width: 180px; vertical-align: top; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                ${att.isImage ? `<img src="${att.url}" alt="${att.name}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 8px; display: block;" />` : ''}
                <div style="font-size: 11px; font-weight: 600; color: #111827; margin-top: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${att.name}</div>
                <div style="font-size: 10px; color: #9ca3af;">${att.size}</div>
              </div>`
          )
          .join('');

        finalBody = `${body || ''}<br/><div class="email-attachments" style="margin-top: 20px; border-top: 1px solid #f3f4f6; padding-top: 14px;">${attachmentsHtml}</div>`;
      }

      await api.post('/emails/schedule', {
        fromEmail: fromEmail.trim() || undefined,
        recipients,
        subject,
        body: finalBody,
        delaySeconds: delay,
        hourlyLimit: parseInt(hourlyLimit || '50', 10),
        scheduledAtTime,
      });


      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to dispatch email job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen flex-1 p-6 max-w-5xl mx-auto space-y-6 relative">
      {/* Hidden File Input for Custom Attachments/Images */}
      <input
        type="file"
        ref={attachmentInputRef}
        accept="image/*,.pdf,.doc,.docx,.png,.jpg,.jpeg"
        multiple
        onChange={handleAttachmentChange}
        className="hidden"
      />

      {/* Top Header Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Compose New Email
          </h1>
        </div>

        {/* Right Action Icons & Send Later Button */}
        <div className="flex items-center gap-4 relative">
          <button
            type="button"
            onClick={() => attachmentInputRef.current?.click()}
            title="Attach images or files"
            className="text-gray-500 hover:text-emerald-600 transition-colors relative p-1"
          >
            <Paperclip className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] text-gray-600 font-bold absolute -bottom-2 -right-1 bg-gray-100 px-1 rounded-full border border-gray-200">
              {attachments.length}
            </span>
          </button>

          <button
            onClick={() => setIsSendLaterOpen(!isSendLaterOpen)}
            className="text-gray-500 hover:text-emerald-600 transition-colors"
          >
            <Clock className="w-4 h-4 text-emerald-600" />
          </button>

          <button
            onClick={() => {
              if (isSendLaterOpen) {
                handleScheduleSubmit();
              } else {
                setIsSendLaterOpen(true);
              }
            }}
            disabled={loading}
            className="py-1.5 px-4 rounded-full border border-emerald-500 text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 font-semibold text-xs transition-all duration-200 shadow-sm"
          >
            {loading ? 'Sending...' : 'Send Later'}
          </button>

          {/* Send Later Floating Popover Modal */}
          {isSendLaterOpen && (
            <div className="absolute right-0 top-12 w-72 bg-white rounded-2xl border border-gray-200 shadow-2xl p-5 z-50 space-y-4">
              <h3 className="font-bold text-sm text-gray-900">Send Later</h3>

              {/* Date & Time Picker */}
              <div className="relative">
                <input
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => {
                    setScheduledDateTime(e.target.value);
                    setSelectedPreset(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Presets List */}
              <div className="space-y-1.5 pt-1 text-xs">
                {[
                  'Tomorrow',
                  'Tomorrow, 10:00 AM',
                  'Tomorrow, 11:00 AM',
                  'Tomorrow, 3:00 PM',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(preset);
                      setScheduledDateTime('');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedPreset === preset
                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Popover Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsSendLaterOpen(false)}
                  className="text-xs text-gray-500 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSendLaterOpen(false);
                    handleScheduleSubmit();
                  }}
                  className="py-1.5 px-4 rounded-full border border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-semibold text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* From Row (User Defined Input) */}
        <div className="flex items-center gap-6 border-b border-gray-100 pb-3">
          <label className="w-14 text-xs font-medium text-gray-400 shrink-0">From</label>
          <input
            type="text"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            placeholder="e.g. sender@company.com or Your Name <sender@company.com>"
            className="flex-1 text-xs text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent font-medium"
          />
        </div>


        {/* To Row (Recipients + Upload List) */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-6 flex-1 flex-wrap">
            <label className="w-14 text-xs font-medium text-gray-400 shrink-0">To</label>
            <div className="flex-1 flex flex-wrap items-center gap-2">
              {recipients.slice(0, 3).map((email, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500 text-emerald-700 text-xs font-medium bg-emerald-50/50"
                >
                  <span>{email}</span>
                  <button
                    onClick={() => removeRecipient(idx)}
                    className="hover:text-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {recipients.length > 3 && (
                <span className="px-2.5 py-1 rounded-full border border-emerald-500 text-emerald-700 text-xs font-bold bg-emerald-50">
                  +{recipients.length - 3}
                </span>
              )}

              <input
                type="email"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                onKeyDown={handleAddRecipient}
                placeholder={recipients.length === 0 ? 'recipient@example.com' : 'Add email...'}
                className="text-xs text-gray-800 placeholder-gray-400 focus:outline-none min-w-[150px] py-1 bg-transparent"
              />
            </div>
          </div>

          {/* Upload List Action */}
          <div className="shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload List</span>
            </button>
          </div>
        </div>

        {/* Subject Row */}
        <div className="flex items-center gap-6 border-b border-gray-100 pb-3">
          <label className="w-14 text-xs font-medium text-gray-400">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="flex-1 text-xs text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
          />
        </div>

        {/* Delay & Rate Limit Row */}
        <div className="flex items-center gap-8 pt-1">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-700 font-medium">Delay between 2 emails</span>
            <input
              type="number"
              min="0"
              value={delaySeconds}
              onChange={(e) => setDelaySeconds(e.target.value)}
              className="w-14 px-2 py-1 rounded-xl border border-gray-200 text-xs text-center text-gray-800 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-700 font-medium">Hourly Limit</span>
            <input
              type="number"
              min="1"
              value={hourlyLimit}
              onChange={(e) => setHourlyLimit(e.target.value)}
              className="w-14 px-2 py-1 rounded-xl border border-gray-200 text-xs text-center text-gray-800 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Large Email Body Editor Card with Toolbar */}
      <div className="bg-[#fafbfc] rounded-2xl border border-gray-200 p-5 space-y-4">
        {/* Formatting Toolbar */}
        <div className="flex items-center gap-3 py-2 px-3 bg-white rounded-xl border border-gray-100 shadow-sm text-gray-600 text-xs flex-wrap">
          <button type="button" className="hover:text-gray-900"><Undo className="w-3.5 h-3.5" /></button>
          <button type="button" className="hover:text-gray-900"><Redo className="w-3.5 h-3.5" /></button>
          <div className="h-3.5 w-px bg-gray-200" />
          <button type="button" className="font-bold hover:text-gray-900 flex items-center gap-0.5"><span>TT</span></button>
          <button type="button" className="font-bold hover:text-gray-900"><Bold className="w-3.5 h-3.5" /></button>
          <button type="button" className="italic hover:text-gray-900"><Italic className="w-3.5 h-3.5" /></button>
          <button type="button" className="underline hover:text-gray-900"><Underline className="w-3.5 h-3.5" /></button>
          <div className="h-3.5 w-px bg-gray-200" />
          <button type="button" className="hover:text-gray-900"><AlignLeft className="w-3.5 h-3.5" /></button>
          <button type="button" className="hover:text-gray-900"><ListOrdered className="w-3.5 h-3.5" /></button>
          <button type="button" className="hover:text-gray-900"><List className="w-3.5 h-3.5" /></button>
          <button type="button" className="hover:text-gray-900"><Quote className="w-3.5 h-3.5" /></button>
          <button type="button" className="hover:text-gray-900"><Strikethrough className="w-3.5 h-3.5" /></button>
          
          <div className="h-3.5 w-px bg-gray-200" />
          {/* Custom Image/Attachment Picker button */}
          <button
            type="button"
            onClick={() => attachmentInputRef.current?.click()}
            className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            title="Attach image or file"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Add Image</span>
          </button>
        </div>

        {/* Text Area */}
        <textarea
          rows={8}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type Your Reply..."
          className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none resize-none leading-relaxed"
        />

        {/* User Attached Images & Files Previews */}
        {attachments.length > 0 ? (
          <div className="pt-4 border-t border-gray-200/60 space-y-2">
            <div className="text-xs font-semibold text-gray-600 flex items-center justify-between">
              <span>Attached Files ({attachments.length})</span>
              <button
                type="button"
                onClick={() => attachmentInputRef.current?.click()}
                className="text-emerald-600 hover:underline text-[11px] font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add More</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="w-44 rounded-xl border border-gray-200 overflow-hidden bg-white p-2 space-y-1.5 shadow-sm relative group hover:border-emerald-400 transition-colors"
                >
                  {/* Delete attachment button */}
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors z-10"
                    title="Remove attachment"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  {att.isImage ? (
                    <img
                      src={att.url}
                      alt={att.name}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-24 bg-gray-50 flex flex-col items-center justify-center rounded-lg text-gray-400">
                      <FileText className="w-8 h-8 text-gray-400" />
                      <span className="text-[10px] text-gray-400 uppercase mt-1">File</span>
                    </div>
                  )}

                  <div className="px-1 text-[11px]">
                    <div className="font-semibold text-gray-800 truncate" title={att.name}>
                      {att.name}
                    </div>
                    <div className="text-gray-400 text-[10px]">{att.size}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="pt-3 border-t border-gray-200/60 flex items-center justify-between text-xs text-gray-400">
            <span>No images or files attached yet.</span>
            <button
              type="button"
              onClick={() => attachmentInputRef.current?.click()}
              className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Choose Image / Attachment</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-600 rounded-xl">
          {error}
        </div>
      )}
    </div>
  );
};
