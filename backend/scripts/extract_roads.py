import json
import re
import os

geo_path = r"D:\System 47\Webmap\Maps\RHD Road Network-Julia-2.geojson"
seed_path = r"D:\System 47\acqform\rhd_master_hierarchy_seed.json"
out_path = r"D:\System 47\acqform\backend\rhd_roads_network_extracted.json"

if not os.path.exists(geo_path):
    print("ERROR: GeoJSON file not found at", geo_path)
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
    div = (props.get("division") or "").strip()
    div = div_corrections.get(div, div)
    
    rmms_len = props.get("rmmsroadlength")
    shape_len = props.get("shape_leng")
    
    if not rd_nr:
        continue

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

    if rd_cat == "National Highway" or rd_nr.startswith("N"):
        road_type_code = "N"
    elif rd_cat == "Regional Highway" or rd_nr.startswith("R"):
        road_type_code = "R"
    elif rd_cat in ("Zilla Highway", "Zilla Road") or rd_nr.startswith("Z"):
        road_type_code = "Z"
    else:
        road_type_code = "O"

    if rd_nr not in roads_map:
        roads_map[rd_nr] = {
            "road_type_code": road_type_code,
            "road_number": rd_nr,
            "road_name": rd_name,
            "division_name": div,
            "length_km": length_km
        }
    else:
        curr = roads_map[rd_nr]
        if len(rd_name) > len(curr["road_name"]):
            curr["road_name"] = rd_name
        if not curr["division_name"] and div:
            curr["division_name"] = div
        if length_km > curr["length_km"]:
            curr["length_km"] = length_km

sorted_roads = [roads_map[k] for k in sorted(roads_map.keys(), key=natural_sort_key)]

# Save extraction
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(sorted_roads, f, indent=2, ensure_ascii=False)

print(f"SUCCESS: Wrote {len(sorted_roads)} extracted roads to {out_path}")

# Update both seed files (root and backend)
for sp in [seed_path, r"D:\System 47\acqform\backend\rhd_master_hierarchy_seed.json"]:
    if os.path.exists(sp):
        with open(sp, "r", encoding="utf-8") as f:
            seed_data = json.load(f)
        seed_data["roads"] = sorted_roads
        with open(sp, "w", encoding="utf-8") as f:
            json.dump(seed_data, f, indent=2, ensure_ascii=False)
        print(f"SUCCESS: Updated {sp} with {len(sorted_roads)} complete official roads.")
