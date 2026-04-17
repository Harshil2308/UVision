import argparse
import csv
import os
from datetime import datetime

import mysql.connector


def open_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "uvision_db"),
    )


def derive_season(month: int) -> str:
    if month in (3, 4, 5, 6):
        return "summer"
    if month in (7, 8, 9):
        return "monsoon"
    if month in (10, 11):
        return "post_monsoon"
    return "winter"


def export_training_csv(output_path: str):
    connection = open_connection()
    cursor = connection.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT city_name, state_name, record_date, hour_of_day, uv_index,
               temperature_c, humidity_percent, cloud_cover_percent,
               latitude, longitude
        FROM india_uv_reference_data
        WHERE uv_index IS NOT NULL AND record_date IS NOT NULL
        ORDER BY record_date ASC, hour_of_day ASC
        """
    )

    rows = cursor.fetchall()
    cursor.close()
    connection.close()

    with open(output_path, "w", encoding="utf-8", newline="") as file_handle:
        writer = csv.writer(file_handle)
        writer.writerow([
            "city_name",
            "state_name",
            "record_date",
            "month",
            "day_of_week",
            "day_of_year",
            "is_weekend",
            "season",
            "hour_of_day",
            "temperature_c",
            "humidity_percent",
            "cloud_cover_percent",
            "latitude",
            "longitude",
            "uv_index",
        ])

        for row in rows:
            record_date = datetime.strptime(str(row["record_date"]), "%Y-%m-%d")
            writer.writerow([
                row["city_name"],
                row["state_name"],
                row["record_date"],
                record_date.month,
                record_date.weekday(),
                record_date.timetuple().tm_yday,
                1 if record_date.weekday() >= 5 else 0,
                derive_season(record_date.month),
                row["hour_of_day"],
                row["temperature_c"],
                row["humidity_percent"],
                row["cloud_cover_percent"],
                row["latitude"],
                row["longitude"],
                row["uv_index"],
            ])

    print(f"Training-ready CSV exported to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Export India UV reference data into an ML-ready CSV.")
    parser.add_argument(
        "--output",
        default="python/ml/india_uv_training_ready.csv",
        help="Output CSV path"
    )
    args = parser.parse_args()
    export_training_csv(args.output)


if __name__ == "__main__":
    main()
