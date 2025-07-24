import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserInfo {
  user_id: string;
  user_name: string;
  phone_number: string;
}

interface ConversationSummary {
  user_id: string;
  last_message: string;
  last_message_time: string;
  message_count: number;
  user_info?: UserInfo;
  session_ids: string[];
}

interface ConversationListProps {
  conversations: ConversationSummary[];
  selectedConversation: string | null;
  onSelectConversation: (userId: string) => void;
  loading?: boolean;
}

export const ConversationList = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  loading = false
}: ConversationListProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((conv) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      conv.user_info?.user_name?.toLowerCase().includes(searchTerm) ||
      conv.user_info?.phone_number?.includes(searchTerm) ||
      conv.last_message.toLowerCase().includes(searchTerm)
    );
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Conversations</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto max-h-full">
        {filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-4">
            <div>
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => {
              const isSelected = selectedConversation === conversation.user_id;
              const userName = conversation.user_info?.user_name || 'Unknown User';
              const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
              
              return (
                <div
                  key={conversation.user_id}
                  className={cn(
                    "p-4 cursor-pointer transition-colors hover:bg-gray-50",
                    isSelected && "bg-green-50 border-r-4 border-green-500"
                  )}
                  onClick={() => onSelectConversation(conversation.user_id)}
                >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    {/* Profile Picture/Initials */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center border-2 border-white shadow-sm">
                        <span className="text-green-700 font-semibold text-sm">{initials}</span>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {userName}
                        </h3>
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatTime(conversation.last_message_time)}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-600 truncate mb-1">
                        {conversation.user_info?.phone_number || 'No phone number'}
                      </p>
                      
                      <p className="text-sm text-gray-700 truncate leading-tight">
                        {conversation.last_message}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-100"
                  >
                    {conversation.message_count} messages
                  </Badge>
                  {conversation.message_count > 0 && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
};