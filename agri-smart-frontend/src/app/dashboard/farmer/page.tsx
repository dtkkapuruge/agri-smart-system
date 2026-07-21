"use client";

import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, CheckCircle, RefreshCcw, Activity, Image as ImageIcon } from 'lucide-react';

export default function FarmerDashboard() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{ score: string; grade: string; price: string; crop: string; forensicsStatus: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. You can still use file upload.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImageSrc(dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageSrc(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeCrop = async () => {
    if (!imageSrc) return;
    setIsAnalyzing(true);

    try {
      // Convert base64 to blob
      const res = await fetch(imageSrc);
      const blob = await res.blob();

      const formData = new FormData();
      formData.append('file', blob, 'crop_image.jpg');

      const response = await fetch('http://localhost:8000/api/v1/grade-crop', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      setResult({
        score: data?.qualityScore || 'N/A',
        grade: data?.grade || 'N/A',
        price: data?.estimatedPrice || 'N/A',
        crop: data?.crop || 'N/A',
        forensicsStatus: data?.forensicsStatus || 'N/A'
      });
    } catch (error) {
      console.error("Full error details:", error);
      alert("Failed to analyze crop. Please check your connection and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Crop Quality Analyzer</h1>
          <p className="text-gray-600 text-sm mt-1">Take a photo or upload an image to get instant quality grading and price estimates.</p>
        </header>

        {/* Camera / Preview Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {!imageSrc ? (
            <div className="relative aspect-[4/3] bg-gray-100 flex flex-col items-center justify-center">
              {stream ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
                    <button
                      onClick={takeSnapshot}
                      className="bg-white text-gray-900 p-4 rounded-full shadow-lg border-4 border-gray-200 active:scale-95 transition-transform"
                    >
                      <Camera className="w-8 h-8" />
                    </button>
                  </div>
                  <button
                    onClick={stopCamera}
                    className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full backdrop-blur-sm hover:bg-black/70 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <div className="text-center p-6 space-y-4 w-full">
                  <div className="flex justify-center">
                    <div className="bg-blue-50 text-blue-600 p-4 rounded-full">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  </div>
                  <div className="space-y-2 max-w-[250px] mx-auto">
                    <button
                      onClick={startCamera}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-medium transition-colors"
                    >
                      <Camera className="w-5 h-5" />
                      Open Camera
                    </button>
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                      <div className="relative flex justify-center text-sm"><span className="px-2 bg-gray-100 text-gray-500">or</span></div>
                    </div>
                    <label className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-3 rounded-xl font-medium cursor-pointer transition-colors">
                      <Upload className="w-5 h-5" />
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative aspect-[4/3] bg-black">
              <img src={imageSrc} alt="Crop preview" className="w-full h-full object-contain" />
              {!isAnalyzing && !result && (
                <button
                  onClick={clearImage}
                  className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full backdrop-blur-sm hover:bg-black/70 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Action Button */}
        {imageSrc && !result && (
          <button
            onClick={analyzeCrop}
            disabled={isAnalyzing}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-lg transition-all ${isAnalyzing
              ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
              }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCcw className="w-5 h-5 animate-spin" />
                Analyzing Image...
              </>
            ) : (
              <>
                <Activity className="w-5 h-5" />
                Analyze Crop Quality
              </>
            )}
          </button>
        )}

        {/* Results Card */}
        {result && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 text-green-600 mb-2">
              <CheckCircle className="w-6 h-6" />
              <h2 className="text-lg font-semibold text-gray-900">Analysis Complete</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Quality Score</p>
                <p className="text-2xl font-bold text-blue-600">{result.score}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Grade</p>
                <p className="text-2xl font-bold text-gray-900">{result.grade}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Crop</p>
                <p className="text-lg font-bold text-gray-900 capitalize">{result.crop}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Forensics</p>
                <p className="text-lg font-bold text-gray-900 capitalize">{result.forensicsStatus}</p>
              </div>
              <div className="col-span-2 bg-green-50 p-4 rounded-xl border border-green-100">
                <p className="text-xs text-green-700 font-medium uppercase tracking-wider mb-1">Estimated Market Price</p>
                <p className="text-2xl font-bold text-green-700">{result.price}</p>
              </div>
            </div>

            <button
              onClick={clearImage}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              Analyze Another Crop
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
