import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Phone, Calendar, MessageSquare, ExternalLink } from 'lucide-react';

interface UserInfo {
  user_id: string;
  user_name: string;
  phone_number: string;
  created_at?: string;
  updated_at?: string;
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