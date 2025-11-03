import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Reminders = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadReminders(session.user.id);
    });
  }, [navigate]);

  const loadReminders = async (userId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('reminders')
        .select(`
          *,
          people(*)
        `)
        .eq('user_id', userId)
        .eq('is_dismissed', false)
        .order('remind_date', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error("Error loading reminders:", error);
      toast.error("Failed to load reminders");
    } finally {
      setLoading(false);
    }
  };

  const generateReminders = async () => {
    if (!user) return;

    setGenerating(true);
    toast.info("Looking for forgotten faces...");

    try {
      // Find people not seen in 2+ years
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      const { data: people, error } = await supabase
        .from('people')
        .select('*')
        .eq('user_id', user.id)
        .lt('last_seen', twoYearsAgo.toISOString());

      if (error) throw error;

      if (!people || people.length === 0) {
        toast.info("No forgotten faces found!");
        return;
      }

      // Create reminders
      const remindersToInsert = people.map(person => ({
        user_id: user.id,
        person_id: person.id,
        remind_date: new Date().toISOString(),
        message: `You haven't seen ${person.name} in over 2 years. Maybe reconnect?`,
        is_dismissed: false,
      }));

      const { error: insertError } = await supabase
        .from('reminders')
        .insert(remindersToInsert);

      if (insertError) throw insertError;

      toast.success(`Created ${people.length} reminder(s)!`);
      loadReminders(user.id);
    } catch (error) {
      console.error("Error generating reminders:", error);
      toast.error("Failed to generate reminders");
    } finally {
      setGenerating(false);
    }
  };

  const dismissReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ is_dismissed: true })
        .eq('id', id);

      if (error) throw error;

      toast.success("Reminder dismissed");
      loadReminders(user!.id);
    } catch (error) {
      console.error("Error dismissing reminder:", error);
      toast.error("Failed to dismiss reminder");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navbar user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold" 
              style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Reminders
          </h1>
          
          <Button
            onClick={generateReminders}
            disabled={generating}
            style={{ background: "var(--gradient-primary)" }}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Finding...
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 mr-2" />
                Find Forgotten Faces
              </>
            )}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
            <p className="text-muted-foreground mt-2">Loading reminders...</p>
          </div>
        ) : reminders.length === 0 ? (
          <Card className="p-12 text-center border-0 shadow-lg bg-white/80 backdrop-blur">
            <Bell className="w-16 h-16 mx-auto text-purple-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">No Reminders</h3>
            <p className="text-muted-foreground mb-4">
              Click "Find Forgotten Faces" to discover people you haven't seen in a while
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder) => (
              <Card key={reminder.id} className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                      {reminder.people?.profile_image_url ? (
                        <img
                          src={reminder.people.profile_image_url}
                          alt={reminder.people.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">👤</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">{reminder.people?.name}</h3>
                      <p className="text-muted-foreground mb-2">{reminder.message}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(reminder.remind_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissReminder(reminder.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Reminders;