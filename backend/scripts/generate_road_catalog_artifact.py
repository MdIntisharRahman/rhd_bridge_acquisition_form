import json
import os

roads_path = r"D:\System 47\acqform\backend\rhd_roads_network_extracted.json"
artifact_dir = r"C:\Users\intis\.gemini\antigravity-cli\brain\b8c3ff2a-407b-4281-8c06-31b17729c3a0"
os.makedirs(artifact_dir, exist_ok=True)
artifact_path = os.path.join(artifact_dir, "rhd_road_network_catalog.md")

with open(roads_path, "r", encoding="utf-8") as f:
    roads = json.load(f)

lines = [
    "# RHD Official Road Network Catalog (968 Roads)\n",
    "> **Source**: `D:\\System 47\\Webmap\\Maps\\RHD Road Network-Julia-2.geojson`  ",
    "> **Target System**: ADDS Acquisition & Demand Placement System  ",
    f"> **Total Extracted Roads**: {len(roads)} official highways and feeder routes.\n",
    "## Network Summary\n",
    "| Classification | Prefix | Road Count | Example Codes |",
    "| :--- | :---: | :---: | :--- |",
    "| **National Highways** | `N` | 116 | N1, N2, N3, N5, N8 |",
    "| **Regional Highways** | `R` | 153 | R110, R140, R220, R360 |",
    "| **Zilla Roads** | `Z` | 698 | Z1001, Z1415, Z8001 |",
    "| **Other Designated Roads** | `O` | 1 | BBA Road |",
    f"| **Total** | - | **{len(roads)}** | - |\n",
]

cats = [
    ("N", "National Highways", "116 roads"),
    ("R", "Regional Highways", "153 roads"),
    ("Z", "Zilla Roads", "698 roads"),
    ("O", "Other Roads", "1 road")
]

for cat_code, cat_name, cat_count in cats:
    cat_roads = [r for r in roads if r.get("road_type_code") == cat_code]
    lines.append(f"## {cat_name} ({cat_count})\n")
    lines.append("| Road Code | Official Road Name | Division | Length (km) |")
    lines.append("| :--- | :--- | :--- | :---: |")
    for r in cat_roads:
        code = r.get("road_number", "")
        name = r.get("road_name", "").replace("|", "-")
        div = r.get("division_name", "") or "-"
        length = r.get("length_km", 0.0)
        lines.append(f"| **{code}** | {name} | {div} | {length} |")
    lines.append("\n")

with open(artifact_path, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print(f"SUCCESS: Wrote {len(roads)} roads catalog to {artifact_path}")
