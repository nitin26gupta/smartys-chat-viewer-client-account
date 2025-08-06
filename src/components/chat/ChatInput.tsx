import React, { useState, useRef } from 'react';
import { Paperclip, Send, X, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSendMessage: () => void;
  onSendFile: (fileUrl: string, fileName: string, fileType: string, fileSize: number) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface UploadingFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
}

const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSendMessage,
  onSendFile,
  placeholder = "Type a message...",
  disabled = false
}) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    const maxSize = 20 * 1024 * 1024; // 20MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "File size must be less than 20MB",
        variant: "destructive",
      });
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "File type not supported",
        description: "Please upload images, PDFs, or documents only",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const uploadFile = async (file: File) => {
    if (!validateFile(file)) return;

    const fileId = Math.random().toString(36).substring(7);
    const uploadingFile: UploadingFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
    };

    setUploadingFiles(prev => [...prev, uploadingFile]);

    try {
      // Sanitize filename to avoid upload errors
      const sanitizedName = file.name
        .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace invalid characters with underscore
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
      
      const fileName = `${Date.now()}-${sanitizedName}`;
      const { data, error } = await supabase.storage
        .from('smartys-autozubehor-whatsapp-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('smartys-autozubehor-whatsapp-images')
        .getPublicUrl(data.path);

      // Remove from uploading list
      setUploadingFiles(prev => prev.filter(f => f.id !== fileId));

      // Send file
      onSendFile(urlData.publicUrl, file.name, file.type, file.size);

      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(uploadFile);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          uploadFile(file);
        }
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-3 w-3" />;
    return <FileText className="h-3 w-3" />;
  };

  return (
    <div className="space-y-2">
      {/* Uploading Files Preview */}
      {uploadingFiles.length > 0 && (
        <div className="px-3 py-2 space-y-2">
          {uploadingFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center space-x-2 p-2 bg-muted/50 rounded-lg text-xs"
            >
              {getFileIcon(file.type)}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
            </div>
          ))}
        </div>
      )}

      {/* Message Input */}
      <div className="flex items-center space-x-2 p-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
        
        {/* Attachment Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Text Input */}
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 border-gray-200 focus:border-green-500 focus:ring-green-500"
        />

        {/* Send Button */}
        <Button
          onClick={onSendMessage}
          disabled={!value.trim() || disabled}
          size="sm"
          className="bg-green-500 hover:bg-green-600 text-white h-8 w-8 p-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;