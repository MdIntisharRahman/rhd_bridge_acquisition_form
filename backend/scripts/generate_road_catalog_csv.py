import json
import csv
import re
import os

geo_path = r"D:\System 47\Webmap\Maps\RHD Road Network-Julia-2.geojson"
csv_out_path = r"D:\System 47\acqform\sources\rhd_road_network_catalog.csv"
seed_path = r"D:\System 47\acqform\rhd_master_hierarchy_seed.json"
backend_seed_path = r"D:\System 47\acqform\backend\rhd_master_hierarchy_seed.json"
extracted_json_path = r"D:\System 47\acqform\backend\rhd_roads_network_extracted.json"

if not os.path.exists(geo_path):
    print(f"ERROR: GeoJSON file not found at {geo_path}")
    exit(1)

with open(geo_path, "r", encoding="utf-8") as f:
    geo_data = json.load(f)

def natural_sort_key(s):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", s)]

div_corrections = {
    "Cumilla": "Comilla",
    "Coxsbazar": "Cox's Bazar",
    "Chattogram South": "Chattogram"
}

roads_map = {}

for feat in geo_data.get("features", []):
    props = feat.get("properties", {})
    rd_nr = (props.get("rd_nr") or "").strip()
    rd_name = (props.get("road_name") or "").strip()
    rd_cat = (props.get("rd_categor") or "").strip()
    
    # OMIT BBA roads from official RHD record per instructions
    if rd_cat == "BBA Road" or rd_nr == "BBA Road" or "BBA" in rd_nr:
        continue

    if not rd_nr:
        continue

    div = (props.get("division") or "").strip()
    div = div_corrections.get(div, div)
    circle = (props.get("circle") or "").strip()
    zone = (props.get("zone") or "").strip()
    start_of_road = (props.get("start_of_road") or "").strip()
    end_of_road = (props.get("end_of_road") or "").strip()
    rmms_link = (props.get("rmms_link") or "").strip()
    road_id_rmms = props.get("road_id_rmms")
    
    rmms_len = props.get("rmmsroadlength")
    shape_len = props.get("shape_leng")
    maxchainag = props.get("maxchainag")
    
    length_km = 0.0
    if rmms_len not in (None, ""):
        try:
            length_km = round(float(rmms_len), 3)
        except Exception:
            pass
    elif shape_len not in (None, ""):
        try:
            length_km = round(float(shape_len) / 1000.0, 3)
        except Exception:
            pass

    max_ch_val = 0.0
    if maxchainag not in (None, ""):
        try:
            max_ch_val = round(float(maxchainag), 3)
        except Exception:
            pass

    # Classify road type strictly
    if rd_cat == "National Highway" or rd_nr.startswith("N"):
        road_type_code = "N"
        road_type_id = 1
        category_name = "National Highway"
    elif rd_cat == "Regional Highway" or rd_nr.startswith("R"):
        road_type_code = "R"
        road_type_id = 2
        category_name = "Regional Highway"
    elif rd_cat in ("Zilla Highway", "Zilla Road") or rd_nr.startswith("Z"):
        road_type_code = "Z"
        road_type_id = 3
        category_name = "Zilla Road"
    else:
        road_type_code = "O"
        road_type_id = 4
        category_name = "Other Road"

    if rd_nr not in roads_map:
        roads_map[rd_nr] = {
            "road_number": rd_nr,
            "road_name": rd_name,
            "road_type_code": road_type_code,
            "road_type_id": road_type_id,
            "category_name": category_name,
            "division_name": div,
            "circle_name": circle,
            "zone_name": zone,
            "start_of_road": start_of_road,
            "end_of_road": end_of_road,
            "length_km": length_km,
            "max_chainage_km": max_ch_val,
            "rmms_road_id": road_id_rmms,
            "rmms_link": rmms_link
        }
    else:
        curr = roads_map[rd_nr]
        if len(rd_name) > len(curr["road_name"]):
            curr["road_name"] = rd_name
        if not curr["division_name"] and div:
            curr["division_name"] = div
        if not curr["circle_name"] and circle:
            curr["circle_name"] = circle
        if not curr["zone_name"] and zone:
            curr["zone_name"] = zone
        if not curr["start_of_road"] and start_of_road:
            curr["start_of_road"] = start_of_road
        if not curr["end_of_road"] and end_of_road:
            curr["end_of_road"] = end_of_road
        if not curr["rmms_link"] and rmms_link:
            curr["rmms_link"] = rmms_link
        if not curr["rmms_road_id"] and road_id_rmms:
            curr["rmms_road_id"] = road_id_rmms
        if length_km > curr["length_km"]:
            curr["length_km"] = length_km
        if max_ch_val > curr["max_chainage_km"]:
            curr["max_chainage_km"] = max_ch_val

sorted_road_keys = sorted(roads_map.keys(), key=natural_sort_key)
sorted_roads = [roads_map[k] for k in sorted_road_keys]

# 1. Write CSV inside sources directory with UTF-8 BOM
os.makedirs(os.path.dirname(csv_out_path), exist_ok=True)
csv_headers = [
    "Road_Code",
    "Road_Name",
    "Road_Type_Code",
    "Road_Category",
    "Division",
    "Circle",
    "Zone",
    "Start_Location",
    "End_Location",
    "Length_KM",
    "Max_Chainage_KM",
    "RMMS_Road_ID",
    "RMMS_Online_Link"
]

with open(csv_out_path, "w", newline="", encoding="utf-8-sig") as csv_file:
    writer = csv.writer(csv_file)
    writer.writerow(csv_headers)
    for r in sorted_roads:
        writer.writerow([
            r["road_number"],
            r["road_name"],
            r["road_type_code"],
            r["category_name"],
            r["division_name"],
            r["circle_name"],
            r["zone_name"],
            r["start_of_road"],
            r["end_of_road"],
            r["length_km"],
            r["max_chainage_km"],
            r["rmms_road_id"],
            r["rmms_link"]
        ])

print(f"SUCCESS: Wrote {len(sorted_roads)} official RHD roads to CSV: {csv_out_path}")

# 2. Update JSON seed files
seed_roads = [
    {
        "road_type_code": r["road_type_code"],
        "road_number": r["road_number"],
        "road_name": r["road_name"],
        "division_name": r["division_name"],
        "length_km": r["length_km"]
    }
    for r in sorted_roads
]

with open(extracted_json_path, "w", encoding="utf-8") as f:
    json.dump(seed_roads, f, indent=2, ensure_ascii=False)

for sp in [seed_path, backend_seed_path]:
    if os.path.exists(sp):
        with open(sp, "r", encoding="utf-8") as f:
            s_data = json.load(f)
        s_data["roads"] = seed_roads
        with open(sp, "w", encoding="utf-8") as f:
            json.dump(s_data, f, indent=2, ensure_ascii=False)
        print(f"SUCCESS: Updated {sp} with {len(seed_roads)} official roads (omitted BBA).")
