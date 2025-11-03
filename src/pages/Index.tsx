import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Camera, Users, Calendar, Bell, Sparkles } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-accent)" }}>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 inline-block">
            <div className="flex items-center justify-center gap-2 p-4 rounded-full bg-white/80 backdrop-blur shadow-lg">
              <Camera className="w-8 h-8 text-purple-600" />
              <Sparkles className="w-6 h-6 text-pink-500" />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold mb-6" 
              style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Faces from the Past
          </h1>
          
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Rediscover forgotten connections. Our AI-powered platform detects faces in your photos, 
            clusters people together, and reminds you of memories you thought were lost.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              className="text-lg px-8"
              style={{ background: "var(--gradient-primary)" }}
            >
              Get Started Free
            </Button>
            <Button
              onClick={() => navigate("/auth")}
              variant="outline"
              size="lg"
              className="text-lg px-8 border-2 border-purple-300 hover:border-purple-500"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white/80 backdrop-blur rounded-2xl p-8 shadow-lg text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
              <Camera className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">AI Face Detection</h3>
            <p className="text-gray-600">
              Advanced face recognition technology automatically identifies people in your photos
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-2xl p-8 shadow-lg text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-100 flex items-center justify-center">
              <Users className="w-8 h-8 text-pink-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Smart Clustering</h3>
            <p className="text-gray-600">
              Groups photos of the same person together, creating a complete timeline
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-2xl p-8 shadow-lg text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Personal Timelines</h3>
            <p className="text-gray-600">
              See when and where you encountered each person throughout the years
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-2xl p-8 shadow-lg text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <Bell className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Forgotten Faces</h3>
            <p className="text-gray-600">
              Get reminders about people you haven't seen in years and reconnect
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur rounded-3xl p-12 shadow-2xl">
          <h2 className="text-4xl font-bold mb-4" 
              style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Start Rediscovering Your Memories
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Upload your photos and let AI bring your forgotten connections back to life
          </p>
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="text-lg px-12"
            style={{ background: "var(--gradient-primary)" }}
          >
            Create Free Account
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
