import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MessageSquare, Download, Reply, Image as ImageIcon, Bot, User, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import MessageAttachment from './MessageAttachment';
import ChatInput from './ChatInput';

// Utility function to check if URL is an image
const isImageUrl = (url: string) => {
  const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i;
  return imageExtensions.test(url) || url.includes('supabase.co/storage') || url.includes('image');
};

// Utility function to detect and render URLs as clickable links
const renderTextWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      if (isImageUrl(part)) {
        return (
          <div key={index} className="space-y-2 my-2">
            <img
              src={part}
              alt="Shared image"
              className="max-w-full h-auto rounded-md cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(part, '_blank')}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden text-sm text-muted-foreground">Failed to load image</div>
            <div className="text-xs text-muted-foreground break-all">
              <a
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {part}
              </a>
            </div>
          </div>
        );
      }
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700 underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

interface ChatMessage {
  id: number;
  session_id: string;
  message: any; // Using any for now to handle the JSON data from Supabase
  timestamp?: string; // Database timestamp
}

interface UserInfo {
  user_id: string;
  user_name: string;
  phone_number: string;
}

interface ChatAreaProps {
  messages: ChatMessage[];
  loading?: boolean;
  selectedConversation: string | null;
  userInfo: UserInfo | null;
  onSendReply: (userId: string, message: string) => void;
  onSendFile: (userId: string, fileUrl: string, fileName: string, fileType: string) => void;
  onLoadPrevious?: (userId: string) => void;
}

