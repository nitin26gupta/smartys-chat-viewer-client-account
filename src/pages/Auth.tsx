import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [invitationToken, setInvitationToken] = useState('');
  const [validInvitation, setValidInvitation] = useState(false);
  const [isFirstUser, setIsFirstUser] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check for password recovery mode and invitation token on component mount
  useEffect(() => {
    let recoveryDetected = false;

    // Listen for auth state changes to detect recovery mode
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, 'Session:', session);
      console.log('Hash:', window.location.hash);
      
      // When user comes from password recovery email link
      if (event === 'PASSWORD_RECOVERY') {
        console.log('PASSWORD_RECOVERY event detected!');
        recoveryDetected = true;
        setIsPasswordRecovery(true);
        toast({
          title: "Reset Your Password",
          description: "Please enter your new password below.",
        });
      }
      
      // If we have SIGNED_IN event and reset=true, might be recovery
      if (event === 'SIGNED_IN' && searchParams.get('reset') === 'true') {
        console.log('SIGNED_IN with reset=true detected!');
        recoveryDetected = true;
        setIsPasswordRecovery(true);
      }
    });

    // Check for invitation token
    const token = searchParams.get('token');
    if (token) {
      setInvitationToken(token);
      validateInvitation(token);
    } else {
      checkIfFirstUser();
    }
    
    // Check hash fragment for access_token (indicates password recovery)
    const checkHashForRecovery = () => {
      const hash = window.location.hash;
      const isReset = searchParams.get('reset') === 'true';
      
      console.log('Checking hash for recovery. Hash:', hash, 'Reset param:', isReset);
      
      // Check if hash contains type=recovery or if reset=true
      if ((hash.includes('type=recovery') || isReset) && !recoveryDetected) {
        console.log('Recovery mode detected from hash or query param!');
        // Give a small delay to let Supabase process the auth
        setTimeout(() => {
          if (!recoveryDetected) {
            setIsPasswordRecovery(true);
          }
        }, 500);
      }
    };
    
    checkHashForRecovery();

    return () => {
      subscription.unsubscribe();
    };
  }, [searchParams]);

  const checkIfFirstUser = async () => {
    try {
      const { count, error } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      
      // If no users exist, this will be the first user
      if (count === 0) {
        setIsFirstUser(true);
        setValidInvitation(true); // Allow signup for first user
      }
    } catch (error) {
      console.error('Error checking user count:', error);
    }
  };

  const validateInvitation = async (token: string) => {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('email, expires_at')
        .eq('invitation_token', token)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        toast({
          title: "Invalid Invitation",
          description: "This invitation link is invalid or has expired.",
          variant: "destructive",
        });
        setValidInvitation(false);
      } else {
        setEmail(data.email);
        setValidInvitation(true);
        setActiveTab('signup'); // Automatically switch to signup tab
        toast({
          title: "Valid Invitation",
          description: "You can now create your account.",
        });
      }
    } catch (error) {
      setValidInvitation(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
      navigate('/');
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validInvitation && !isFirstUser) {
      toast({
        title: "Invalid Invitation",
        description: "You need a valid invitation to create an account.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, displayName);

    if (error) {
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account created!",
        description: "You have been signed in successfully.",
      });
      navigate('/');
    }

    setLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `https://smartys-support-chat.ekamapps.com/auth/reset-password`,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Reset email sent",
        description: "Check your email for password reset instructions.",
      });
      setResetEmail('');
    }

    setLoading(false);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      toast({
        title: "Error updating password",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password updated!",
        description: "Your password has been changed successfully.",
      });
      setIsPasswordRecovery(false);
      setNewPassword('');
      setConfirmPassword('');
      navigate('/');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4">
            <img 
              src="/lovable-uploads/e9c0505f-9834-4a3f-ae2c-2f4e8acfa786.png" 
              alt="Smarty's Autozubehör" 
              className="h-16 mx-auto mb-4"
            />
          </div>
          <CardTitle className="text-2xl font-bold">Smarty's Team Portal</CardTitle>
          <CardDescription>
            Access the customer support chat system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPasswordRecovery ? (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium mb-2">Set New Password</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your new password below
                </p>
              </div>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </form>
            </div>
          ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup" disabled={!validInvitation && !isFirstUser}>
                Create Account
              </TabsTrigger>
              <TabsTrigger value="reset">Reset Password</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="team@smartys.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              {!validInvitation && !isFirstUser ? (
                <div className="text-center py-8">
                  <KeyRound className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Invitation Required</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Account creation is restricted to invited users only. Please contact an administrator to get an invitation link.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Display Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">
                      {isFirstUser ? 'Email' : 'Email (from invitation)'}
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={isFirstUser ? (e) => setEmail(e.target.value) : undefined}
                      disabled={!isFirstUser}
                      className={!isFirstUser ? "bg-muted" : ""}
                      placeholder={isFirstUser ? "admin@smartys.com" : ""}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="reset">
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Email
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </form>
            </TabsContent>
          </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;