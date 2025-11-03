import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Edit2, Save, Calendar } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const PersonDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [person, setPerson] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [timelineData, setTimelineData] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadPersonDetails();
    });
  }, [id, navigate]);

  const loadPersonDetails = async () => {
    try {
      // Load person
      const { data: personData, error: personError } = await supabase
        .from('people')
        .select('*')
        .eq('id', id)
        .single();

      if (personError) throw personError;
      setPerson(personData);
      setNewName(personData.name);

      // Load photos for this person
      const { data: personPhotos, error: photosError } = await supabase
        .from('person_photos')
        .select(`
          *,
          photos(*)
        `)
        .eq('person_id', id);

      if (photosError) throw photosError;

      const photosList = personPhotos.map(pp => pp.photos).filter(Boolean);
      setPhotos(photosList);

      // Generate timeline data
      const yearCounts: { [key: string]: number } = {};
      photosList.forEach(photo => {
        if (photo.date_taken) {
          const year = new Date(photo.date_taken).getFullYear().toString();
          yearCounts[year] = (yearCounts[year] || 0) + 1;
        }
      });

      const chartData = Object.entries(yearCounts)
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => parseInt(a.year) - parseInt(b.year));

      setTimelineData(chartData);
    } catch (error) {
      console.error("Error loading person details:", error);
      toast.error("Failed to load person details");
    }
  };

  const handleSaveName = async () => {
    try {
      const { error } = await supabase
        .from('people')
        .update({ name: newName })
        .eq('id', id);

      if (error) throw error;

      toast.success("Name updated!");
      setEditing(false);
      loadPersonDetails();
    } catch (error) {
      console.error("Error updating name:", error);
      toast.error("Failed to update name");
    }
  };

  if (!user || !person) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navbar user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/people")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to People
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Person Info */}
          <Card className="lg:col-span-1 p-6 border-0 shadow-lg bg-white/80 backdrop-blur">
            <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg mb-4 overflow-hidden">
              {person.profile_image_url ? (
                <img
                  src={person.profile_image_url}
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl">👤</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {editing ? (
                <div className="space-y-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Person name"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveName} className="flex-1" style={{ background: "var(--gradient-primary)" }}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold">{person.name}</h2>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{photos.length} appearances</span>
                </div>
                {person.first_seen && (
                  <p className="text-muted-foreground">
                    First seen: {new Date(person.first_seen).toLocaleDateString()}
                  </p>
                )}
                {person.last_seen && (
                  <p className="text-muted-foreground">
                    Last seen: {new Date(person.last_seen).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Timeline & Photos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline Chart */}
            {timelineData.length > 0 && (
              <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur">
                <h3 className="text-xl font-bold mb-4">Appearance Timeline</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
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
            )}

            {/* Photo Gallery */}
            <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur">
              <h3 className="text-xl font-bold mb-4">Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="aspect-square rounded-lg overflow-hidden border border-purple-200 hover:border-purple-400 transition-colors"
                  >
                    <img
                      src={photo.url}
                      alt="Memory"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PersonDetail;