import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MessageSquare, Download, Reply, Image as ImageIcon, Bot, User, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: number;
  session_id: string;
  message: any; // Using any for now to handle the JSON data from Supabase
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
}

export const ChatArea = ({ messages, loading = false, selectedConversation, userInfo, onSendReply }: ChatAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [replyText, setReplyText] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        const sender = message?.type === 'ai' ? 'AI' : 'Customer';
        const time = formatTimestamp(message?.timestamp);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const MessageBubble = ({ message, isAI, isSupportReply }: { message: ChatMessage; isAI: boolean; isSupportReply: boolean }) => {
    const msg = message.message as any;
    const isImage = msg?.type === 'image';
    
    return (
      <div className={cn("flex items-start space-x-3 animate-fade-in", (isAI || isSupportReply) ? "flex-row" : "flex-row-reverse space-x-reverse")}>
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center", 
          isAI ? "bg-primary/10" : isSupportReply ? "bg-green-100" : "bg-secondary"
        )}>
          {isAI ? (
            <Bot className="h-4 w-4 text-primary" />
          ) : isSupportReply ? (
            <User className="h-4 w-4 text-green-600" />
          ) : (
            <User className="h-4 w-4" />
          )}
        </div>
        
        <div className={cn("max-w-[70%] space-y-1", (isAI || isSupportReply) ? "items-start" : "items-end")}>
          <div className={cn(
            "px-4 py-2 rounded-lg", 
            isAI ? "bg-muted" : isSupportReply ? "bg-green-500 text-white" : "bg-primary text-primary-foreground"
          )}>
            {isImage ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="h-4 w-4" />
                  <span className="text-sm">Image</span>
                </div>
                {msg?.url && (
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
                )}
                <div className="hidden text-sm text-muted-foreground">Failed to load image</div>
              </div>
            ) : (
              <div>
                {/* Show message content properly formatted */}
                {typeof msg?.content === 'string' ? (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <pre className="text-sm whitespace-pre-wrap font-mono bg-muted p-2 rounded text-xs">
                    {JSON.stringify(msg, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
          
          <div className={cn("flex items-center space-x-2 text-xs text-muted-foreground", (isAI || isSupportReply) ? "justify-start" : "justify-end")}>
            <span>{formatTimestamp(msg?.timestamp)}</span>
            {isSupportReply && <span className="text-green-600">Support</span>}
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
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
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
            const isAI = msg?.type === 'ai';
            const isSupportReply = msg?.type === 'support_reply';
            return (
              <MessageBubble
                key={message.id}
                message={message}
                isAI={isAI}
                isSupportReply={isSupportReply}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Input Area */}
      {selectedConversation && (
        <div className="border-t border-gray-100 p-4 bg-white">
          <div className="flex items-center space-x-3">
            <Input
              placeholder={`Message ${userInfo?.user_name || 'customer'}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 border-gray-200 focus:border-green-500 focus:ring-green-500"
            />
            <Button
              onClick={handleSendReply}
              disabled={!replyText.trim()}
              size="sm"
              className="bg-green-500 hover:bg-green-600 text-white px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};