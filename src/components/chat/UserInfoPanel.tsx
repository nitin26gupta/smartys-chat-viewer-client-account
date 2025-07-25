import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { User, Phone, Calendar, MessageSquare, ExternalLink, Bot, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserInfo {
  user_id: string;
  user_name: string;
  phone_number: string;
  created_at?: string;
  updated_at?: string;
  agent_on?: boolean;
}

interface UserInfoPanelProps {
  userInfo: UserInfo | null;
  selectedConversation: string | null;
  messageCount?: number;
  onUserInfoUpdate?: (userId: string) => void;
}

export const UserInfoPanel = ({ 
  userInfo, 
  selectedConversation, 
  messageCount = 0,
  onUserInfoUpdate
}: UserInfoPanelProps) => {
  const [agentStatus, setAgentStatus] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // Update agentStatus when userInfo changes
  useEffect(() => {
    if (userInfo?.user_id) {
      // Use the actual database value, default to false if undefined
      setAgentStatus(userInfo.agent_on ?? false);
    }
  }, [userInfo?.user_id, userInfo?.agent_on]);
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleWhatsAppOpen = () => {
    if (userInfo?.phone_number) {
      // Remove any non-numeric characters from phone number
      const cleanPhone = userInfo.phone_number.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhone}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleAgentToggle = async (checked: boolean) => {
    if (!userInfo?.user_id) return;

    try {
      setAgentStatus(checked);
      
      // Update the agent_on field in the user_info table
      const { error } = await supabase
        .from('user_info')
        .update({ agent_on: checked } as any)
        .eq('user_id', userInfo.user_id);

      if (error) {
        console.error('Error updating agent status:', error);
        // Revert the state if update failed
        setAgentStatus(!checked);
        toast({
          title: t('error'),
          description: t('failedToUpdateAgent'),
          variant: "destructive",
        });
        return;
      }

      // Refresh the user info to reflect the change
      if (onUserInfoUpdate) {
        onUserInfoUpdate(userInfo.user_id);
      }

      toast({
        title: t('success'),
        description: checked ? t('agentEnabled') : t('agentDisabled'),
      });
    } catch (error) {
      console.error('Error updating agent status:', error);
      // Revert the state if update failed
      setAgentStatus(!checked);
      toast({
        title: t('error'),
        description: t('failedToUpdateAgent'),
        variant: "destructive",
      });
    }
  };

  const handleSendTemplate = async (templateName: string, templateDisplayName: string) => {
    if (!userInfo?.phone_number) {
      toast({
        title: t('error'),
        description: t('noPhoneNumber'),
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('https://smartys.app.n8n.cloud/webhook/be19b868-b1b4-4ae5-9752-6d93eec0de34', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: userInfo.user_name,
          phone_number: userInfo.phone_number,
          template_name: templateName
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send template');
      }

      toast({
        title: t('templateSent'),
        description: `${templateDisplayName} ${t('templateSentDescription')}`,
      });
    } catch (error) {
      console.error('Error sending template:', error);
      toast({
        title: t('error'),
        description: t('failedToSendTemplate'),
        variant: "destructive",
      });
    }
  };

  if (!selectedConversation) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {t('selectConversationDetails')}
          </p>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {t('noUserInfo')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto max-h-full p-4 space-y-4">
      {/* User Profile & Contact Information Combined */}
      <Card>
        <CardHeader className="text-center pb-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <User className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-lg">{userInfo.user_name}</CardTitle>
          <Badge variant="secondary">{t('customer')}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center mb-3">
            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">{t('contactInformation')}</span>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">{t('phoneNumber')}</label>
            <p className="text-sm font-mono">{userInfo.phone_number}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">{t('userId')}</label>
            <p className="text-sm font-mono break-all">{userInfo.user_id}</p>
          </div>
        </CardContent>
      </Card>

      {/* AI Agent Control */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Bot className="h-4 w-4 mr-2" />
            {t('aiAgentControl')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-medium">{t('aiAgentStatus')}</span>
              <p className="text-xs text-muted-foreground">
                {agentStatus ? t('aiResponsesEnabled') : t('aiResponsesDisabled')}
              </p>
            </div>
            <Switch
              checked={agentStatus}
              onCheckedChange={handleAgentToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Template Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Send className="h-4 w-4 mr-2" />
            {t('templateActions')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-3">
              {t('chooseTemplate')}
            </p>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs h-auto py-2 text-left justify-start"
                onClick={() => handleSendTemplate("smartys_share_vehicle_registration_copy", "Vehicle Registration Template")}
              >
                <Send className="h-3 w-3 mr-2 flex-shrink-0" />
                <span className="truncate">{t('vehicleRegistration')}</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs h-auto py-2 text-left justify-start"
                onClick={() => handleSendTemplate("no_response_24_hours", "24 Hour No Response Template")}
              >
                <Send className="h-3 w-3 mr-2 flex-shrink-0" />
                <span className="truncate">{t('noResponse24h')}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversation Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            {t('conversationStats')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t('totalMessages')}</span>
            <Badge variant="outline">{messageCount}</Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t('userId')}</span>
            <code className="text-xs bg-muted px-2 py-1 rounded">
              {selectedConversation}
            </code>
          </div>
        </CardContent>
      </Card>

      </div>
    </div>
  );
};