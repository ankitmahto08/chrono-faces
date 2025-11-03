import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, Edit2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Person {
  id: string;
  name: string;
  profile_image_url?: string;
  first_seen?: string;
  last_seen?: string;
  photo_count: number;
}

const People = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [clustering, setClustering] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadPeople(session.user.id);
    });
  }, [navigate]);

  const loadPeople = async (userId: string) => {
    try {
      setLoading(true);
      
      // Get all people with photo counts
      const { data, error } = await supabase
        .from('people')
        .select(`
          *,
          person_photos(count)
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const peopleWithCounts = data.map(person => ({
        ...person,
        photo_count: person.person_photos?.[0]?.count || 0,
      }));

      setPeople(peopleWithCounts);
    } catch (error) {
      console.error("Error loading people:", error);
      toast.error("Failed to load people");
    } finally {
      setLoading(false);
    }
  };

  const clusterFaces = async () => {
    if (!user) return;

    setClustering(true);
    toast.info("Clustering faces... This may take a moment.");

    try {
      // Get all face embeddings
      const { data: embeddings, error: embeddingsError } = await supabase
        .from('face_embeddings')
        .select(`
          *,
          photos!inner(user_id)
        `)
        .eq('photos.user_id', user.id);

      if (embeddingsError) throw embeddingsError;

      // Simple clustering using cosine similarity threshold
      const threshold = 0.6; // Faces with similarity > 0.6 are considered same person
      const clusters: any[] = [];

      for (const embedding of embeddings || []) {
        let foundCluster = false;

        for (const cluster of clusters) {
          const similarity = cosineSimilarity(
            embedding.embedding,
            cluster.representative
          );

          if (similarity > threshold) {
            cluster.members.push(embedding);
            foundCluster = true;
            break;
          }
        }

        if (!foundCluster) {
          clusters.push({
            representative: embedding.embedding,
            members: [embedding],
          });
        }
      }

      // Create person records for each cluster
      for (const cluster of clusters) {
        // Get photos for this cluster
        const photoIds = cluster.members.map((m: any) => m.photo_id);
        
        const { data: photos } = await supabase
          .from('photos')
          .select('*')
          .in('id', photoIds)
          .order('date_taken', { ascending: true });

        if (!photos || photos.length === 0) continue;

        // Create person
        const { data: person, error: personError } = await supabase
          .from('people')
          .insert({
            user_id: user.id,
            name: `Person ${clusters.indexOf(cluster) + 1}`,
            profile_image_url: photos[0].url,
            first_seen: photos[0].date_taken,
            last_seen: photos[photos.length - 1].date_taken,
          })
          .select()
          .single();

        if (personError) {
          console.error("Error creating person:", personError);
          continue;
        }

        // Link photos to person
        for (const member of cluster.members) {
          await supabase
            .from('person_photos')
            .insert({
              person_id: person.id,
              photo_id: member.photo_id,
              face_embedding_id: member.id,
            });
        }
      }

      toast.success(`Found ${clusters.length} unique people!`);
      loadPeople(user.id);
    } catch (error) {
      console.error("Clustering error:", error);
      toast.error("Failed to cluster faces");
    } finally {
      setClustering(false);
    }
  };

  // Helper: Cosine similarity
  const cosineSimilarity = (a: number[], b: number[]) => {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  };

  const filteredPeople = people.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navbar user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold" 
              style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            People
          </h1>
          
          <Button
            onClick={clusterFaces}
            disabled={clustering}
            style={{ background: "var(--gradient-primary)" }}
          >
            {clustering ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Clustering...
              </>
            ) : (
              "Cluster Faces"
            )}
          </Button>
        </div>

        {/* Search */}
        <Card className="p-4 mb-6 border-0 shadow-lg bg-white/80 backdrop-blur">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* People Grid */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
            <p className="text-muted-foreground mt-2">Loading people...</p>
          </div>
        ) : filteredPeople.length === 0 ? (
          <Card className="p-12 text-center border-0 shadow-lg bg-white/80 backdrop-blur">
            <Users className="w-16 h-16 mx-auto text-purple-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">No People Found</h3>
            <p className="text-muted-foreground mb-4">
              Upload photos and click "Cluster Faces" to detect people
            </p>
            <Button onClick={() => navigate("/upload")} style={{ background: "var(--gradient-primary)" }}>
              Upload Photos
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPeople.map((person) => (
              <Card
                key={person.id}
                className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/80 backdrop-blur cursor-pointer"
                onClick={() => navigate(`/person/${person.id}`)}
              >
                <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100">
                  {person.profile_image_url ? (
                    <img
                      src={person.profile_image_url}
                      alt={person.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="w-16 h-16 text-purple-300" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{person.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {person.photo_count} photo{person.photo_count !== 1 ? 's' : ''}
                  </p>
                  {person.first_seen && (
                    <p className="text-xs text-muted-foreground mt-2">
                      First seen: {new Date(person.first_seen).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default People;