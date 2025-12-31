import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { motion } from 'framer-motion';
import { UserProfile, WardrobeItem } from '../../types';

interface AvatarCanvasProps {
  profile: UserProfile;
  outfit?: {
    top?: WardrobeItem;
    bottom?: WardrobeItem;
    shoes?: WardrobeItem;
    accessories?: WardrobeItem[];
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

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 300,
      height: 500,
      backgroundColor: '#f9fafb',
    });

    fabricCanvasRef.current = canvas;

    const renderAvatar = async () => {
      canvas.clear();
      setIsLoading(true);

      const centerX = canvas.width! / 2;
      const skinColor = skinToneColors[profile.skinTone] || skinToneColors.Medium;

      // Layer 1: Skin (body)
      const body = new fabric.Rect({
        left: centerX - 60,
        top: 150,
        width: 120,
        height: 200,
        fill: skinColor,
        rx: 60,
        selectable: false,
      });
      canvas.add(body);

      // Layer 2: Head
      const head = new fabric.Circle({
        left: centerX - 40,
        top: 50,
        radius: 40,
        fill: skinColor,
        selectable: false,
      });
      canvas.add(head);

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
      canvas.add(hair);

      // Layer 4: Top
      if (outfit?.top?.imageUrl) {
        fabric.Image.fromURL(outfit.top.imageUrl, (img) => {
          img.set({
            left: centerX - 50,
            top: 100,
            scaleX: 100 / (img.width || 1),
            scaleY: 100 / (img.height || 1),
            selectable: false,
          });
          canvas.add(img);
          canvas.renderAll();
        });
      } else {
        // Default top
        const defaultTop = new fabric.Rect({
          left: centerX - 50,
          top: 100,
          width: 100,
          height: 80,
          fill: '#6366f1',
          rx: 5,
          selectable: false,
        });
        canvas.add(defaultTop);
      }

      // Layer 5: Bottom
      if (outfit?.bottom?.imageUrl) {
        fabric.Image.fromURL(outfit.bottom.imageUrl, (img) => {
          img.set({
            left: centerX - 50,
            top: 250,
            scaleX: 100 / (img.width || 1),
            scaleY: 120 / (img.height || 1),
            selectable: false,
          });
          canvas.add(img);
          canvas.renderAll();
        });
      } else {
        // Default bottom
        const defaultBottom = new fabric.Rect({
          left: centerX - 50,
          top: 250,
          width: 100,
          height: 100,
          fill: '#1f2937',
          rx: 5,
          selectable: false,
        });
        canvas.add(defaultBottom);
      }

      // Layer 6: Shoes
      if (outfit?.shoes?.imageUrl) {
        fabric.Image.fromURL(outfit.shoes.imageUrl, (img) => {
          img.set({
            left: centerX - 30,
            top: 350,
            scaleX: 60 / (img.width || 1),
            scaleY: 40 / (img.height || 1),
            selectable: false,
          });
          canvas.add(img);
          canvas.renderAll();
        });
      } else {
        const defaultShoes = new fabric.Rect({
          left: centerX - 30,
          top: 350,
          width: 60,
          height: 40,
          fill: '#000000',
          rx: 5,
          selectable: false,
        });
        canvas.add(defaultShoes);
      }

      // Layer 7: Accessories
      if (outfit?.accessories && outfit.accessories.length > 0) {
        outfit.accessories.forEach((accessory, index) => {
          if (accessory.imageUrl) {
            fabric.Image.fromURL(accessory.imageUrl, (img) => {
              img.set({
                left: centerX - 20 + index * 40,
                top: 80,
                scaleX: 40 / (img.width || 1),
                scaleY: 40 / (img.height || 1),
                selectable: false,
              });
              canvas.add(img);
              canvas.renderAll();
            });
          }
        });
      }

      canvas.renderAll();
      setIsLoading(false);
    };

    renderAvatar();

    return () => {
      canvas.dispose();
    };
  }, [profile, outfit]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-purple-200">
        {isLoading && (
          <div className="flex items-center justify-center h-[500px] w-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        )}
        <canvas ref={canvasRef} className="rounded-lg" />
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 space-y-3 w-full max-w-xs">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Skin Tone
          </label>
          <select
            value={profile.skinTone}
            onChange={(e) => onSkinToneChange?.(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="short / long"
          />
        </div>
      </div>
    </div>
  );
}

