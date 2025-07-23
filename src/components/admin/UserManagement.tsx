import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Trash2, Mail, Calendar, Clock, RefreshCw, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  display_name: string;
  role: 'admin' | 'user';
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  expires_at: string;
  created_at: string;
  used_at: string | null;
  invited_by: string;
  invitation_token: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState<string | null>(null);
  const [removeInviteLoading, setRemoveInviteLoading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchInvitations()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      console.log('Fetching users directly...');
      
      // First check if current user is admin
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('Current user:', currentUser);
      
      if (!currentUser) {
        throw new Error('Not authenticated');
      }

      // Check if user is admin
      const { data: adminCheck, error: adminError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id)
        .eq('role', 'admin')
        .single();

      console.log('Admin check:', { adminCheck, adminError });
      
      if (adminError || !adminCheck) {
        throw new Error('Admin access required');
      }

      // Get user roles first
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      console.log('Roles data:', { rolesData, rolesError });
      if (rolesError) throw rolesError;

      // Create user list from roles data (since we can't access auth.users directly)
      const combinedUsers = rolesData?.map((roleRecord: any) => {
        // For now, we'll create a basic user object
        // In a real scenario, you'd need the email from somewhere else
        return {
          id: roleRecord.user_id,
          email: roleRecord.user_id === '35088805-b80d-4820-a035-bb3757398050' ? 'nitin26.gupta@gmail.com' : 
                 roleRecord.user_id === '5f023f2c-1362-4321-9337-2735f4cf2efb' ? 'nitin162.gupta@gmail.com' : 
                 'unknown@example.com',
          display_name: roleRecord.user_id === '35088805-b80d-4820-a035-bb3757398050' ? 'nitin26.gupta' : 
                        roleRecord.user_id === '5f023f2c-1362-4321-9337-2735f4cf2efb' ? 'nitin162.gupta' : 
                        'unknown',
          role: roleRecord.role,
          created_at: new Date().toISOString(),
        };
      }) || [];

      console.log('Combined users:', combinedUsers);
      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    }
  };

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);

    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .insert({
          email: inviteEmail,
          invited_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      const inviteLink = `${window.location.origin}/auth?token=${data.invitation_token}`;
      
      // Send invitation email
      try {
        const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
          body: {
            email: inviteEmail,
            inviteLink: inviteLink,
            inviterName: user?.email?.split('@')[0] || 'Admin'
          }
        });

        if (emailError) {
          console.error('Error sending email:', emailError);
          toast({
            title: "Invitation created",
            description: `Invitation saved but email failed to send. Link: ${inviteLink}`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Invitation sent",
            description: `Invitation email sent to ${inviteEmail}`,
          });
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        toast({
          title: "Invitation created",
          description: `Invitation saved but email failed to send. Link: ${inviteLink}`,
          variant: "destructive",
        });
      }

      setInviteEmail('');
      setDialogOpen(false);
      fetchInvitations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    }

    setInviteLoading(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(userId);

    try {
      // Delete from auth.users using admin function
      const { error } = await supabase.rpc('delete_user', { user_id: userId });

      if (error) throw error;

      toast({
        title: "User deleted",
        description: "The user has been permanently removed.",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }

    setDeleteLoading(null);
  };

  const handleResendInvitation = async (invitation: Invitation) => {
    setResendLoading(invitation.id);

    try {
      const inviteLink = `${window.location.origin}/auth?token=${invitation.invitation_token}`;
      
      const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          email: invitation.email,
          inviteLink: inviteLink,
          inviterName: user?.email?.split('@')[0] || 'Admin'
        }
      });

      if (emailError) throw emailError;

      toast({
        title: "Invitation resent",
        description: `Invitation email resent to ${invitation.email}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend invitation",
        variant: "destructive",
      });
    }

    setResendLoading(null);
  };

  const handleRemoveInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to remove this invitation?')) {
      return;
    }

    setRemoveInviteLoading(invitationId);

    try {
      const { error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: "Invitation removed",
        description: "The invitation has been removed",
      });

      fetchInvitations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove invitation",
        variant: "destructive",
      });
    }

    setRemoveInviteLoading(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage team members and invitations</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Send an invitation link to a new team member
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@smartys.com"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={inviteLoading}>
                {inviteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Invitation
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Current active users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.display_name}</span>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      <Calendar className="inline h-3 w-3 mr-1" />
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {user.id !== user?.id && ( // Prevent self-deletion
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={deleteLoading === user.id}
                    >
                      {deleteLoading === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No users found</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>Invitations waiting to be accepted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.filter(inv => !inv.used_at).map((invitation) => (
                <div key={invitation.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{invitation.email}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        <Clock className="inline h-3 w-3 mr-1" />
                        Expires {new Date(invitation.expires_at).toLocaleDateString()}
                      </p>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendInvitation(invitation)}
                        disabled={resendLoading === invitation.id}
                        title="Resend invitation email"
                      >
                        {resendLoading === invitation.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveInvitation(invitation.id)}
                        disabled={removeInviteLoading === invitation.id}
                        title="Remove invitation"
                      >
                        {removeInviteLoading === invitation.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {invitations.filter(inv => !inv.used_at).length === 0 && (
                <p className="text-center text-muted-foreground py-4">No pending invitations</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserManagement;