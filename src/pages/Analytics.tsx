import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const Analytics = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalPhotos: 0,
    uniquePeople: 0,
    timelineData: [],
    topPeople: [],
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadAnalytics(session.user.id);
    });
  }, [navigate]);

  const loadAnalytics = async (userId: string) => {
    try {
      // Total photos
      const { count: photoCount } = await supabase
        .from("photos")
        .select("id", { count: "exact" })
        .eq("user_id", userId);

      // Unique people
      const { count: peopleCount } = await supabase
        .from("people")
        .select("id", { count: "exact" })
        .eq("user_id", userId);

      // Photos by year
      const { data: photos } = await supabase
        .from("photos")
        .select("date_taken")
        .eq("user_id", userId);

      const yearCounts: { [key: string]: number } = {};
      photos?.forEach(photo => {
        if (photo.date_taken) {
          const year = new Date(photo.date_taken).getFullYear().toString();
          yearCounts[year] = (yearCounts[year] || 0) + 1;
        }
      });

      const timelineData = Object.entries(yearCounts)
        .map(([year, count]) => ({ year, photos: count }))
        .sort((a, b) => parseInt(a.year) - parseInt(b.year));

      // Top people
      const { data: people } = await supabase
        .from('people')
        .select(`
          *,
          person_photos(count)
        `)
        .eq('user_id', userId);

      const topPeople = people
        ?.map(person => ({
          name: person.name,
          count: person.person_photos?.[0]?.count || 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5) || [];

      setStats({
        totalPhotos: photoCount || 0,
        uniquePeople: peopleCount || 0,
        timelineData: timelineData as any,
        topPeople: topPeople as any,
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  const COLORS = ['#a78bfa', '#f472b6', '#38bdf8', '#4ade80', '#fbbf24'];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navbar user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8" 
            style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Analytics
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Photo Timeline */}
          <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur">
            <h3 className="text-xl font-bold mb-4">Photos Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="photos" stroke="#a78bfa" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Top People */}
          <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur">
            <h3 className="text-xl font-bold mb-4">Most Frequent People</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topPeople}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="url(#colorGradient)" />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#f472b6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Stats Summary */}
          <Card className="lg:col-span-2 p-8 border-0 shadow-lg bg-white/80 backdrop-blur">
            <h3 className="text-xl font-bold mb-6">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-purple-600">{stats.totalPhotos}</p>
                <p className="text-sm text-muted-foreground mt-2">Total Photos</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-pink-600">{stats.uniquePeople}</p>
                <p className="text-sm text-muted-foreground mt-2">Unique People</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-600">
                  {stats.totalPhotos > 0 ? Math.round(stats.totalPhotos / (stats.uniquePeople || 1)) : 0}
                </p>
                <p className="text-sm text-muted-foreground mt-2">Avg Photos/Person</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-green-600">
                  {stats.timelineData.length}
                </p>
                <p className="text-sm text-muted-foreground mt-2">Years Covered</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Analytics;