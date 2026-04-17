import argparse
import csv
import json
import os
from datetime import datetime

import mysql.connector

HEADER_ALIASES = {
    "city_name": ["city", "city_name", "location", "district"],
    "state_name": ["state", "state_name", "region"],
    "record_date": ["date", "record_date", "forecast_date", "day"],
    "record_time": ["time", "record_time", "timestamp_time"],
    "uv_index": ["uv_index", "uv", "uvi", "ultraviolet_index"],
    "uv_value": ["uv_value", "uv_radiation", "uv_raw"],
    "temperature_c": ["temperature", "temperature_c", "temp", "temp_c"],
    "humidity_percent": ["humidity", "humidity_percent", "relative_humidity"],
    "cloud_cover_percent": ["cloud_cover", "cloud_cover_percent", "clouds"],
    "latitude": ["latitude", "lat"],
    "longitude": ["longitude", "lon", "lng"],
}


def normalize_header(value: str) -> str:
    return value.strip().lower().replace(" ", "_")


def find_column(headers: list[str], field_name: str) -> str | None:
    aliases = HEADER_ALIASES.get(field_name, [])
    for alias in aliases:
        if alias in headers:
            return alias
    return None


def parse_date(value: str):
    if not value:
        return None

    value = value.strip()
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%m/%d/%Y", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(value, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def parse_time(value: str):
    if not value:
        return None

    value = value.strip()
    for fmt in ("%H:%M:%S", "%H:%M", "%I:%M %p", "%I:%M:%S %p"):
        try:
            return datetime.strptime(value, fmt).strftime("%H:%M:%S")
        except ValueError:
            continue
    return None


def parse_decimal(value: str):
    if value is None:
        return None

    value = str(value).strip()
    if value == "":
        return None

    try:
        return float(value)
    except ValueError:
        return None


def open_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "uvision_db"),
    )


def import_csv(csv_path: str, truncate_first: bool = False):
    with open(csv_path, "r", encoding="utf-8-sig", newline="") as file_handle:
        reader = csv.DictReader(file_handle)
        original_headers = reader.fieldnames or []
        normalized_header_map = {normalize_header(header): header for header in original_headers}
        normalized_headers = list(normalized_header_map.keys())

        connection = open_connection()
        cursor = connection.cursor()

        if truncate_first:
            cursor.execute("TRUNCATE TABLE india_uv_reference_data")

        inserted = 0
        source_file = os.path.basename(csv_path)
        city_column = find_column(normalized_headers, "city_name")
        state_column = find_column(normalized_headers, "state_name")
        date_column = find_column(normalized_headers, "record_date")
        time_column = find_column(normalized_headers, "record_time")
        uv_index_column = find_column(normalized_headers, "uv_index")
        uv_value_column = find_column(normalized_headers, "uv_value")
        temperature_column = find_column(normalized_headers, "temperature_c")
        humidity_column = find_column(normalized_headers, "humidity_percent")
        cloud_column = find_column(normalized_headers, "cloud_cover_percent")
        latitude_column = find_column(normalized_headers, "latitude")
        longitude_column = find_column(normalized_headers, "longitude")

        for row in reader:
            normalized_row = {normalize_header(key): value for key, value in row.items()}

            record_date = parse_date(normalized_row.get(date_column))
            record_time = parse_time(normalized_row.get(time_column))
            hour_of_day = int(record_time[:2]) if record_time else None

            cursor.execute(
                """
                INSERT INTO india_uv_reference_data (
                    source_file, country, state_name, city_name, record_date, record_time, hour_of_day,
                    uv_index, uv_value, temperature_c, humidity_percent, cloud_cover_percent,
                    latitude, longitude, raw_row_json
                )
                VALUES (%s, 'India', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    source_file,
                    normalized_row.get(state_column) if state_column else None,
                    normalized_row.get(city_column) if city_column else None,
                    record_date,
                    record_time,
                    hour_of_day,
                    parse_decimal(normalized_row.get(uv_index_column)) if uv_index_column else None,
                    parse_decimal(normalized_row.get(uv_value_column)) if uv_value_column else None,
                    parse_decimal(normalized_row.get(temperature_column)) if temperature_column else None,
                    parse_decimal(normalized_row.get(humidity_column)) if humidity_column else None,
                    parse_decimal(normalized_row.get(cloud_column)) if cloud_column else None,
                    parse_decimal(normalized_row.get(latitude_column)) if latitude_column else None,
                    parse_decimal(normalized_row.get(longitude_column)) if longitude_column else None,
                    json.dumps(row, ensure_ascii=False),
                ),
            )
            inserted += 1

        connection.commit()
        cursor.close()
        connection.close()
        print(f"Imported {inserted} rows from {csv_path} into india_uv_reference_data")


def main():
    parser = argparse.ArgumentParser(description="Import an India UV/weather CSV into MySQL.")
    parser.add_argument("csv_path", help="Path to the CSV file")
    parser.add_argument("--truncate-first", action="store_true", help="Clear existing imported rows first")
    args = parser.parse_args()

    import_csv(args.csv_path, truncate_first=args.truncate_first)


if __name__ == "__main__":
    main()
