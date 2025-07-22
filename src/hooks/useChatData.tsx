import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  // Fetch conversations list
  const fetchConversations = async () => {
    try {
      console.log('=== STARTING CONVERSATION FETCH ===');
      
      // Step 1: Get all users from user_info table
      const { data: allUsers, error: userError } = await supabase
        .from('user_info')
        .select('*');

      if (userError) throw userError;
      console.log('Found users:', allUsers?.length);

      if (!allUsers || allUsers.length === 0) {
        setConversations([]);
        return;
      }

      const conversations: ConversationSummary[] = [];

      // Step 2: For each user, get their sessions and messages
      for (const user of allUsers) {
        console.log(`\n--- Processing user: ${user.user_name} (ID: ${user.user_id}) ---`);
        
        // Get all sessions for this user
        const { data: userSessions, error: sessionError } = await supabase
          .from('session_user_mapping')
          .select('session_id')
          .eq('user_id', user.user_id);

        if (sessionError) {
          console.error('Error fetching sessions for user:', user.user_id, sessionError);
          continue;
        }

        if (!userSessions || userSessions.length === 0) {
          console.log(`No sessions found for user ${user.user_name}`);
          continue;
        }

        console.log(`Found ${userSessions.length} sessions for ${user.user_name}:`, userSessions.map(s => s.session_id));

        // Get all messages for this user's sessions
        const sessionIds = userSessions.map(s => s.session_id);
        const { data: userMessages, error: messageError } = await supabase
          .from('smartys_chat_histories')
          .select('*')
          .in('session_id', sessionIds)
          .order('id', { ascending: true });

        if (messageError) {
          console.error('Error fetching messages for user:', user.user_id, messageError);
          continue;
        }

        if (!userMessages || userMessages.length === 0) {
          console.log(`No messages found for user ${user.user_name}`);
          continue;
        }

        console.log(`Found ${userMessages.length} messages for ${user.user_name}`);

        // Get the latest message for preview
        const latestMessage = userMessages[userMessages.length - 1];
        const message = latestMessage.message as any;

        // Create conversation summary
        const conversation: ConversationSummary = {
          user_id: user.user_id,
          last_message: message?.content || (message?.type === 'image' ? '📷 Image' : 'Message'),
          last_message_time: message?.timestamp || new Date().toISOString(),
          message_count: userMessages.length,
          user_info: {
            user_id: user.user_id,
            user_name: user.user_name || 'Unknown',
            phone_number: user.phone_number || '',
          },
          session_ids: sessionIds,
        };

        conversations.push(conversation);
        console.log(`✓ Added conversation for ${user.user_name}: ${userMessages.length} messages`);
      }

      console.log('\n=== FINAL RESULTS ===');
      conversations.forEach(conv => {
        console.log(`${conv.user_info?.user_name}: ${conv.message_count} messages`);
      });

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
  const fetchMessages = async (userId: string) => {
    if (!userId) return;
    
    setMessagesLoading(true);
    try {
      // Find the conversation by user_id to get session IDs
      const conversation = conversations.find(c => c.user_id === userId);
      if (!conversation) return;

      // Get messages from all sessions for this user_id
      const { data: messages, error } = await supabase
        .from('smartys_chat_histories')
        .select('*')
        .in('session_id', conversation.session_ids)
        .order('id', { ascending: true });

      if (error) throw error;

      setMessages((messages || []) as ChatMessage[]);
      setUserInfo(conversation.user_info || null);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error loading messages",
        description: "Failed to load conversation messages",
        variant: "destructive",
      });
    } finally {
      setMessagesLoading(false);
    }
  };

  // Set up real-time updates
  useEffect(() => {
    console.log('Setting up real-time subscription...');
    const channel = supabase
      .channel('chat-updates')
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
          
          // Update messages if viewing the relevant conversation
          setMessages(prevMessages => {
            // Get the current conversations to check if the message belongs to selected conversation
            const currentConversations = conversations;
            const conversation = currentConversations.find(c => c.user_id === selectedConversation);
            if (conversation && conversation.session_ids.includes(newMessage.session_id)) {
              console.log('Adding message to current conversation');
              return [...prevMessages, newMessage];
            }
            return prevMessages;
          });
          
          // Always refresh conversations to update last message and counts
          console.log('Refreshing conversations due to new message');
          fetchConversations();
        }
      )
      .subscribe();

    console.log('Real-time subscription status:', channel);

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, []); // Remove dependencies to prevent constant re-subscriptions

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

      // Use the most recent session ID for the reply
      const sessionId = conversation.session_ids[conversation.session_ids.length - 1];
      
      const replyMessage = {
        type: 'support_reply',
        content: replyText,
        timestamp: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('smartys_chat_histories')
        .insert({
          session_id: sessionId,
          message: replyMessage,
        });

      if (error) throw error;

      // Trigger webhook after successful message send
      try {
        const webhookPayload = {
          mobile_number: conversation.user_info?.phone_number || '',
          message: replyText
        };

        await fetch('https://jkdxs.app.n8n.cloud/webhook/0443a6c9-8efa-4a29-ba41-06b9bad558dd', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
        });

        console.log('Webhook triggered successfully:', webhookPayload);
      } catch (webhookError) {
        console.error('Error triggering webhook:', webhookError);
        // Don't fail the message send if webhook fails
      }

      toast({
        title: "Reply sent",
        description: "Your message has been sent successfully",
      });

      // Refresh messages
      fetchMessages(userId);
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error sending reply",
        description: "Failed to send your message",
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
  };
};