import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useChatData } from '@/hooks/useChatData';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatArea } from '@/components/chat/ChatArea';
import { UserInfoPanel } from '@/components/chat/UserInfoPanel';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { LogOut, MessageSquare, Users, BarChart3, Shield, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);
  const {
    conversations,
    selectedConversation,
    setSelectedConversation,
    messages,
    userInfo,
    loading,
    messagesLoading,
    refreshConversations,
    sendReply,
    refreshUserInfo,
    loadPreviousMessages,
  } = useChatData();

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();
        
        setIsAdmin(!!data);
      } catch (error) {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Redirect authenticated users from auth page
  useEffect(() => {
    if (user && window.location.pathname === '/auth') {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="mx-auto mb-6">
            <img 
              src="/lovable-uploads/e9c0505f-9834-4a3f-ae2c-2f4e8acfa786.png" 
              alt="Smarty's Autozubehör" 
              className="h-20 mx-auto"
            />
          </div>
          
          <div>
            <h1 className="text-3xl font-bold mb-2">Smarty's Chat Viewer</h1>
            <p className="text-muted-foreground">
              Professional WhatsApp conversation management for customer support teams
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 text-sm">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
              <Users className="h-5 w-5 text-primary" />
              <span>Manage customer conversations</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span>Track conversation analytics</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span>Real-time message updates</span>
            </div>
          </div>
          
          <Button onClick={() => navigate('/auth')} size="lg" className="w-full">
            Access Team Portal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="/lovable-uploads/c73c150e-5115-4cbe-bec4-7e7ca9ac0e0f.png" 
                alt="Smarty's" 
                className="h-8 w-8"
              />
              <div>
                <h1 className="text-xl font-semibold">Smarty's Chat Viewer</h1>
                <p className="text-sm text-muted-foreground">
                  {conversations.length} conversations • Welcome, {user.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <LanguageToggle />
              
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Shield className="mr-2 h-4 w-4" />
                      {t('adminDashboard')}
                      <Badge variant="secondary" className="ml-2">
                        Admin
                      </Badge>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Users className="mr-2 h-4 w-4" />
                      {t('userManagement')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Settings className="mr-2 h-4 w-4" />
                      {t('adminDashboard')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="mr-2 h-4 w-4" />
                      Invite New Users
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {user.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem disabled>
                    <Users className="mr-2 h-4 w-4" />
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Conversations */}
          <div className="w-80 border-r bg-card flex flex-col overflow-hidden">
            <ConversationList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelectConversation={setSelectedConversation}
              loading={loading}
            />
          </div>
          
          {/* Center - Chat Area */}
          <div className="flex-1 bg-background overflow-hidden">
            <ChatArea
              messages={messages}
              loading={messagesLoading}
              selectedConversation={selectedConversation}
              userInfo={userInfo}
              onSendReply={sendReply}
              onLoadPrevious={loadPreviousMessages}
            />
          </div>
          
          {/* Right Sidebar - User Info */}
          <div className="w-80 border-l bg-card flex flex-col overflow-hidden">
            <UserInfoPanel
              userInfo={userInfo}
              selectedConversation={selectedConversation}
              messageCount={messages.length}
              onUserInfoUpdate={refreshUserInfo}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Index;
