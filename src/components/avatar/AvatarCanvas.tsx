import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { motion } from 'framer-motion';
import { UserProfile, WardrobeItem } from '../../types';
import { generateAvatarWithClothes, isAIAvatarAvailable } from '../../services/aiAvatarService';
import { Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

interface AvatarCanvasProps {
  profile: UserProfile;
  outfit?: {
    top?: WardrobeItem;
    bottom?: WardrobeItem;
    shoes?: WardrobeItem;
    outerwear?: WardrobeItem[];
  };
  onSkinToneChange?: (skinTone: string) => void;
  onHairStyleChange?: (hairStyle: string) => void;
}

const skinToneColors: Record<string, string> = {
  Fair: '#FDBBAE',
  Medium: '#D08B5B',
  Dark: '#8B4513',
};

export default function AvatarCanvas({
  profile,
  outfit,
  onSkinToneChange,
  onHairStyleChange,
}: AvatarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useAI, setUseAI] = useState(false); // Start with canvas mode (always works, free)
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  
  // Hide AI mode by default - use simple canvas mode (free, no API needed)
  const showAIToggle = false; // Set to false to hide AI Avatar button

  // Generate AI avatar when outfit or profile changes
  useEffect(() => {
    if (!useAI || !isAIAvatarAvailable() || !outfit) {
      setAiImageUrl(null);
      setAiError(null);
      setAiGenerating(false);
      return;
    }

    // Clean up canvas when switching to AI mode
    if (fabricCanvasRef.current) {
      try {
        const canvas = fabricCanvasRef.current;
        // Clear all objects
        canvas.clear();
        // Remove all event listeners
        canvas.off();
        // Dispose properly - catch removeChild errors since React manages DOM
        try {
          canvas.dispose();
        } catch (disposeError: any) {
          // Ignore removeChild errors - React manages the DOM
          if (!disposeError?.message?.includes('removeChild')) {
            console.warn('Canvas disposal warning:', disposeError);
          }
        }
      } catch (e) {
        console.warn('Canvas cleanup warning:', e);
      } finally {
        fabricCanvasRef.current = null;
      }
    }

    const generateAIAvatar = async () => {
      setAiGenerating(true);
      setAiError(null);
      
      try {
        const imageUrl = await generateAvatarWithClothes({
          skinTone: profile.skinTone,
          gender: profile.gender,
          hairStyle: profile.hairStyle,
          clothingImages: {
            top: outfit.top ? { 
              imageUrl: outfit.top.imageUrl, 
              dominantColor: outfit.top.dominantColor 
            } : undefined,
            bottom: outfit.bottom ? { 
              imageUrl: outfit.bottom.imageUrl, 
              dominantColor: outfit.bottom.dominantColor 
            } : undefined,
            shoes: outfit.shoes ? { 
              imageUrl: outfit.shoes.imageUrl, 
              dominantColor: outfit.shoes.dominantColor 
            } : undefined,
            outerwear: outfit.outerwear?.map(item => ({
              imageUrl: item.imageUrl,
              dominantColor: item.dominantColor,
            })),
          },
        });
        
        setAiImageUrl(imageUrl);
        setAiError(null);
      } catch (error: any) {
        console.error('AI avatar generation failed:', error);
        const errorMessage = error.message || 'Failed to generate AI avatar';
        setAiError(errorMessage);
        setAiImageUrl(null);
        // Don't auto-switch to canvas - let user decide
      } finally {
        setAiGenerating(false);
      }
    };

    generateAIAvatar();
  }, [outfit, profile.skinTone, profile.gender, profile.hairStyle, useAI]);

  // Canvas rendering (fallback mode)
  useEffect(() => {
    // Don't render canvas if using AI mode
    if (useAI) {
      // Ensure canvas is cleaned up
      if (fabricCanvasRef.current) {
        try {
          const canvas = fabricCanvasRef.current;
          canvas.clear();
          canvas.off();
          // Dispose properly - catch removeChild errors
          try {
            canvas.dispose();
          } catch (disposeError: any) {
            // Ignore removeChild errors - React manages the DOM
            if (!disposeError?.message?.includes('removeChild')) {
              console.warn('Canvas disposal warning:', disposeError);
            }
          }
        } catch (e) {
          console.warn('Canvas cleanup warning:', e);
        } finally {
          fabricCanvasRef.current = null;
        }
      }
      setIsLoading(false);
      return;
    }

    // Don't proceed if canvas ref is not available
    if (!canvasRef.current) {
      return;
    }

    // Clean up existing canvas if any
    if (fabricCanvasRef.current) {
      try {
        const oldCanvas = fabricCanvasRef.current;
        oldCanvas.clear();
        oldCanvas.off();
        // Dispose properly - catch any removeChild errors since React manages DOM
        try {
          oldCanvas.dispose();
        } catch (disposeError: any) {
          // Ignore removeChild errors - React manages the DOM
          // The error is expected when Fabric tries to remove an element React controls
          if (!disposeError?.message?.includes('removeChild')) {
            console.warn('Canvas disposal warning:', disposeError);
          }
        }
      } catch (e) {
        console.warn('Canvas cleanup warning:', e);
      } finally {
        fabricCanvasRef.current = null;
      }
    }

    // Create new canvas only if element exists
    if (!canvasRef.current) {
      return;
    }

    let canvas: fabric.Canvas;
    try {
      // Check if element already has a Fabric instance attached
      const element = canvasRef.current;
      if ((element as any).__canvas) {
        // Element already has a canvas instance, clear it first
        try {
          const existingCanvas = (element as any).__canvas;
          if (existingCanvas && existingCanvas !== fabricCanvasRef.current) {
            existingCanvas.clear();
            existingCanvas.off();
            try {
              existingCanvas.dispose();
            } catch (e) {
              // Ignore disposal errors
            }
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      
      canvas = new fabric.Canvas(canvasRef.current, {
        width: 300,
        height: 500,
        backgroundColor: '#f9fafb',
      });
      fabricCanvasRef.current = canvas;
    } catch (e) {
      console.error('Failed to create canvas:', e);
      setIsLoading(false);
      return;
    }

    const renderAvatar = async () => {
      // Check if canvas is still valid
      if (!fabricCanvasRef.current || !canvasRef.current) {
        setIsLoading(false);
        return;
      }

      const currentCanvas = fabricCanvasRef.current;
      currentCanvas.clear();
      setIsLoading(true);

      const centerX = currentCanvas.width! / 2;
      const skinColor = skinToneColors[profile.skinTone] || skinToneColors.Medium;

      // Layer 1: Skin (body) - base layer
      const body = new fabric.Rect({
        left: centerX - 60,
        top: 150,
        width: 120,
        height: 200,
        fill: skinColor,
        rx: 60,
        selectable: false,
      });
      currentCanvas.add(body);

      // Layer 2: Head
      const head = new fabric.Circle({
        left: centerX - 40,
        top: 50,
        radius: 40,
        fill: skinColor,
        selectable: false,
      });
      currentCanvas.add(head);

      // Layer 3: Hair
      const hairStyle = profile.hairStyle || 'short';
      let hair;
      if (hairStyle.toLowerCase().includes('long')) {
        hair = new fabric.Group([
          new fabric.Circle({
            left: 0,
            top: 0,
            radius: 45,
            fill: '#4A3728',
            originX: 'center',
            originY: 'center',
          }),
          new fabric.Rect({
            left: -45,
            top: 45,
            width: 90,
            height: 60,
            fill: '#4A3728',
            rx: 5,
          }),
        ], {
          left: centerX,
          top: 50,
          selectable: false,
        });
      } else {
        hair = new fabric.Circle({
          left: centerX - 45,
          top: 45,
          radius: 45,
          fill: '#4A3728',
          selectable: false,
        });
      }
      currentCanvas.add(hair);

      // Track loading promises for all images
      const imagePromises: Promise<void>[] = [];

      // Layer 4: Top (clothing layer) - overlay the actual clothing image
      if (outfit?.top?.imageUrl) {
        const topPromise = new Promise<void>((resolve) => {
          fabric.Image.fromURL(
            outfit.top.imageUrl!,
            (img) => {
              // Calculate proper scaling to fit avatar body - make it cover the torso area
              const targetWidth = 120;
              const targetHeight = 100;
              const scaleX = targetWidth / (img.width || 1);
              const scaleY = targetHeight / (img.height || 1);
              const scale = Math.max(scaleX, scaleY); // Use max to cover the area better
              
              img.set({
                left: centerX,
                top: 90,
                scaleX: scale,
                scaleY: scale,
                selectable: false,
                originX: 'center',
                originY: 'top',
                opacity: 0.95, // Slight transparency to blend with avatar
              });
              
              if (fabricCanvasRef.current) {
                fabricCanvasRef.current.add(img);
                fabricCanvasRef.current.renderAll();
              }
              resolve();
            },
            { crossOrigin: 'anonymous' }
          ).catch((error) => {
            console.warn('Failed to load top image:', error);
            resolve(); // Continue even if image fails to load
          });
        });
        imagePromises.push(topPromise);
      } else {
        // Default top
        const defaultTop = new fabric.Rect({
          left: centerX - 55,
          top: 95,
          width: 110,
          height: 90,
          fill: '#6366f1',
          rx: 8,
          selectable: false,
        });
        currentCanvas.add(defaultTop);
      }

      // Layer 5: Bottom (pants/skirt) - overlay the actual clothing image
      if (outfit?.bottom?.imageUrl) {
        const bottomPromise = new Promise<void>((resolve) => {
          fabric.Image.fromURL(
            outfit.bottom.imageUrl!,
            (img) => {
              // Calculate proper scaling to fit avatar legs - make it cover the leg area
              const targetWidth = 120;
              const targetHeight = 160;
              const scaleX = targetWidth / (img.width || 1);
              const scaleY = targetHeight / (img.height || 1);
              const scale = Math.max(scaleX, scaleY); // Use max to cover the area better
              
              img.set({
                left: centerX,
                top: 190, // Start from where top ends
                scaleX: scale,
                scaleY: scale,
                selectable: false,
                originX: 'center',
                originY: 'top',
                opacity: 0.95, // Slight transparency to blend with avatar
              });
              
              if (fabricCanvasRef.current) {
                fabricCanvasRef.current.add(img);
                fabricCanvasRef.current.renderAll();
              }
              resolve();
            },
            { crossOrigin: 'anonymous' }
          ).catch((error) => {
            console.warn('Failed to load bottom image:', error);
            resolve(); // Continue even if image fails to load
          });
        });
        imagePromises.push(bottomPromise);
      } else {
        // Default bottom
        const defaultBottom = new fabric.Rect({
          left: centerX - 55,
          top: 185,
          width: 110,
          height: 150,
          fill: '#1f2937',
          rx: 8,
          selectable: false,
        });
        currentCanvas.add(defaultBottom);
      }

      // Layer 6: Shoes (at the bottom of legs)
      if (outfit?.shoes?.imageUrl) {
        const shoesPromise = new Promise<void>((resolve) => {
          let loadedCount = 0;
          const checkComplete = () => {
            loadedCount++;
            if (loadedCount === 2) {
              if (fabricCanvasRef.current) {
                fabricCanvasRef.current.renderAll();
              }
              resolve();
            }
          };
          
          // Left shoe
          fabric.Image.fromURL(
            outfit.shoes.imageUrl!,
            (imgLeft) => {
              const shoeWidth = 40;
              const shoeHeight = 30;
              const scaleX = shoeWidth / (imgLeft.width || 1);
              const scaleY = shoeHeight / (imgLeft.height || 1);
              const scale = Math.max(scaleX, scaleY); // Cover area better
              
              imgLeft.set({
                left: centerX - 27,
                top: 330,
                scaleX: scale,
                scaleY: scale,
                selectable: false,
                originX: 'center',
                originY: 'top',
                opacity: 0.95,
              });
              if (fabricCanvasRef.current) {
                fabricCanvasRef.current.add(imgLeft);
              }
              checkComplete();
            },
            { crossOrigin: 'anonymous' }
          ).catch((error) => {
            console.warn('Failed to load left shoe:', error);
            checkComplete();
          });
          
          // Right shoe
          fabric.Image.fromURL(
            outfit.shoes.imageUrl!,
            (imgRight) => {
              const shoeWidth = 40;
              const shoeHeight = 30;
              const scaleX = shoeWidth / (imgRight.width || 1);
              const scaleY = shoeHeight / (imgRight.height || 1);
              const scale = Math.max(scaleX, scaleY); // Cover area better
              
              imgRight.set({
                left: centerX + 27,
                top: 330,
                scaleX: scale,
                scaleY: scale,
                selectable: false,
                originX: 'center',
                originY: 'top',
                opacity: 0.95,
              });
              if (fabricCanvasRef.current) {
                fabricCanvasRef.current.add(imgRight);
              }
              checkComplete();
            },
            { crossOrigin: 'anonymous' }
          ).catch((error) => {
            console.warn('Failed to load right shoe:', error);
            checkComplete();
          });
        });
        imagePromises.push(shoesPromise);
      } else {
        // Default shoes (left and right)
        const defaultShoeLeft = new fabric.Rect({
          left: centerX - 27,
          top: 330,
          width: 35,
          height: 25,
          fill: '#000000',
          rx: 5,
          selectable: false,
        });
        const defaultShoeRight = new fabric.Rect({
          left: centerX + 10,
          top: 330,
          width: 35,
          height: 25,
          fill: '#000000',
          rx: 5,
          selectable: false,
        });
        currentCanvas.add(defaultShoeLeft);
        currentCanvas.add(defaultShoeRight);
      }

      // Layer 7: Outerwear (jackets, coats, etc. - positioned on top of outfit)
      if (outfit?.outerwear && outfit.outerwear.length > 0) {
        outfit.outerwear.forEach((item, index) => {
          if (item.imageUrl) {
            const outerwearPromise = new Promise<void>((resolve) => {
              fabric.Image.fromURL(
                item.imageUrl!,
                (img) => {
                  // Outerwear should cover more area (like a jacket)
                  const outerwearWidth = 130;
                  const outerwearHeight = 180;
                  const scaleX = outerwearWidth / (img.width || 1);
                  const scaleY = outerwearHeight / (img.height || 1);
                  const scale = Math.max(scaleX, scaleY);
                  
                  // Position outerwear over the torso area
                  const angle = (index * 360) / outfit.outerwear!.length;
                  const radius = 40;
                  const x = centerX + Math.cos((angle * Math.PI) / 180) * radius;
                  const y = 120 + Math.sin((angle * Math.PI) / 180) * radius;
                  
                  img.set({
                    left: x,
                    top: y,
                    scaleX: scale,
                    scaleY: scale,
                    selectable: false,
                    originX: 'center',
                    originY: 'center',
                    opacity: 0.95,
                  });
                  if (fabricCanvasRef.current) {
                    fabricCanvasRef.current.add(img);
                    fabricCanvasRef.current.renderAll();
                  }
                  resolve();
                },
                { crossOrigin: 'anonymous' }
              ).catch((error) => {
                console.warn('Failed to load outerwear:', error);
                resolve(); // Continue even if image fails to load
              });
            });
            imagePromises.push(outerwearPromise);
          }
        });
      }

      // Wait for all images to load before hiding loading state
      Promise.all(imagePromises).then(() => {
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.renderAll();
        }
        setIsLoading(false);
      }).catch(() => {
        // Even if some images fail, hide loading
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.renderAll();
        }
        setIsLoading(false);
      });
      
      // If no images to load, hide loading immediately
      if (imagePromises.length === 0) {
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.renderAll();
        }
        setIsLoading(false);
      }
    };

    renderAvatar();

    return () => {
      // Cleanup canvas on unmount
      if (fabricCanvasRef.current) {
        try {
          const canvas = fabricCanvasRef.current;
          // Clear all objects and remove listeners
          canvas.clear();
          canvas.off();
          // Dispose properly - catch removeChild errors since React manages DOM
          try {
            canvas.dispose();
          } catch (disposeError: any) {
            // Ignore removeChild errors - React manages the DOM
            // This is expected when React unmounts the component
            if (!disposeError?.message?.includes('removeChild')) {
              console.warn('Cleanup disposal warning:', disposeError);
            }
          }
        } catch (e) {
          console.warn('Cleanup error:', e);
        } finally {
          fabricCanvasRef.current = null;
        }
      }
    };
  }, [profile, outfit, useAI]);

  const aiAvailable = isAIAvatarAvailable();

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* AI/Canvas Toggle - Hidden by default, using free Canvas mode */}
      {showAIToggle && aiAvailable && (
        <div className="flex items-center gap-2 bg-white rounded-lg p-2 shadow-md">
          <button
            onClick={() => setUseAI(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              useAI
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI Avatar
          </button>
          <button
            onClick={() => {
              setUseAI(false);
              setAiImageUrl(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              !useAI
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Canvas
          </button>
        </div>
      )}
      
      {/* Info text for Canvas mode */}
      {!showAIToggle && (
        <div className="text-sm text-gray-600 text-center px-4">
          Simple avatar with your selected outfit
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-orange-200 relative" style={{ minHeight: '500px', minWidth: '300px' }}>
        {/* Always render canvas element in DOM to prevent React removal issues */}
        <canvas 
          ref={canvasRef} 
          className="rounded-lg" 
          style={{ 
            display: (useAI && aiAvailable) ? 'none' : (isLoading ? 'none' : 'block'),
            width: '300px',
            height: '500px',
            position: (useAI && aiAvailable) ? 'absolute' : 'relative',
            pointerEvents: (useAI && aiAvailable) ? 'none' : 'auto'
          }} 
        />
        
        {/* AI Avatar Display */}
        {useAI && aiAvailable ? (
          <>
            {aiGenerating && (
              <div className="flex flex-col items-center justify-center h-[500px] w-[300px] space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                <p className="text-sm text-gray-600">Generating AI avatar...</p>
                <p className="text-xs text-gray-500">This may take 10-20 seconds</p>
              </div>
            )}
            
            {aiError && !aiGenerating && (
              <div className="flex flex-col items-center justify-center h-[500px] w-[300px] space-y-4 p-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <p className="text-sm text-red-600 text-center">{aiError}</p>
                {aiError.includes('not configured') && (
                  <div className="text-xs text-gray-600 text-center space-y-2">
                    <p>To use AI avatars, add your Hugging Face API key:</p>
                    <p className="font-mono bg-gray-100 p-2 rounded">
                      backend/.env<br />
                      HUGGINGFACE_API_KEY=your-key-here
                    </p>
                    <p className="text-xs">Then restart your backend server.</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setUseAI(false);
                      setAiError(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                  >
                    Use Canvas Instead
                  </button>
                  <button
                    onClick={() => {
                      setAiError(null);
                      setAiGenerating(true);
                      // Trigger regeneration by toggling useAI
                      setUseAI(false);
                      setTimeout(() => setUseAI(true), 100);
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
            
            {aiImageUrl && !aiGenerating && (
              <div className="relative">
                <img
                  src={aiImageUrl}
                  alt="AI Generated Avatar"
                  className="w-full h-auto rounded-lg max-h-[500px] object-contain"
                />
                <button
                  onClick={() => {
                    setAiGenerating(true);
                    setAiError(null);
                    // Trigger regeneration
                    setUseAI(false);
                    setTimeout(() => setUseAI(true), 100);
                  }}
                  className="absolute top-2 right-2 bg-orange-600 text-white p-2 rounded-full hover:bg-orange-700 transition-colors shadow-lg"
                  title="Regenerate"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {!aiImageUrl && !aiGenerating && !aiError && (
              <div className="flex items-center justify-center h-[500px] w-[300px]">
                <p className="text-gray-500">Click "Get Recommendations" to generate avatar</p>
              </div>
            )}
          </>
        ) : (
          /* Canvas Display (Fallback) */
          <>
            {isLoading && (
              <div className="flex items-center justify-center absolute inset-0 bg-white bg-opacity-90 rounded-lg z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 space-y-3 w-full max-w-xs">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Skin Tone
          </label>
          <select
            value={profile.skinTone}
            onChange={(e) => onSkinToneChange?.(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="Fair">Fair</option>
            <option value="Medium">Medium</option>
            <option value="Dark">Dark</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hair Style
          </label>
          <input
            type="text"
            value={profile.hairStyle}
            onChange={(e) => onHairStyleChange?.(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            placeholder="short / long"
          />
        </div>
      </div>
    </div>
  );
}

