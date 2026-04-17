# India CSV Data

Place your India UV or weather CSV file in this project and import it into MySQL using:

```powershell
python python/data/import_india_uv_csv.py "path\\to\\your_file.csv" --truncate-first
```

The importer stores rows in:

- `india_uv_reference_data`

Then prepare an ML-friendly CSV using:

```powershell
python python/ml/export_india_uv_training_data.py
```

This exports:

- `python/ml/india_uv_training_ready.csv`
