import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, X, UploadCloud, Image as ImageIcon } from "lucide-react";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export default function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Downscale to max 1200px width/height for database optimization
          const MAX_SIZE = 1200;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to jpeg at 0.8 quality (very efficient file size)
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const processFiles = async (files: FileList) => {
    setIsUploading(true);
    const newImageUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image.`,
          variant: "destructive",
        });
        continue;
      }

      // Compress and convert to base64 locally
      try {
        const base64Data = await compressImage(file);
        newImageUrls.push(base64Data);
      } catch (error: any) {
        console.error("Compression error:", error);
        toast({
          title: "Processing Failed",
          description: `Could not process ${file.name}: ${error.message || String(error)}`,
          variant: "destructive",
        });
      }
    }

    if (newImageUrls.length > 0) {
      onChange([...images, ...newImageUrls]);
      toast({
        title: "Upload Successful",
        description: `Successfully added ${newImageUrls.length} image(s).`,
      });
    }

    setIsUploading(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
    }
  };

  const removeImage = (indexToRemove: number) => {
    const updatedImages = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updatedImages);
    toast({
      title: "Image Removed",
      description: "The image has been removed from the list.",
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4 font-poppins">
      {/* Previews Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {images.map((url, idx) => (
            <div
              key={idx}
              className="relative aspect-square rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 group shadow-sm hover:shadow transition-shadow duration-200"
            >
              <img
                src={url}
                alt={`Preview ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              
              {/* Badge for cover/main image */}
              {idx === 0 && (
                <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  Cover
                </div>
              )}

              {/* Hover overlay with Delete Button */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="rounded-full w-8 h-8 cursor-pointer"
                  onClick={() => removeImage(idx)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[160px] relative ${
          isDragging
            ? "border-primary bg-primary/5 scale-[0.99] shadow-inner"
            : "border-zinc-200 dark:border-zinc-850 hover:border-zinc-350 dark:hover:border-zinc-750 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900"
        } ${isUploading ? "opacity-60 pointer-events-none" : ""}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/*"
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="font-semibold text-sm text-zinc-600 dark:text-zinc-400">
              Uploading images...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className={`p-3 rounded-full bg-white dark:bg-zinc-850 shadow-sm border transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}>
              <UploadCloud className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div>
              <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                Drag & drop image files here
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-450 mt-1">
                or click to browse files (JPEG, PNG, WEBP, GIF)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
