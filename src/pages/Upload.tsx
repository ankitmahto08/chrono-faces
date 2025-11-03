import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as faceapi from "@vladmandic/face-api";

const Upload = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    });

    // Load face-api models
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        toast.success("Face detection ready!");
      } catch (error) {
        console.error("Error loading models:", error);
        toast.error("Failed to load face detection models");
      }
    };

    loadModels();
  }, [navigate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
    }
  };

  const detectFaces = async (imageElement: HTMLImageElement) => {
    const detections = await faceapi
      .detectAllFaces(imageElement)
      .withFaceLandmarks()
      .withFaceDescriptors();
    return detections;
  };

  const handleUpload = async () => {
    if (!user || selectedFiles.length === 0) return;
    
    if (!modelsLoaded) {
      toast.error("Face detection models not loaded yet. Please wait.");
      return;
    }

    setUploading(true);

    try {
      for (const file of selectedFiles) {
        // Upload to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('photos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName);

        // Create photo record
        const { data: photo, error: photoError } = await supabase
          .from('photos')
          .insert({
            user_id: user.id,
            url: publicUrl,
            date_taken: new Date().toISOString(),
          })
          .select()
          .single();

        if (photoError) throw photoError;

        // Detect faces
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const faces = await detectFaces(img);

        // Save face embeddings
        for (const face of faces) {
          const { error: embeddingError } = await supabase
            .from('face_embeddings')
            .insert({
              photo_id: photo.id,
              embedding: Array.from(face.descriptor),
              bbox: {
                x: face.detection.box.x,
                y: face.detection.box.y,
                width: face.detection.box.width,
                height: face.detection.box.height,
              },
            });

          if (embeddingError) console.error("Error saving embedding:", embeddingError);
        }

        URL.revokeObjectURL(img.src);
      }

      toast.success(`Successfully uploaded ${selectedFiles.length} photo(s) with face detection!`);
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Navigate to people page to cluster faces
      navigate("/people");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photos");
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navbar user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8" 
            style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Upload Photos
        </h1>

        <Card className="p-8 border-0 shadow-lg bg-white/80 backdrop-blur">
          <div className="text-center mb-6">
            <div className="inline-block p-4 rounded-full bg-purple-100 mb-4">
              <UploadIcon className="w-12 h-12 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Upload Your Memories</h2>
            <p className="text-muted-foreground">
              Select photos to upload. We'll automatically detect and organize faces!
            </p>
            {!modelsLoaded && (
              <p className="text-sm text-yellow-600 mt-2">Loading face detection models...</p>
            )}
          </div>

          <div className="space-y-6">
            <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer"
              >
                <div className="flex flex-col items-center gap-2">
                  <UploadIcon className="w-8 h-8 text-purple-400" />
                  <p className="text-sm font-medium">Click to select photos</p>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG supported
                  </p>
                </div>
              </label>
            </div>

            {selectedFiles.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">
                  Selected: {selectedFiles.length} file(s)
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-purple-200">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0 || !modelsLoaded}
              className="w-full"
              style={{ background: "var(--gradient-primary)" }}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading and detecting faces...
                </>
              ) : (
                `Upload ${selectedFiles.length} Photo(s)`
              )}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Upload;