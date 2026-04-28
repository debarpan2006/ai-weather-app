# 🌤️ SKY Mitra: AI Weather Pattern Data Explorer

**SKY Mitra** is a next-generation, AI-powered Progressive Web App (PWA) designed for deep weather analysis and climate tracking. Built specifically as a high-tier **DBMS Project**, it combines real-time weather forecasting with advanced database engineering concepts like SQL Triggers, Views, and Auditing.

🚀 **Live Demo:** [https://ai-weather-app-tan-alpha.vercel.app/](https://ai-weather-app-tan-alpha.vercel.app/)

---

## 🌟 Key Features

- **🤖 AI Chat (NVIDIA Llama 3.1):** A "Hinglish" capable AI assistant that analyzes weather trends and provides natural language insights.
- **📊 SQL Analytics Dashboard:** Real-time data visualization using **Chart.js**, pulling directly from complex SQL Views.
- **🛡️ Database Auditing:** Every data entry is tracked by a **MySQL Trigger** and logged into an audit trail for security and integrity.
- **📱 PWA Ready:** Install it on your mobile device for a native-like weather experience.
- **🗺️ Geo-Location Support:** Automatically detects your current location to fetch live local weather.

---

## 🏗️ Technical Architecture

### **Frontend**
- **Vanilla JS & CSS3:** Premium glassmorphic UI with dynamic theme switching (Day/Night).
- **Chart.js:** For high-performance data visualization.
- **FontAwesome:** Rich iconography.

### **Backend**
- **Flask (Python):** Robust REST API handling weather data and AI integration.
- **NVIDIA AI Integration:** Utilizes the Llama 3.1 model for intelligent climate conversations.
- **OpenWeather API:** Real-time data source for global weather conditions.

### **Database (The DBMS Core)**
- **Aiven Cloud MySQL:** A high-availability cloud database.
- **SQL Views:** `city_climate_trends` view handles complex multi-table aggregations.
- **SQL Triggers:** `after_weather_insert` trigger automates data auditing.
- **Schema:** 5+ Normalized tables (`location`, `weather_station`, `weather_data`, `climate_category`, `weather_audit`).

---

## 🛠️ Setup & Installation

### **1. Prerequisites**
- Python 3.9+
- A MySQL Instance (Local or Aiven Cloud)

### **2. Local Installation**
```bash
# Clone the repository
git clone https://github.com/debarpan2006/ai-weather-app.git

# Install dependencies
pip install -r requirements.txt

# Set up your .env file
# Add your MYSQL_HOST, USER, PASSWORD, NVIDIA_API_KEY, and OPENWEATHER_API_KEY

# Run the app
python app.py
```

### **3. Deployment (Vercel)**
The app is configured for Vercel using `vercel.json`. Ensure your environment variables are set in the Vercel Dashboard.

---

## 🎓 Academic Specialization (DBMS)
This project was built to demonstrate proficiency in:
1. **Database Normalization:** Structured to avoid redundancy.
2. **Active Databases:** Implementation of **Triggers** for automated logging.
3. **Complex Querying:** Using **Views** to simplify analytical data retrieval.
4. **Data Integrity:** Enforcing Foreign Key constraints and audit trails.

---

## 👨‍💻 Developed By
**Debarpan Chaudhuri**  
*2nd Year Student, SRM Institute of Science and Technology*

---

*Note: This project was built as a part of the DBMS course curriculum to showcase the integration of AI with relational database management systems.*
