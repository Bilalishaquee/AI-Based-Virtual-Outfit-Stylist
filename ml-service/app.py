from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import NearestNeighbors
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Mock ML model for outfit recommendations
# In production, this would be a trained model
scaler = StandardScaler()
model = NearestNeighbors(n_neighbors=3, metric='cosine')

def extract_color_features(color_hex):
    """Convert hex color to RGB features"""
    color = color_hex.lstrip('#')
    r = int(color[0:2], 16) / 255.0
    g = int(color[2:4], 16) / 255.0
    b = int(color[4:6], 16) / 255.0
    return [r, g, b]

def get_mood_encoding(mood):
    """Encode mood as feature vector"""
    mood_map = {
        'casual': [1, 0, 0, 0, 0],
        'formal': [0, 1, 0, 0, 0],
        'sporty': [0, 0, 1, 0, 0],
        'elegant': [0, 0, 0, 1, 0],
        'trendy': [0, 0, 0, 0, 1],
    }
    return mood_map.get(mood.lower(), [0.2, 0.2, 0.2, 0.2, 0.2])

def get_event_encoding(event_type):
    """Encode event type as feature vector"""
    event_map = {
        'casual': [1, 0, 0, 0, 0],
        'formal': [0, 1, 0, 0, 0],
        'sporty': [0, 0, 1, 0, 0],
        'party': [0, 0, 0, 1, 0],
        'work': [0, 0, 0, 0, 1],
    }
    return event_map.get(event_type.lower(), [0.2, 0.2, 0.2, 0.2, 0.2])

def get_weather_encoding(weather):
    """Encode weather condition"""
    weather_map = {
        'clear': [1, 0, 0],
        'clouds': [0, 1, 0],
        'rain': [0, 0, 1],
    }
    return weather_map.get(weather.lower(), [0.33, 0.33, 0.33])

def calculate_outfit_score(outfit, user_preferences, weather, event_type):
    """Calculate compatibility score for an outfit"""
    score = 0.5  # Base score
    
    # Color harmony (simplified)
    colors = []
    if outfit.get('top'):
        colors.append(extract_color_features(outfit['top'].get('dominantColor', '#808080')))
    if outfit.get('bottom'):
        colors.append(extract_color_features(outfit['bottom'].get('dominantColor', '#808080')))
    if outfit.get('shoes'):
        colors.append(extract_color_features(outfit['shoes'].get('dominantColor', '#808080')))
    
    if colors:
        avg_color = np.mean(colors, axis=0)
        favorite_color = extract_color_features(user_preferences.get('favoriteColor', '#808080'))
        color_similarity = 1 - np.linalg.norm(avg_color - favorite_color)
        score += color_similarity * 0.3
    
    # Category completeness
    has_top = 1 if outfit.get('top') else 0
    has_bottom = 1 if outfit.get('bottom') else 0
    has_shoes = 1 if outfit.get('shoes') else 0
    completeness = (has_top + has_bottom + has_shoes) / 3
    score += completeness * 0.2
    
    return min(score, 1.0)

def generate_stylist_comment(outfit, event_type, weather):
    """Generate a stylist comment based on outfit"""
    comments = {
        'casual': [
            "Perfect for a relaxed day out! The combination is comfortable yet stylish.",
            "A great casual look that's both trendy and practical.",
            "This outfit strikes the perfect balance between comfort and style.",
        ],
        'formal': [
            "An elegant and sophisticated look perfect for formal occasions.",
            "This ensemble exudes professionalism and class.",
            "A timeless formal outfit that will make a great impression.",
        ],
        'sporty': [
            "Active and dynamic - perfect for your active lifestyle!",
            "This sporty combination is both functional and fashionable.",
            "Great for staying active while looking great!",
        ],
        'party': [
            "Ready to turn heads! This outfit is perfect for a night out.",
            "A bold and exciting look that's perfect for celebrations.",
            "This combination will make you the center of attention!",
        ],
        'work': [
            "Professional and polished - perfect for the workplace.",
            "A smart business look that's both comfortable and stylish.",
            "This outfit balances professionalism with personal style.",
        ],
    }
    
    comment_list = comments.get(event_type.lower(), comments['casual'])
    return comment_list[np.random.randint(0, len(comment_list))]

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'ml-recommendation-service'})

@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        data = request.json
        gender = data.get('gender', 'other')
        mood = data.get('mood', 'casual')
        favorite_color = data.get('favoriteColor', '#808080')
        weather = data.get('weather', 'clear')
        event_type = data.get('eventType', 'casual')
        wardrobe_items = data.get('wardrobeItems', [])
        
        if len(wardrobe_items) < 3:
            return jsonify({
                'error': 'Insufficient wardrobe items',
                'recommendations': []
            }), 400
        
        # Categorize wardrobe items
        tops = [item for item in wardrobe_items if item.get('category') == 'top']
        bottoms = [item for item in wardrobe_items if item.get('category') == 'bottom']
        shoes = [item for item in wardrobe_items if item.get('category') == 'shoes']
        accessories = [item for item in wardrobe_items if item.get('category') == 'accessories']
        
        if not tops or not bottoms or not shoes:
            return jsonify({
                'error': 'Missing required categories (top, bottom, shoes)',
                'recommendations': []
            }), 400
        
        # Generate recommendations
        recommendations = []
        user_preferences = {
            'favoriteColor': favorite_color,
            'mood': mood,
        }
        
        # Generate 3-5 outfit combinations
        num_recommendations = min(5, len(tops) * len(bottoms) * len(shoes))
        
        for i in range(num_recommendations):
            # Select items (with some randomness)
            top = tops[np.random.randint(0, len(tops))]
            bottom = bottoms[np.random.randint(0, len(bottoms))]
            shoe = shoes[np.random.randint(0, len(shoes))]
            accessory_list = []
            if accessories:
                num_accessories = np.random.randint(0, min(2, len(accessories)) + 1)
                accessory_list = np.random.choice(accessories, num_accessories, replace=False).tolist()
            
            outfit = {
                'top': top,
                'bottom': bottom,
                'shoes': shoe,
                'accessories': accessory_list,
            }
            
            # Calculate score
            score = calculate_outfit_score(outfit, user_preferences, weather, event_type)
            
            # Generate comment
            comment = generate_stylist_comment(outfit, event_type, weather)
            
            recommendation = {
                'id': f'rec-{i}-{int(datetime.now().timestamp())}',
                'top': top,
                'bottom': bottom,
                'shoes': shoe,
                'accessories': accessory_list,
                'stylistComment': comment,
                'score': float(score),
                'timestamp': int(datetime.now().timestamp() * 1000),
            }
            
            recommendations.append(recommendation)
        
        # Sort by score
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        
        return jsonify({
            'recommendations': recommendations[:5],
            'count': len(recommendations)
        })
        
    except Exception as e:
        print(f"Error in recommendation: {str(e)}")
        return jsonify({
            'error': str(e),
            'recommendations': []
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

