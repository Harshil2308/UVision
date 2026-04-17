import argparse
import math
import os
import random
import sys
import time
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()

print("DB_USER:", os.getenv("DB_USER"))
print("DB_PASSWORD:", os.getenv("DB_PASSWORD"))

try:
    import serial
except ImportError:
    serial = None

try:
    import mysql.connector
except ImportError:
    mysql = None
else:
    mysql = mysql.connector


def voltage_to_uv_index(voltage: float) -> float:
    return round(max(0.0, (voltage / 3.3) * 11), 2)


def insert_reading(connection, uv_value: float, uv_index: float) -> None:
    try:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO weather_uv_data (uv_value, uv_index, recorded_at) VALUES (%s, %s, NOW())",
            (uv_value, uv_index),
        )
        connection.commit()
        print("Inserted:", uv_value, uv_index)
        cursor.close()
    except Exception as e:
        print(" DB insert Error", e)

def connect_db():
    if mysql is None:
        raise RuntimeError("mysql-connector-python is not installed")

    return mysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "uvision_db"),
    )


def simulate_loop(interval_seconds: int, max_reads: int | None) -> int:
    connection = connect_db()
    count = 0
    try:
        while True:
            uv_value = round(random.uniform(0.0, 3.3), 3)
            uv_index = voltage_to_uv_index(uv_value)
            insert_reading(connection, uv_value, uv_index)
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            print(f"[SIM] {timestamp} uv_value={uv_value} uv_index={uv_index}")
            count += 1
            if max_reads and count >= max_reads:
                break
            time.sleep(interval_seconds)
    finally:
        connection.close()
    return 0


def serial_loop(port: str, baud_rate: int, interval_seconds: int, max_reads: int | None) -> int:
    if serial is None:
        raise RuntimeError("pyserial is not installed")

    connection = connect_db()
    ser = serial.Serial(port, baudrate=baud_rate, timeout=2)
    count = 0
    try:
        while True:
            line = ser.readline().decode("utf-8", errors="ignore").strip()
            if not line:
                continue
            try:
                if "Voltage:" in line:
                    voltage_part = line.split("Voltage:")[1].strip()
                    uv_value = round(float(voltage_part), 3)
                else:
                    continue
            except Exception:
                print(f"[WARN] Skipping invalid sensor value: {line}")
                continue

            uv_index = voltage_to_uv_index(uv_value)
            insert_reading(connection, uv_value, uv_index)
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            print(f"[SERIAL] {timestamp} uv_value={uv_value} uv_index={uv_index}")
            count += 1
            if max_reads and count >= max_reads:
                break
            time.sleep(interval_seconds)
    finally:
        ser.close()
        connection.close()
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Read UV sensor data from Arduino serial and store in MySQL.")
    parser.add_argument("--mode", choices=["simulate", "serial"], default="simulate")
    parser.add_argument("--port", default=os.getenv("UV_SERIAL_PORT", "COM3"))
    parser.add_argument("--baud", type=int, default=int(os.getenv("UV_BAUD_RATE", "9600")))
    parser.add_argument("--interval", type=int, default=int(os.getenv("UV_READ_INTERVAL", "5")))
    parser.add_argument("--max-reads", type=int, default=0)
    args = parser.parse_args()

    max_reads = args.max_reads if args.max_reads > 0 else None

    if args.mode == "serial":
        return serial_loop(args.port, args.baud, args.interval, max_reads)
    return simulate_loop(args.interval, max_reads)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"uv_serial_reader failed: {exc}", file=sys.stderr)
        raise
