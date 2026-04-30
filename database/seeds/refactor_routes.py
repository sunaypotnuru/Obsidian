#!/usr/bin/env python3
"""
Automated Route File Refactoring Script
Adds schema imports to route files that don't have them yet.
"""

import os
import re
from pathlib import Path

# Get the routes directory
ROUTES_DIR = Path(__file__).parent.parent / "services" / "core" / "app" / "routes"

# Files that already have schema imports (skip these)
ALREADY_FIXED = {
    "gamification.py",
    "timeline.py",
    "notifications_enhanced.py",
    "referrals.py",
    "patient.py",
    "doctor.py",
    "waitlist.py",
    "messages.py",
    "admin.py",
    "__init__.py",
}

def add_schema_import(file_path):
    """Add schema import to a route file if it doesn't have it."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already has schema import
    if 'from app.db.schema import' in content:
        print(f"✓ {file_path.name} - Already has schema import")
        return False
    
    # Check if file uses supabase
    if 'supabase' not in content:
        print(f"⊘ {file_path.name} - Doesn't use supabase, skipping")
        return False
    
    # Find the supabase import line
    supabase_import_pattern = r'(from app\.services\.supabase import supabase.*?\n)'
    match = re.search(supabase_import_pattern, content)
    
    if not match:
        print(f"⚠ {file_path.name} - No supabase import found, skipping")
        return False
    
    # Add schema import after supabase import
    supabase_import = match.group(1)
    new_import = supabase_import + 'from app.db.schema import Tables, Col\n'
    
    new_content = content.replace(supabase_import, new_import)
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"✓ {file_path.name} - Added schema import")
    return True

def main():
    """Process all route files."""
    print("=" * 60)
    print("Route File Refactoring Script")
    print("=" * 60)
    print()
    
    if not ROUTES_DIR.exists():
        print(f"Error: Routes directory not found: {ROUTES_DIR}")
        return
    
    # Get all Python files in routes directory
    route_files = sorted(ROUTES_DIR.glob("*.py"))
    
    modified_count = 0
    skipped_count = 0
    
    for file_path in route_files:
        if file_path.name in ALREADY_FIXED:
            continue
        
        if add_schema_import(file_path):
            modified_count += 1
        else:
            skipped_count += 1
    
    print()
    print("=" * 60)
    print(f"Summary:")
    print(f"  Modified: {modified_count} files")
    print(f"  Skipped: {skipped_count} files")
    print(f"  Already fixed: {len(ALREADY_FIXED)} files")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Review the changes")
    print("2. Replace hardcoded table names with Tables.*")
    print("3. Replace hardcoded column names with Col.*.*")
    print("4. Test each route file")

if __name__ == "__main__":
    main()
