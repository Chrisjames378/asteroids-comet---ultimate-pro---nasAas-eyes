import React, { useState, useRef } from 'react';
import { X, Sparkles, Video, Image as ImageIcon, Upload, Loader2, Play, Download, Wand2, RefreshCw } from 'lucide-react';
import { CelestialData } from '../types';
import { playUiSound } from '../utils/audio';

interface SpaceMediaModalProps {
  isOpen: boolean;
  activeTab: 'image' | 'video';
  currentObject: CelestialData;
  onClose: () => void;
}

export const SpaceMediaModal: React.FC<SpaceMediaModalProps> = ({
  isOpen,
  activeTab: initialTab,
  currentObject,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'video'>(initialTab);
  const [imageMode, setImageMode] = useState<'create' | 'edit'>('create');

  // Image states
  const [imagePrompt, setImagePrompt] = useState(
    `Ultra high resolution space telescope view of near-Earth asteroid ${currentObject.name} against deep space and distant galaxy clusters`
  );
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '1:1' | '9:16'>('16:9');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);

  // Video states (Veo)
  const [videoPrompt, setVideoPrompt] = useState(
    `Cinematic 3D orbital camera flyby around asteroid ${currentObject.name} showing surface craters and glowing stellar backdrop`
  );
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoOperationName, setVideoOperationName] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoStatusMessage, setVideoStatusMessage] = useState<string>('');
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedBase64(event.target?.result as string);
        playUiSound(600, 0.05);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || isGeneratingImage) return;
    setIsGeneratingImage(true);
    playUiSound(500, 0.05);

    try {
      if (imageMode === 'create') {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: imagePrompt,
            aspectRatio,
          }),
        });
        const data = await res.json();
        if (data.imageUrl) {
          setGeneratedImageUrl(data.imageUrl);
          playUiSound(800, 0.1);
        } else {
          alert(data.error || 'Image generation failed');
        }
      } else {
        // Edit mode
        if (!uploadedBase64 && !generatedImageUrl) {
          alert('Please upload an image or generate one first to edit.');
          setIsGeneratingImage(false);
          return;
        }
        const inputImg = uploadedBase64 || generatedImageUrl;
        const res = await fetch('/api/edit-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: imagePrompt,
            imageBase64: inputImg,
          }),
        });
        const data = await res.json();
        if (data.imageUrl) {
          setGeneratedImageUrl(data.imageUrl);
          playUiSound(850, 0.1);
        } else {
          alert(data.error || 'Image editing failed');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Network error generating image.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateVeoVideo = async () => {
    if (isVideoLoading) return;
    setIsVideoLoading(true);
    setVideoBlobUrl(null);
    setVideoStatusMessage('Initiating Veo neural video generation...');
    playUiSound(450, 0.05);

    try {
      // Step 1: Start operation
      const startRes = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt,
          imageBase64: uploadedBase64 || generatedImageUrl || null,
          aspectRatio: videoAspectRatio,
        }),
      });

      const startData = await startRes.json();
      if (!startData.operationName) {
        throw new Error(startData.error || 'Could not start Veo video generation');
      }

      const opName = startData.operationName;
      setVideoOperationName(opName);
      setVideoStatusMessage('Rendering physics & light rays (this may take 1-2 minutes)...');

      // Step 2: Poll operation status
      let isDone = false;
      let attempts = 0;

      while (!isDone && attempts < 40) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 5000));
        setVideoStatusMessage(`Veo rendering video frames... (${attempts * 5}s elapsed)`);

        const statusRes = await fetch('/api/video-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName: opName }),
        });
        const statusData = await statusRes.json();
        if (statusData.done) {
          isDone = true;
          if (statusData.error) {
            throw new Error(statusData.error.message || 'Veo video generation error');
          }
        }
      }

      if (!isDone) {
        throw new Error('Video generation timed out. Please try again.');
      }

      // Step 3: Stream & Download Video MP4
      setVideoStatusMessage('Downloading generated MP4 video stream...');
      const downloadRes = await fetch('/api/video-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationName: opName }),
      });

      if (!downloadRes.ok) {
        throw new Error('Failed to retrieve MP4 video stream');
      }

      const blob = await downloadRes.blob();
      const videoUrl = URL.createObjectURL(blob);
      setVideoBlobUrl(videoUrl);
      playUiSound(900, 0.12);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error generating video');
    } finally {
      setIsVideoLoading(false);
      setVideoStatusMessage('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md">
      <div className="bg-[#0b101e]/95 w-11/12 max-w-3xl rounded-2xl p-6 shadow-2xl border border-cyan-500/40 relative flex flex-col max-h-[90vh] text-slate-100 overflow-y-auto custom-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Top Header */}
        <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-slate-800 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-cyan-900/40 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-md">
            {activeTab === 'image' ? <ImageIcon className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <span>NASA Deep Space Imagery & Video Studio</span>
              <span className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full font-mono">
                {activeTab === 'image' ? 'Gemini 3.1 Flash Image' : 'Veo 3.1 Fast Video'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Generate telescope imagery and animated 3D flyby videos of {currentObject.name}
            </p>
          </div>
        </div>

        {/* Main Tab Switcher */}
        <div className="flex space-x-2 border-b border-slate-800 pb-3 mb-4 shrink-0">
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'image'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/50'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Space Image Creator & Editor</span>
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'video'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Veo Video Flyby Generator</span>
          </button>
        </div>

        {/* TAB 1: IMAGE CREATION & EDITING */}
        {activeTab === 'image' && (
          <div className="space-y-4">
            {/* Sub-mode switcher */}
            <div className="flex space-x-2">
              <button
                onClick={() => setImageMode('create')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
                  imageMode === 'create'
                    ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Create New Image
              </button>
              <button
                onClick={() => setImageMode('edit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
                  imageMode === 'edit'
                    ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Edit / Annotate Photo
              </button>
            </div>

            {/* Prompt input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
                {imageMode === 'create' ? 'Telescope Image Prompt:' : 'Edit & Overlay Instructions:'}
              </label>
              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                rows={2}
                placeholder={
                  imageMode === 'create'
                    ? 'Describe space scene...'
                    : 'e.g. Add glowing telemetry HUD overlay, radar target box and orbital trajectory vectors'
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Aspect Ratio:</span>
                {(['16:9', '1:1', '9:16'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono transition cursor-pointer ${
                      aspectRatio === ratio
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>

              {imageMode === 'edit' && (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-mono flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{uploadedBase64 ? 'Change Uploaded Photo' : 'Upload Source Photo'}</span>
                  </button>
                </div>
              )}

              <button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !imagePrompt.trim()}
                className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-cyan-950/50 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
                    <span>Processing Gemini Image...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>{imageMode === 'create' ? 'Generate Image' : 'Apply Image Edit'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Display Generated / Uploaded Image */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center min-h-[260px] relative">
              {generatedImageUrl ? (
                <div className="space-y-3 w-full flex flex-col items-center">
                  <img
                    src={generatedImageUrl}
                    alt="Gemini Space Generation"
                    className="max-h-[340px] rounded-lg shadow-2xl border border-cyan-500/30 object-contain"
                  />
                  <a
                    href={generatedImageUrl}
                    download={`gemini-space-${currentObject.id || 'target'}.png`}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-mono rounded-lg border border-cyan-500/40 flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Image</span>
                  </a>
                </div>
              ) : uploadedBase64 ? (
                <div className="space-y-2 text-center">
                  <p className="text-xs text-slate-400 font-mono mb-2">Source Image Ready for Gemini Editing:</p>
                  <img
                    src={uploadedBase64}
                    alt="Uploaded source"
                    className="max-h-[260px] rounded-lg shadow-md border border-slate-700 object-contain mx-auto"
                  />
                </div>
              ) : (
                <div className="text-center text-slate-500 space-y-2">
                  <Sparkles className="w-8 h-8 text-cyan-500/40 mx-auto" />
                  <p className="text-xs font-mono">No image generated yet. Enter a prompt above to capture space imagery!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: VEO VIDEO FLYBY GENERATOR */}
        {activeTab === 'video' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-purple-300 mb-1 font-mono">
                Veo 3.1 Video Animation Prompt:
              </label>
              <textarea
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                rows={2}
                placeholder="e.g. Cinematic HD 3D flyby camera orbiting near-Earth asteroid with star field motion blur"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            {/* Options */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Aspect Ratio:</span>
                {(['16:9', '9:16'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setVideoAspectRatio(ratio)}
                    className={`px-3 py-1 rounded text-[11px] font-mono transition cursor-pointer ${
                      videoAspectRatio === ratio
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {ratio === '16:9' ? '16:9 Landscape' : '9:16 Portrait'}
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerateVeoVideo}
                disabled={isVideoLoading}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-purple-950/50 cursor-pointer disabled:opacity-50"
              >
                {isVideoLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                    <span>Rendering Veo Video...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Generate Veo 3D Video</span>
                  </>
                )}
              </button>
            </div>

            {/* Video Player Display */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center min-h-[280px]">
              {videoBlobUrl ? (
                <div className="space-y-3 w-full flex flex-col items-center">
                  <video
                    src={videoBlobUrl}
                    controls
                    autoPlay
                    loop
                    className="max-h-[360px] w-full rounded-lg shadow-2xl border border-purple-500/40 object-contain bg-black"
                  />
                  <a
                    href={videoBlobUrl}
                    download={`veo-space-flyby-${currentObject.id || 'target'}.mp4`}
                    className="px-4 py-1.5 bg-purple-950/80 hover:bg-purple-900 text-purple-200 text-xs font-mono rounded-lg border border-purple-500/40 flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download MP4 Video</span>
                  </a>
                </div>
              ) : isVideoLoading ? (
                <div className="text-center space-y-3 py-8">
                  <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto" />
                  <p className="text-xs font-mono text-purple-300 animate-pulse">{videoStatusMessage}</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Veo neural video diffusion takes ~60-90 seconds to compute raytraced orbital geometry. Please keep this modal open.
                  </p>
                </div>
              ) : (
                <div className="text-center text-slate-500 space-y-2">
                  <Video className="w-8 h-8 text-purple-500/40 mx-auto" />
                  <p className="text-xs font-mono">Click "Generate Veo 3D Video" to animate an orbital space flyby!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
