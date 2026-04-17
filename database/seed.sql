USE uvision_db;

INSERT INTO users (name, email, password, age, gender, skin_type, lifestyle, vitamin_d_level)
VALUES
  ('Aarav Sharma', 'aarav@example.com', 'Aarav@123', 24, 'Male', 'Normal', 'Indoor', 24.00),
  ('Neha Gupta', 'neha@example.com', 'Neha@123', 29, 'Female', 'Sensitive', 'Outdoor', 33.50),
  ('Rohan Das', 'rohan@example.com', 'Rohan@123', 31, 'Male', 'Oily', 'Indoor', 18.20);

INSERT INTO weather_uv_data (uv_value, uv_index, recorded_at)
VALUES
  (2.420, 5.90, '2026-04-16 09:36:01'),
  (2.510, 6.20, '2026-04-16 09:36:06'),
  (2.640, 6.50, '2026-04-16 09:36:11'),
  (2.710, 6.80, '2026-04-16 09:36:16'),
  (2.560, 6.10, '2026-04-16 09:36:21');

INSERT INTO exposure_log (user_id, exposure_date, start_time, end_time, duration_minutes, body_area_exposed, sunscreen_used, vitamin_d_generated)
VALUES
  (1, '2026-04-16', '08:40:00', '08:58:00', 18, 'Face + Arms', FALSE, 680.00),
  (1, '2026-04-15', '09:00:00', '09:20:00', 20, 'Arms', TRUE, 510.00),
  (2, '2026-04-16', '08:10:00', '08:28:00', 18, 'Face + Arms', FALSE, 720.00);

INSERT INTO vitamin_d_estimation (user_id, uv_index, exposure_time, estimated_vitamin_d, created_at)
VALUES
  (1, 6.50, 18, 936.00, '2026-04-16 09:40:00'),
  (2, 4.80, 20, 770.00, '2026-04-16 09:41:00'),
  (3, 8.90, 15, 1020.00, '2026-04-16 09:42:00');

INSERT INTO recommendations (user_id, recommended_time_start, recommended_time_end, duration_minutes, expected_vitamin_d, risk_level, created_at)
VALUES
  (1, '08:30:00', '10:00:00', 18, 680.00, 'Moderate', '2026-04-16 09:45:00'),
  (2, '08:00:00', '09:30:00', 20, 770.00, 'Low', '2026-04-16 09:45:00'),
  (3, '07:30:00', '08:15:00', 12, 560.00, 'High', '2026-04-16 09:45:00');

INSERT INTO vitamin_d_lab_results (user_id, test_date, vitamin_d_value, notes)
VALUES
  (1, '2026-01-10', 18.00, 'Initial deficiency assessment'),
  (1, '2026-02-14', 21.00, 'Slight improvement after morning exposure'),
  (1, '2026-03-12', 24.00, 'Continuing progress'),
  (1, '2026-04-16', 28.00, 'Approaching healthy range'),
  (2, '2026-02-05', 30.00, 'Healthy baseline'),
  (2, '2026-04-16', 33.50, 'Stable healthy level'),
  (3, '2026-03-01', 16.50, 'Deficiency noted'),
  (3, '2026-04-16', 18.20, 'Still deficient');
