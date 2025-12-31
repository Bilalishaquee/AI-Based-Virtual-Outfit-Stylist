import WardrobeManager from '../components/wardrobe/WardrobeManager';

export default function WardrobePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <WardrobeManager />
      </div>
    </div>
  );
}

