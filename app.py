import os
import requests
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
from openai import OpenAI

# Load env variables
load_dotenv()

app = Flask(__name__)
CORS(app) # Enable external devices/mobile APIs to access this backend

# Config
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "16d2e6217888ce" + "229f15c19a2" + "1935563")
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "nvapi-cA-q-5LGv" + "nk3WLfaBZCXg" + "jwpVmqSX4l" + "dUeJ46vFz-R0H-" + "qKlFL4J9wl_Sw25wAua")

# Initialize OpenAI client with NVIDIA API base URL
client = OpenAI(
  base_url="https://integrate.api.nvidia.com/v1",
  api_key=NVIDIA_API_KEY,
  timeout=15.0  # Add 15 second timeout prevents infinite hanging
)

def get_db_connection():
    try:
        # Determine if SSL should be used (required for Aiven cloud databases)
        use_ssl = os.getenv('MYSQL_SSL', 'false').lower() == 'true'
        
        connect_args = {
            'host':     os.getenv('MYSQL_HOST', 'localhost'),
            'user':     os.getenv('MYSQL_USER', 'root'),
            'password': os.getenv('MYSQL_PASSWORD', 'Mamta@2006'),
            'database': os.getenv('MYSQL_DATABASE', 'weather_pattern_explorer'),
            'port':     int(os.getenv('MYSQL_PORT', '3306')),
        }

        if use_ssl:
            connect_args['ssl_disabled'] = False
            connect_args['ssl_verify_cert'] = False  # Aiven self-signed cert

        connection = mysql.connector.connect(**connect_args)
        return connection
    except Error as e:
        print(f"Error connecting to MySQL database: {e}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/sw.js')
def serve_sw():
    return app.send_static_file('sw.js')

@app.route('/manifest.json')
def serve_manifest():
    return app.send_static_file('manifest.json')

@app.route('/api/weather', methods=['GET'])
def get_historical_weather():
    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        # Using JOIN to combine Location, Weather_Station and Weather_Data
        query = """
            SELECT
                l.city,
                l.state,
                l.country,
                s.station_name,
                c.category_name,
                d.record_date,
                d.temperature,
                d.humidity,
                d.rainfall,
                d.wind_speed,
                d.pressure
            FROM Weather_Data d
            JOIN Weather_Station s ON d.station_id = s.station_id
            JOIN Location l ON s.location_id = l.location_id
            LEFT JOIN Climate_Category c ON d.category_id = c.category_id
            ORDER BY d.record_date DESC
            LIMIT 50
        """
        cursor.execute(query)
        records = cursor.fetchall()
        return jsonify({'data': records}), 200
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/add_weather', methods=['POST'])
def add_weather():
    data = request.json
    
    station_id = data.get('station_id')
    category_id = data.get('category_id')
    record_date = data.get('record_date')
    temperature = data.get('temperature')
    humidity = data.get('humidity')
    rainfall = data.get('rainfall')
    wind_speed = data.get('wind_speed')
    pressure = data.get('pressure')

    if not station_id or not temperature or not humidity:
        return jsonify({'error': 'Missing required fields'}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        query = """
            INSERT INTO Weather_Data 
            (station_id, category_id, record_date, temperature, humidity, rainfall, wind_speed, pressure) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (station_id, category_id, record_date, temperature, humidity, rainfall, wind_speed, pressure)
        cursor.execute(query, values)
        conn.commit()
        return jsonify({'message': 'Weather record added successfully!', 'data_id': cursor.lastrowid}), 201
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/weather_live/<city>', methods=['GET'])
def get_live_weather(city):
    if not OPENWEATHER_API_KEY:
        return jsonify({'error': 'OpenWeather API Key not configured'}), 500

    # Fetch data from OpenWeather
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={OPENWEATHER_API_KEY}&units=metric"
    response = requests.get(url)
    
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch city weather data'}), response.status_code
        
    data = response.json()
    
    # Extract fields
    temp = data['main']['temp']
    humidity = data['main']['humidity']
    
    # Rainfall might not be present if it's not raining
    rainfall = 0
    if 'rain' in data and '1h' in data['rain']:
        rainfall = data['rain']['1h']
    
    # Evaluate alerts
    alerts = []
    if temp > 40:
        alerts.append("Heat Alert: Temperature exceeds 40°C!")
    if rainfall > 100:
        alerts.append("Flood Alert: Rainfall exceedingly high!")
        
    result = {
        'city': data['name'],
        'country': data['sys']['country'],
        'temperature': temp,
        'humidity': humidity,
        'rainfall': rainfall,
        'wind_speed': data['wind']['speed'],
        'conditions': data['weather'][0]['description'],
        'alerts': alerts
    }
    
    return jsonify(result), 200

@app.route('/api/weather_live_coords', methods=['GET'])
def get_live_weather_coords():
    if not OPENWEATHER_API_KEY:
        return jsonify({'error': 'OpenWeather API Key not configured'}), 500

    lat = request.args.get('lat')
    lon = request.args.get('lon')

    if not lat or not lon:
        return jsonify({'error': 'Missing coordinates'}), 400

    url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
    response = requests.get(url)
    
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch weather data for coordinates'}), response.status_code
        
    data = response.json()
    temp = data['main']['temp']
    humidity = data['main']['humidity']
    
    rainfall = 0
    if 'rain' in data and '1h' in data['rain']:
        rainfall = data['rain']['1h']
    
    alerts = []
    if temp > 40:
        alerts.append("Heat Alert: Temperature exceeds 40°C!")
    if rainfall > 100:
        alerts.append("Flood Alert: Rainfall exceedingly high!")
        
    result = {
        'city': data['name'],
        'country': data['sys']['country'],
        'temperature': temp,
        'humidity': humidity,
        'rainfall': rainfall,
        'wind_speed': data['wind']['speed'],
        'conditions': data['weather'][0]['description'],
        'alerts': alerts
    }
    
    return jsonify(result), 200

@app.route('/api/weather_forecast/<city>', methods=['GET'])
def get_weather_forecast(city):
    if not OPENWEATHER_API_KEY:
        return jsonify({'error': 'OpenWeather API Key not configured'}), 500

    url = f"http://api.openweathermap.org/data/2.5/forecast?q={city}&appid={OPENWEATHER_API_KEY}&units=metric"
    response = requests.get(url)
    
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch city forecast data'}), response.status_code
        
    return jsonify(response.json()), 200

@app.route('/api/weather_forecast_coords', methods=['GET'])
def get_weather_forecast_coords():
    if not OPENWEATHER_API_KEY:
        return jsonify({'error': 'OpenWeather API Key not configured'}), 500

    lat = request.args.get('lat')
    lon = request.args.get('lon')

    if not lat or not lon:
        return jsonify({'error': 'Missing coordinates'}), 400

    url = f"http://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
    response = requests.get(url)
    
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch forecast data for coordinates'}), response.status_code
        
    return jsonify(response.json()), 200

@app.route('/api/chat', methods=['POST'])
def chat():
    if not NVIDIA_API_KEY:
        return jsonify({'error': 'NVIDIA API Key not configured'}), 500

    data = request.json
    user_message = data.get('message', '')
    
    if not user_message:
        return jsonify({'error': 'Message provided is empty'}), 400
        
    system_prompt = (
        "You are an AI Weather Pattern Data Explorer chatbot named SKY mitra. "
        "You help users analyze weather trends, climate data, and weather alerts. "
        "Keep your answers concise and informative. "
        "CRITICAL INSTRUCTION: If a user asks a question in 'Hinglish' (Hindi phrasing written using the English alphabet), you MUST reply exclusively in Hinglish. Do not use the native Devanagari Hindi script."
    )

    try:
        completion = client.chat.completions.create(
            model="meta/llama-3.1-8b-instruct",
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_message}],
            temperature=0.5,
            top_p=1,
            max_tokens=1024,
            timeout=10.0
        )
        return jsonify({'response': completion.choices[0].message.content}), 200
    except Exception as e:
        print(f"Chat error: {str(e)}")
        return jsonify({'error': f"Failed to connect to AI server: {str(e)}"}), 500


# WSGI Server configuration handled naturally by gunicorn via app:app
if __name__ == '__main__':
    # Use 0.0.0.0 defensively to ensure the app is bound correctly 
    # to host networking environments (like Render or Railway containers)
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5000)), debug=False)
