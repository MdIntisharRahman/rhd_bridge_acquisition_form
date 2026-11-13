import csv
import json
import os

csv_path = r"D:\System 47\acqform\sources\rhd_road_name_catalog_code.csv"
network_path = r"D:\System 47\acqform\sources\rhd_road_network_catalog.csv"
seed_path = r"D:\System 47\acqform\rhd_master_hierarchy_seed.json"
backend_seed_path = r"D:\System 47\acqform\backend\rhd_master_hierarchy_seed.json"
extracted_json_path = r"D:\System 47\acqform\backend\rhd_roads_network_extracted.json"

if not os.path.exists(csv_path):
    print(f"ERROR: CSV file not found at {csv_path}")
    exit(1)

with open(csv_path, "r", encoding="utf-8-sig") as f:
    rows = list(csv.DictReader(f))

old_lengths = {}
if os.path.exists(network_path):
    try:
        with open(network_path, "r", encoding="utf-8-sig") as f:
            for r in csv.DictReader(f):
                norm = r["Road_Code"].replace("-", "").upper()
                try:
                    old_lengths[norm] = float(r.get("Length_KM") or 0.0)
                except Exception:
                    old_lengths[norm] = 0.0
    except Exception as e:
        print("Notice reading network catalog lengths:", e)

seed_roads = []
seen_codes = set()
for r in rows:
    code = (r.get("Road_Code") or "").strip()
    if not code or code in seen_codes:
        continue
    seen_codes.add(code)
    norm = code.replace("-", "").upper()
    seed_roads.append({
        "road_type_code": (r.get("Road_Type_Code") or "").strip().upper(),
        "road_number": code,
        "road_name": (r.get("Road_Name") or "").strip(),
        "division_name": (r.get("Division") or "").strip(),
        "length_km": old_lengths.get(norm, 0.0)
    })

print(f"Total deduplicated roads from CSV: {len(seed_roads)}")

# Update extracted json
with open(extracted_json_path, "w", encoding="utf-8") as f:
    json.dump(seed_roads, f, indent=2, ensure_ascii=False)
print(f"Updated {extracted_json_path}")

# Update seed files
for sp in [seed_path, backend_seed_path]:
    if os.path.exists(sp):
        with open(sp, "r", encoding="utf-8") as f:
            s_data = json.load(f)
        s_data["roads"] = seed_roads
        with open(sp, "w", encoding="utf-8") as f:
            json.dump(s_data, f, indent=2, ensure_ascii=False)
        print(f"Updated {sp} with {len(seed_roads)} roads.")
