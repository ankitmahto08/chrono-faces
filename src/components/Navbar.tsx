import { Link, useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Camera, Users, BarChart3, Bell } from "lucide-react";
import { toast } from "sonner";

interface NavbarProps {
  user: User;
}

const Navbar = ({ user }: NavbarProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-purple-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Camera className="w-6 h-6 text-purple-600" />
            <span className="text-xl font-bold" 
                  style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Faces from the Past
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/upload" className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors">
              <Camera className="w-4 h-4" />
              <span>Upload</span>
            </Link>
            <Link to="/people" className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors">
              <Users className="w-4 h-4" />
              <span>People</span>
            </Link>
            <Link to="/analytics" className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </Link>
            <Link to="/reminders" className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors">
              <Bell className="w-4 h-4" />
              <span>Reminders</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden md:inline">
              {user.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;