import json
import os

def repair_json(obj):
    if isinstance(obj, dict):
        # Check if it's a character-split object
        if all(k.isdigit() for k in obj.keys()) and obj:
            # Sort by keys (as integers) and join
            sorted_keys = sorted(obj.keys(), key=int)
            if all(int(sorted_keys[i]) == i for i in range(len(sorted_keys))):
                return "".join(obj[k] for k in sorted_keys)
        
        # Otherwise recurse
        return {k: repair_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [repair_json(v) for v in obj]
    else:
        return obj

locales_dir = "frontend/src/locales"
for filename in os.listdir(locales_dir):
    if filename.endswith(".json"):
        filepath = os.path.join(locales_dir, filename)
        print(f"Repairing {filename}...")
        with open(filepath, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                repaired_data = repair_json(data)
                with open(filepath, "w", encoding="utf-8") as fw:
                    json.dump(repaired_data, fw, indent=4, ensure_ascii=False)
                print(f"Successfully repaired {filename}")
            except Exception as e:
                print(f"Failed to repair {filename}: {e}")