export const ChatArea = ({ messages, loading = false, selectedConversation, userInfo, onSendReply, onSendFile, onLoadPrevious }: ChatAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [replyText, setReplyText] = useState('');
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const { t } = useLanguage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = async () => {
    const container = messagesContainerRef.current;
    if (!container || !selectedConversation || !onLoadPrevious || isLoadingPrevious) return;

    // Check if we're at the top and need to load previous messages
    if (container.scrollTop === 0 && messages.length > 0) {
      setIsLoadingPrevious(true);
      setShouldScrollToBottom(false); // Prevent auto-scroll to bottom
      const prevScrollHeight = container.scrollHeight;
      
      try {
        await onLoadPrevious(selectedConversation);
        
        // Maintain scroll position after loading previous messages
        setTimeout(() => {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - prevScrollHeight;
          setIsLoadingPrevious(false);
        }, 100);
      } catch (error) {
        setIsLoadingPrevious(false);
      }
    }
  };

  useEffect(() => {
    // Only scroll to bottom for new conversations or new messages, not when loading previous
    if (messages.length > 0 && !isLoadingPrevious && shouldScrollToBottom) {
      scrollToBottom();
    }
  }, [messages, isLoadingPrevious, shouldScrollToBottom]);

  // Reset shouldScrollToBottom when selecting a new conversation
  useEffect(() => {
    setShouldScrollToBottom(true);
  }, [selectedConversation]);

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleExportChat = () => {
    if (!messages.length) return;
    
    const chatText = messages
      .map((msg) => {
        const message = msg.message as any;
        const sender = message?.type === 'ai' && message?.sender_category === 'human_agent' ? 'Support' : message?.type === 'ai' ? 'AI' : 'Customer';
        const time = formatTimestamp(msg.timestamp || message?.timestamp);
        const content = message?.type === 'image' 
          ? `[Image: ${message?.url}]` 
          : message?.content;
        return `[${time}] ${sender}: ${content}`;
      })
      .join('\n');

    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${userInfo?.user_name || selectedConversation}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedConversation) return;
    
    onSendReply(selectedConversation, replyText.trim());
    setReplyText('');
  };

  const handleFileUploaded = (fileUrl: string, fileName: string, fileType: string) => {
    if (!selectedConversation) return;
    onSendFile(selectedConversation, fileUrl, fileName, fileType);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const MessageBubble = ({ message, isAI, isHumanAgent }: { message: ChatMessage; isAI: boolean; isHumanAgent: boolean }) => {
    const msg = message.message as any;
    const isImage = msg?.type === 'image';
    const isFile = msg?.type === 'file' || (msg?.file_url && msg?.file_name);
    
    return (
      <div className={cn("flex items-start space-x-3 animate-fade-in", (isAI || isHumanAgent) ? "flex-row" : "flex-row-reverse space-x-reverse")}>
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center", 
          isHumanAgent ? "bg-green-100" : isAI ? "bg-primary/10" : "bg-secondary"
        )}>
          {isHumanAgent ? (
            <User className="h-4 w-4 text-green-600" />
          ) : isAI ? (
            <Bot className="h-4 w-4 text-primary" />
          ) : (
            <User className="h-4 w-4" />
          )}
        </div>
        
        <div className={cn("max-w-[70%] space-y-1", (isAI || isHumanAgent) ? "items-start" : "items-end")}>
          <div className={cn(
            "px-4 py-2 rounded-lg", 
            isHumanAgent ? "bg-green-500 text-white" : isAI ? "bg-muted" : "bg-primary text-primary-foreground"
          )}>
            {isFile ? (
              <MessageAttachment
                url={msg.file_url || msg.url}
                fileName={msg.file_name || msg.filename || 'Unknown file'}
                fileType={msg.file_type || msg.mimetype || 'application/octet-stream'}
                fileSize={msg.file_size}
              />
            ) : isImage ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="h-4 w-4" />
                  <span className="text-sm">Image</span>
                </div>
                {msg?.url && (
                  <>
                    <img
                      src={msg.url}
                      alt="Shared image"
                      className="max-w-full h-auto rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(msg.url, '_blank')}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="text-xs text-muted-foreground break-all">
                      <a
                        href={msg.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {msg.url}
                      </a>
                    </div>
                  </>
                )}
                <div className="hidden text-sm text-muted-foreground">Failed to load image</div>
              </div>
            ) : (
              <div>
                {/* Show message content properly formatted */}
                {typeof msg?.content === 'string' ? (
                  <div className="text-sm whitespace-pre-wrap">
                    {renderTextWithLinks(msg.content)}
                  </div>
                ) : (
                  <pre className="text-sm whitespace-pre-wrap font-mono bg-muted p-2 rounded text-xs">
                    {JSON.stringify(msg, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
          
          <div className={cn("flex items-center space-x-2 text-xs text-muted-foreground", (isAI || isHumanAgent) ? "justify-start" : "justify-end")}>
            <span>{formatTimestamp(message.timestamp || msg?.timestamp)}</span>
            {isHumanAgent && <span className="text-green-600">Support</span>}
          </div>
        </div>
      </div>
    );
  };

  if (!selectedConversation) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
          <p className="text-sm text-gray-500">
            Choose a conversation from the sidebar to view messages
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Chat Header */}
      <div className="border-b border-gray-100 p-4 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* User Avatar */}
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center border-2 border-white shadow-sm">
              <span className="text-green-700 font-semibold text-sm">
                {userInfo?.user_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{userInfo?.user_name || 'Unknown User'}</h2>
              <p className="text-sm text-gray-500">{userInfo?.phone_number || 'No phone number'}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge 
              variant="outline" 
              className="bg-gray-50 text-gray-600 border-gray-200"
            >
              {messages.length} messages
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportChat}
              disabled={!messages.length}
              className="border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              {t('exportChat')}
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
        onScroll={handleScroll}
      >
        {isLoadingPrevious && (
          <div className="flex justify-center py-2">
            <div className="text-sm text-gray-500">Loading previous messages...</div>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No messages in this conversation</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const msg = message.message as any;
            const isAI = msg?.type === 'ai' && msg?.sender_category !== 'human_agent';
            const isHumanAgent = msg?.type === 'ai' && msg?.sender_category === 'human_agent';
            return (
              <MessageBubble
                key={message.id}
                message={message}
                isAI={isAI}
                isHumanAgent={isHumanAgent}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      {selectedConversation && (
        <div className="border-t border-gray-100 bg-white">
          <ChatInput
            value={replyText}
            onChange={setReplyText}
            onSendMessage={handleSendReply}
            onSendFile={handleFileUploaded}
            placeholder={`Message ${userInfo?.user_name || 'customer'}...`}
            disabled={!selectedConversation}
          />
        </div>
      )}
    </div>
  );
};