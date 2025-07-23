import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { User, Phone, Calendar, MessageSquare, ExternalLink, Bot, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

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
}

export const UserInfoPanel = ({ 
  userInfo, 
  selectedConversation, 
  messageCount = 0 
}: UserInfoPanelProps) => {
  const [agentStatus, setAgentStatus] = useState(userInfo?.agent_on ?? true);
  const { toast } = useToast();
  
  // Update agentStatus when userInfo changes
  useEffect(() => {
    setAgentStatus(userInfo?.agent_on ?? true);
  }, [userInfo?.agent_on]);
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

    // Agent toggle functionality removed - will be reimplemented in admin panel
    console.log('Agent toggle feature disabled');
    setAgentStatus(checked);
    toast({
      title: "Info",
      description: "Agent toggle will be available in the admin panel",
    });
  };

  const handleSendTemplate = async (templateName: string, templateDisplayName: string) => {
    if (!userInfo?.phone_number) {
      toast({
        title: "Error",
        description: "No phone number available for this user",
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
        title: "Template Sent",
        description: `${templateDisplayName} has been sent to the customer`,
      });
    } catch (error) {
      console.error('Error sending template:', error);
      toast({
        title: "Error",
        description: "Failed to send template. Please try again.",
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
            Select a conversation to view user details
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
            No user information available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* User Profile Card */}
      <Card>
        <CardHeader className="text-center pb-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <User className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-lg">{userInfo.user_name}</CardTitle>
          <Badge variant="secondary">Customer</Badge>
        </CardHeader>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Phone className="h-4 w-4 mr-2" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
            <p className="text-sm font-mono">{userInfo.phone_number}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">User ID</label>
            <p className="text-sm font-mono break-all">{userInfo.user_id}</p>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={handleWhatsAppOpen}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in WhatsApp
          </Button>
        </CardContent>
      </Card>

      {/* AI Agent Control */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Bot className="h-4 w-4 mr-2" />
            AI Agent Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-medium">AI Agent Status</span>
              <p className="text-xs text-muted-foreground">
                {agentStatus ? 'AI responses enabled' : 'AI responses disabled'}
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
            Template Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-3">
              Choose a template to send to the customer
            </p>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => handleSendTemplate("smartys_share_vehicle_registration_copy", "Vehicle Registration Template")}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Vehicle Registration Template
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => handleSendTemplate("no_response_24_hours", "24 Hour No Response Template")}
              >
                <Send className="h-4 w-4 mr-2" />
                Send 24 Hour No Response Template
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
            Conversation Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Messages</span>
            <Badge variant="outline">{messageCount}</Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">User ID</span>
            <code className="text-xs bg-muted px-2 py-1 rounded">
              {selectedConversation}
            </code>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};