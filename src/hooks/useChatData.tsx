import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  agent_on?: boolean;
}

interface ConversationSummary {
  user_id: string;
  last_message: string;
  last_message_time: string;
  message_count: number;
  user_info?: UserInfo;
  session_ids: string[];
}

export const useChatData = () => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const { toast } = useToast();

  // Fetch conversations list using optimized database function
  const fetchConversations = async () => {
    try {
      console.log('=== STARTING OPTIMIZED CONVERSATION FETCH ===');
      
      // Use the database function to get all conversation summaries in one query
      const { data, error } = await supabase
        .rpc('get_conversation_summaries');

      if (error) {
        console.error('Error fetching conversations:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('No conversations found');
        setConversations([]);
        return;
      }

      console.log(`✓ Loaded ${data.length} conversations in one query`);

      // Transform the database result to match our ConversationSummary interface
      const conversations: ConversationSummary[] = data.map((row: any) => ({
        user_id: row.user_id,
        last_message: row.last_message || 'No messages',
        last_message_time: row.last_message_time,
        message_count: Number(row.message_count),
        user_info: {
          user_id: row.user_id,
          user_name: row.user_name || 'Unknown',
          phone_number: row.phone_number || '',
          agent_on: row.agent_on ?? true,
        },
        session_ids: row.session_ids || [],
      }));

      setConversations(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error loading conversations",
        description: "Failed to load conversation list",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for selected conversation (user_id)
  const fetchMessages = async (userId: string, loadPrevious = false) => {
    if (!userId) return;
    
    if (!loadPrevious) {
      setMessagesLoading(true);
    }
    
    try {
      // Find the conversation by user_id to get session IDs
      const conversation = conversations.find(c => c.user_id === userId);
      if (!conversation) return;

      // For pagination: load 100 messages initially, 50 at a time for "load previous"
      const limit = loadPrevious ? 50 : 100;
      let query = supabase
        .from('smartys_chat_histories')
        .select('*, timestamp')
        .in('session_id', conversation.session_ids)
        .order('id', { ascending: false })
        .limit(limit);

      // If loading previous messages, get messages before the first current message
      if (loadPrevious && messages.length > 0) {
        const firstMessageId = Math.min(...messages.map(m => m.id));
        query = query.lt('id', firstMessageId);
      }

      const { data: messagesData, error } = await query;

      if (error) throw error;

      if (messagesData) {
        // Reverse to get chronological order
        const sortedMessages = messagesData.reverse();
        
        if (loadPrevious) {
          // Prepend previous messages to current messages
          setMessages(prev => [...sortedMessages, ...prev]);
        } else {
          // Get most recent messages
          setMessages(sortedMessages);
        }
        
        if (!loadPrevious) {
          setUserInfo(conversation.user_info || null);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (!loadPrevious) {
        toast({
          title: "Error loading messages",
          description: "Failed to load conversation messages",
          variant: "destructive",
        });
      }
    } finally {
      if (!loadPrevious) {
        setMessagesLoading(false);
      }
    }
  };

  // Set up real-time updates
  useEffect(() => {
    console.log('Setting up real-time subscription...');
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'smartys_chat_histories'
        },
        (payload) => {
          console.log('New message received via real-time:', payload);
          const newMessage = payload.new as ChatMessage;
          
          // Always refresh conversations to update last message and counts
          console.log('Refreshing conversations due to new message');
          fetchConversations();
          
          // If we're currently viewing a conversation, check if this message belongs to it
          setSelectedConversation(currentSelectedConversation => {
            if (currentSelectedConversation) {
              setConversations(currentConversations => {
                const conversation = currentConversations.find(c => c.user_id === currentSelectedConversation);
                if (conversation && conversation.session_ids.includes(newMessage.session_id)) {
                  console.log('Adding message to current conversation');
                  setMessages(prevMessages => [...prevMessages, newMessage]);
                }
                return currentConversations;
              });
            }
            return currentSelectedConversation;
          });
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to real-time updates');
        }
      });

    console.log('Real-time channel created:', channel);

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, []); // Empty dependency array to prevent constant re-subscriptions

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  // Send reply function
  const sendReply = async (userId: string, replyText: string) => {
    try {
      const conversation = conversations.find(c => c.user_id === userId);
      if (!conversation || !conversation.session_ids.length) {
        throw new Error('No active session found for this user');
      }

      // Call webhook directly - the workflow will handle storing the message
      try {
        const webhookPayload = {
          mobile_number: conversation.user_info?.phone_number || '',
          message: replyText,
          type: 'text',
          ai: false,
          source: 'human-agent'
        };

        await fetch('https://smartys.app.n8n.cloud/webhook/0443a6c9-8efa-4a29-ba41-06b9bad558dd', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
        });

        console.log('Webhook triggered successfully:', webhookPayload);
        

        // Refresh messages to show any updates from the workflow
        setTimeout(() => {
          fetchMessages(userId);
        }, 1000);
        
      } catch (webhookError) {
        console.error('Error triggering webhook:', webhookError);
        toast({
          title: "Error sending reply",
          description: "Failed to send your message",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error sending reply",
        description: "Failed to send your message",
        variant: "destructive",
      });
    }
  };

  // Send file function
  const sendFile = async (userId: string, fileUrl: string, fileName: string, fileType: string) => {
    try {
      const conversation = conversations.find(c => c.user_id === userId);
      if (!conversation || !conversation.session_ids.length) {
        throw new Error('No active session found for this user');
      }

      // Store file message in database first
      const { data, error } = await supabase
        .from('smartys_chat_histories')
        .insert({
          session_id: conversation.session_ids[0],
          message: {
            type: 'file',
            file_url: fileUrl,
            file_name: fileName,
            file_type: fileType,
            content: `📎 ${fileName}`,
            sender: 'agent'
          }
        });

      if (error) throw error;

      // Call webhook to send file via WhatsApp
      try {
        const webhookPayload = {
          mobile_number: conversation.user_info?.phone_number || '',
          file_url: fileUrl,
          caption: fileName,
          file_type: fileType
        };

        await supabase.functions.invoke('send-whatsapp-file', {
          body: webhookPayload
        });

        console.log('File webhook triggered successfully:', webhookPayload);
        
        // Refresh messages to show the file message
        setTimeout(() => {
          fetchMessages(userId);
        }, 1000);
        
        toast({
          title: "File sent",
          description: `${fileName} has been sent successfully`,
        });
        
      } catch (webhookError) {
        console.error('Error triggering file webhook:', webhookError);
        toast({
          title: "Error sending file",
          description: "File uploaded but failed to send via WhatsApp",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending file:', error);
      toast({
        title: "Error sending file",
        description: "Failed to send your file",
        variant: "destructive",
      });
    }
  };

  return {
    conversations,
    selectedConversation,
    setSelectedConversation,
    messages,
    userInfo,
    loading,
    messagesLoading,
    refreshConversations: fetchConversations,
    sendReply,
    sendFile,
    refreshUserInfo: (userId: string) => {
      // Refresh conversations to get updated user info
      fetchConversations();
    },
    loadPreviousMessages: (userId: string) => fetchMessages(userId, true),
    refreshMessages: (userId: string) => fetchMessages(userId, false),
  };
};