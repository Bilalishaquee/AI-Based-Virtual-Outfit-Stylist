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

def calculate_outfit_score(outfit, user_preferences, weather, event_type, season=None):
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
    has_outerwear = 1 if outfit.get('outerwear') and len(outfit.get('outerwear', [])) > 0 else 0
    completeness = (has_top + has_bottom + has_shoes) / 3
    score += completeness * 0.2
    
    # Season-appropriate scoring (boost score if outerwear matches season)
    if season:
        if season == 'winter' and has_outerwear:
            score += 0.1  # Bonus for having outerwear in winter
        elif season == 'summer' and not has_outerwear:
            score += 0.05  # Bonus for not having outerwear in summer
    
    return min(score, 1.0)

def generate_stylist_comment(outfit, event_type, weather, mood=None, season=None):
    """Generate a stylist comment based on outfit, event, weather, mood, and season"""
    import random
    
    # Season-based recommendations
    season_notes = {
        'summer': 'Perfect for warm summer days',
        'winter': 'Ideal for cold winter weather',
        'spring/fall': 'Great for moderate temperatures',
    }
    
    # Weather-based recommendations
    weather_notes = {
        'clear': 'Perfect sunny day outfit',
        'sunny': 'Great for bright weather',
        'rain': 'Weather-appropriate with protection in mind',
        'clouds': 'Ideal for overcast conditions',
        'cold': 'Warm and cozy for cooler temperatures',
        'hot': 'Light and breathable for warm weather',
    }
    
    weather_note = weather_notes.get(weather.lower(), 'Weather-appropriate')
    season_note = season_notes.get(season, '') if season else ''
    
    # Combine weather and season notes
    if season_note:
        weather_note = f"{season_note}. {weather_note}"
    
    # Event-based comments
    event_comments = {
        'casual': [
            f"Perfect for a relaxed day out! {weather_note}. The combination is comfortable yet stylish.",
            f"A great casual look that's both trendy and practical. {weather_note}.",
            f"This outfit strikes the perfect balance between comfort and style. {weather_note}.",
        ],
        'formal': [
            f"An elegant and sophisticated look perfect for formal occasions. {weather_note}.",
            f"This ensemble exudes professionalism and class. {weather_note}.",
            f"A timeless formal outfit that will make a great impression. {weather_note}.",
        ],
        'sporty': [
            f"Active and dynamic - perfect for your active lifestyle! {weather_note}.",
            f"This sporty combination is both functional and fashionable. {weather_note}.",
            f"Great for staying active while looking great! {weather_note}.",
        ],
        'party': [
            f"Ready to turn heads! This outfit is perfect for a night out. {weather_note}.",
            f"A bold and exciting look that's perfect for celebrations. {weather_note}.",
            f"This combination will make you the center of attention! {weather_note}.",
        ],
        'work': [
            f"Professional and polished - perfect for the workplace. {weather_note}.",
            f"A smart business look that's both comfortable and stylish. {weather_note}.",
            f"This outfit balances professionalism with personal style. {weather_note}.",
        ],
    }
    
    # Get base comment based on event
    comment_list = event_comments.get(event_type.lower(), event_comments['casual'])
    base_comment = comment_list[random.randint(0, len(comment_list) - 1)]
    
    # Add mood-specific note if provided
    mood_notes = {
        'elegant': ' The elegant mood adds sophistication to this look.',
        'trendy': ' This trendy style keeps you fashion-forward.',
        'sporty': ' Perfect for an active and energetic vibe.',
        'casual': ' The casual mood makes this perfect for everyday wear.',
        'formal': ' The formal mood ensures you look polished and professional.',
    }
    
    if mood and mood.lower() in mood_notes:
        base_comment += mood_notes[mood.lower()]
    
    return base_comment

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
        temperature = data.get('temperature', 20)  # Temperature in Celsius
        event_type = data.get('eventType', 'casual')
        wardrobe_items = data.get('wardrobeItems', [])
        
        # Auto-detect season based on temperature
        if temperature >= 20:
            season = 'summer'
        elif temperature < 10:
            season = 'winter'
        else:
            season = 'spring/fall'  # Moderate temperature
        
        if len(wardrobe_items) < 3:
            return jsonify({
                'error': 'Insufficient wardrobe items',
                'recommendations': []
            }), 400
        
        # Categorize wardrobe items
        tops = [item for item in wardrobe_items if item.get('category') == 'top']
        bottoms = [item for item in wardrobe_items if item.get('category') == 'bottom']
        shoes = [item for item in wardrobe_items if item.get('category') == 'shoes']
        outerwear = [item for item in wardrobe_items if item.get('category') == 'outerwear']
        
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
            outerwear_list = []
            if outerwear:
                num_outerwear = np.random.randint(0, min(2, len(outerwear)) + 1)
                outerwear_list = np.random.choice(outerwear, num_outerwear, replace=False).tolist()
            
            outfit = {
                'top': top,
                'bottom': bottom,
                'shoes': shoe,
                'outerwear': outerwear_list,
            }
            
            # Calculate score (pass season for better recommendations)
            score = calculate_outfit_score(outfit, user_preferences, weather, event_type, season)
            
            # Generate comment (pass mood and season from user preferences)
            comment = generate_stylist_comment(outfit, event_type, weather, user_preferences.get('mood'), season)
            
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

