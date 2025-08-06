import React from 'react';
import { Download, FileText, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageAttachmentProps {
  url: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
}

const MessageAttachment: React.FC<MessageAttachmentProps> = ({
  url,
  fileName,
  fileType,
  fileSize
}) => {
  const isImage = fileType.startsWith('image/');
  const isPdf = fileType === 'application/pdf';

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  if (isImage) {
    return (
      <div className="max-w-xs">
        <div className="relative group cursor-pointer" onClick={() => window.open(url, '_blank')}>
          <img
            src={url}
            alt={fileName}
            className="rounded-lg max-w-full h-auto shadow-sm hover:shadow-md transition-shadow"
            style={{ maxHeight: '200px' }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
            <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 p-2 bg-muted/50 rounded">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            {getFileIcon()}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{fileName}</p>
              {fileSize && (
                <p className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="h-6 w-6 p-0"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xs">
      <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg border">
        <div className="flex-shrink-0">
          {getFileIcon()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{fileName}</p>
          {fileSize && (
            <p className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</p>
          )}
          {isPdf && (
            <p className="text-xs text-muted-foreground">PDF Document</p>
          )}
        </div>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(url, '_blank')}
            className="h-6 w-6 p-0"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-6 w-6 p-0"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessageAttachment;