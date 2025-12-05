import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/mockApi';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Code2, Users, Zap, Share2, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [sessionInput, setSessionInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateSession = async () => {
    setIsCreating(true);
    
    try {
      const session = await api.createSession();
      toast({
        title: 'Session created!',
        description: 'Share the link with your candidates.',
      });
      navigate(`/session/${session.id}`);
    } catch (error) {
      toast({
        title: 'Failed to create session',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sessionId = sessionInput.trim();
    if (!sessionId) {
      toast({
        title: 'Enter a session ID',
        description: 'Please enter a valid session ID to join.',
        variant: 'destructive',
      });
      return;
    }

    setIsJoining(true);
    
    const session = await api.getSession(sessionId);
    
    if (!session) {
      toast({
        title: 'Session not found',
        description: 'This session does not exist or has expired.',
        variant: 'destructive',
      });
      setIsJoining(false);
      return;
    }

    navigate(`/session/${sessionId}`);
  };

  const features = [
    {
      icon: Code2,
      title: 'Real-time Collaboration',
      description: 'Code together with instant synchronization across all participants.',
    },
    {
      icon: Users,
      title: 'User Presence',
      description: 'See who is in the session and when they are typing.',
    },
    {
      icon: Zap,
      title: 'Code Execution',
      description: 'Run JavaScript and TypeScript code directly in the browser.',
    },
    {
      icon: Share2,
      title: 'Easy Sharing',
      description: 'Generate a link and share it with candidates instantly.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Real-time collaborative coding
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Code Together,
              <span className="text-primary"> Interview Better</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              Create a collaborative coding session in seconds. Share the link with your candidates 
              and watch them code in real-time with syntax highlighting and instant execution.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button 
                size="lg" 
                onClick={handleCreateSession}
                disabled={isCreating}
                className="gap-2 min-w-[200px]"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Session
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </div>

            <div className="max-w-sm mx-auto">
              <form onSubmit={handleJoinSession} className="flex gap-2">
                <Input
                  placeholder="Enter session ID..."
                  value={sessionInput}
                  onChange={(e) => setSessionInput(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" variant="outline" disabled={isJoining}>
                  {isJoining ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Join'
                  )}
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 bg-card">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-12">
              Everything you need for technical interviews
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="p-6 rounded-xl bg-background border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-8">How it works</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-4">
                  1
                </div>
                <h3 className="font-semibold mb-2">Create a Session</h3>
                <p className="text-sm text-muted-foreground">
                  Click the button to create a new coding session instantly.
                </p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-4">
                  2
                </div>
                <h3 className="font-semibold mb-2">Share the Link</h3>
                <p className="text-sm text-muted-foreground">
                  Copy the session link and share it with your candidates.
                </p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-4">
                  3
                </div>
                <h3 className="font-semibold mb-2">Code Together</h3>
                <p className="text-sm text-muted-foreground">
                  Watch them code in real-time with full collaboration.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto text-center text-sm text-muted-foreground">
          <p>CodeCollab — Real-time collaborative code editor for technical interviews</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
