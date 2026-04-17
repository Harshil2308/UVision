import pandas as pd
import mysql.connector
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error
import joblib

# Connect DB
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Harshil@1375",
    database="uvision_db"
)

# Load data
df = pd.read_sql("SELECT * FROM indianweatherrepository", conn)

# Features & Target
features = [
    "temperature_celsius",
    "humidity",
    "wind_kph",
    "pressure_mb",
    "cloud",
    "feels_like_celsius",
    "visibility_km"
]

target = "uv_index"

# Clean data
df = df.dropna(subset=features + [target])

X = df[features]
y = df[target]

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Model
model = RandomForestRegressor(
    n_estimators=150,
    max_depth=10,
    random_state=42
)

model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)

print("R2 Score:", r2_score(y_test, y_pred))
print("MAE:", mean_absolute_error(y_test, y_pred))

# Save
joblib.dump(model, "uv_model.pkl")

print("✅ Model trained & saved")