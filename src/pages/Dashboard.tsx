import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Users, Calendar, Bell } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalPhotos: 0,
    uniquePeople: 0,
    reminders: 0,
  });

  useEffect(() => {
    // Check auth and get user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadStats(session.user.id);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadStats = async (userId: string) => {
    try {
      const [photosRes, peopleRes, remindersRes] = await Promise.all([
        supabase.from("photos").select("id", { count: "exact" }).eq("user_id", userId),
        supabase.from("people").select("id", { count: "exact" }).eq("user_id", userId),
        supabase.from("reminders").select("id", { count: "exact" }).eq("user_id", userId).eq("is_dismissed", false),
      ]);

      setStats({
        totalPhotos: photosRes.count || 0,
        uniquePeople: peopleRes.count || 0,
        reminders: remindersRes.count || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navbar user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" 
              style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Welcome Back!
          </h1>
          <p className="text-muted-foreground">Here's what's happening with your memories</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/80 backdrop-blur">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-100">
                <Camera className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Photos</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalPhotos}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/80 backdrop-blur">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-pink-100">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">People Found</p>
                <p className="text-3xl font-bold text-pink-600">{stats.uniquePeople}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/80 backdrop-blur">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Reminders</p>
                <p className="text-3xl font-bold text-blue-600">{stats.reminders}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-8 border-0 shadow-lg bg-white/80 backdrop-blur">
          <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => navigate("/upload")}
              className="h-auto py-6 flex flex-col gap-2"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Camera className="w-8 h-8" />
              <span>Upload Photos</span>
            </Button>

            <Button
              onClick={() => navigate("/people")}
              variant="outline"
              className="h-auto py-6 flex flex-col gap-2 border-2 border-purple-200 hover:border-purple-400"
            >
              <Users className="w-8 h-8" />
              <span>View People</span>
            </Button>

            <Button
              onClick={() => navigate("/analytics")}
              variant="outline"
              className="h-auto py-6 flex flex-col gap-2 border-2 border-pink-200 hover:border-pink-400"
            >
              <Calendar className="w-8 h-8" />
              <span>Analytics</span>
            </Button>

            <Button
              onClick={() => navigate("/reminders")}
              variant="outline"
              className="h-auto py-6 flex flex-col gap-2 border-2 border-blue-200 hover:border-blue-400"
            >
              <Bell className="w-8 h-8" />
              <span>Reminders</span>
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;