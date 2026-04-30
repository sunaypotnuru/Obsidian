# 🌐 Netra AI Translation System - Complete Guide

This directory contains all translation scripts and tools for the Netra AI multi-language system.

## 📁 Directory Structure

```
scripts/translations/
├── README.md                    # This file (complete guide)
├── translate_all.py            # Unified translation script (RECOMMENDED)
├── translate_hindi.py          # Hindi translation
├── translate_marathi.py        # Marathi translation
├── translate_telugu.py         # Telugu translation
├── translate_tamil.py          # Tamil translation
├── run_all_translations.bat    # Windows batch script
├── run_all_translations.sh     # Linux/Mac shell script
└── setup_and_verify.py         # Verification script
```

## ⚡ QUICK START (3 Steps)

### 1. Start LibreTranslate
```bash
cd Netra-Ai
docker-compose up -d libretranslate
```
Wait 30-60 seconds for language models to load.

### 2. Verify Setup
```bash
python scripts/translations/setup_and_verify.py
```

### 3. Translate All Languages
```bash
python scripts/translations/translate_all.py --all
```

Done! All locale files are now translated.

---

## 🔍 WHAT HAPPENS WHEN YOU RUN THE TRANSLATION?

### Command: `python scripts/translations/translate_all.py --all`

**Step-by-Step Process:**

1. **Loads English Source File**
   - Reads: `apps/web/src/locales/en.json`
   - This is the master file with all English text

2. **For Each Target Language (hi, mr, ta, te):**
   
   a. **Loads/Creates Target File**
      - Reads existing: `apps/web/src/locales/{lang}.json`
      - Or creates new file if doesn't exist
   
   b. **Traverses JSON Structure**
      - Recursively goes through all nested objects
      - Example structure:
        ```json
        {
          "common": {
            "welcome": "Welcome",
            "logout": "Logout"
          },
          "patient": {
            "dashboard": {
              "title": "Patient Dashboard"
            }
          }
        }
        ```
   
   c. **Translates Each String**
      - For each text value (e.g., "Welcome")
      - Sends HTTP request to LibreTranslate:
        ```
        POST http://localhost:5000/translate
        {
          "q": "Welcome",
          "source": "en",
          "target": "hi",
          "format": "text"
        }
        ```
      - Receives translation: "स्वागत"
      - Updates the value in target file
   
   d. **Preserves Structure**
      - Keeps same JSON structure as English
      - Only translates the text values
      - Keys remain in English
   
   e. **Saves Translated File**
      - Writes to: `apps/web/src/locales/{lang}.json`
      - With proper UTF-8 encoding
      - Formatted with 2-space indentation

3. **Shows Progress**
   ```
   🌍 Translating to Hindi (hi)
   📖 Loading English source
   🔄 Translating section: common
     Translating: common.welcome
     Translating: common.logout
   ✅ Translated 50 strings in 'common'
   
   🔄 Translating section: patient
     Translating: patient.dashboard.title
   ✅ Translated 120 strings in 'patient'
   
   💾 Saving to: apps/web/src/locales/hi.json
   ✅ Successfully translated 170 strings to Hindi
   ```

4. **Result**
   - All locale files updated with translations
   - Frontend can now display UI in all languages
   - Users can switch languages via language switcher

### What Gets Translated?

**YES - These get translated:**
- Button labels: "Submit", "Cancel", "Save"
- Page titles: "Patient Dashboard", "Appointments"
- Messages: "Welcome back!", "Appointment booked successfully"
- Form labels: "Name", "Email", "Phone Number"
- Error messages: "Invalid email", "Required field"

**NO - These stay in English:**
- JSON keys: `"dashboard"`, `"title"`, `"welcome"`
- Variable names: `{{name}}`, `{{date}}`
- URLs and routes
- API endpoints
- Code identifiers

### Example Translation

**Before (en.json):**
```json
{
  "patient": {
    "dashboard": {
      "title": "Patient Dashboard",
      "greeting": "Welcome back, {{name}}!",
      "appointments": "Your Appointments"
    }
  }
}
```

**After (hi.json):**
```json
{
  "patient": {
    "dashboard": {
      "title": "रोगी डैशबोर्ड",
      "greeting": "वापसी पर स्वागत है, {{name}}!",
      "appointments": "आपकी नियुक्तियाँ"
    }
  }
}
```

**Note:** `{{name}}` variable stays unchanged - it's replaced at runtime.

---

## 📊 COMPLETE LIST OF UPDATES PERFORMED

### 1. Docker Configuration ✅
**File:** `docker-compose.yml`

**What Changed:**
- Added Indian languages to LibreTranslate service
- Before: Only loaded `en,hi,ar,de,es,fr,it,ja,ko,pt,ru,zh`
- After: Now loads `en,hi,mr,ta,te,bn,gu,kn,ml,pa,ur,ar,de,es,fr,it,ja,ko,pt,ru,zh`
- Added `LT_THREADS=4` for better performance

**Impact:** LibreTranslate can now translate to/from Marathi, Tamil, Telugu, Bengali, Gujarati, Kannada, Malayalam, Punjabi, Urdu

### 2. Backend Translation Service ✅
**File:** `services/core/app/services/translation.py`

**What Changed:**
- Updated `SUPPORTED_LANGUAGES` dictionary
- Added: `"mr": "mr"`, `"ta": "ta"`, `"te": "te"`, `"bn": "bn"`, `"gu": "gu"`, `"kn": "kn"`, `"ml": "ml"`, `"pa": "pa"`, `"ur": "ur"`
- Removed fallback mappings for Tamil, Telugu, Marathi (now directly supported)
- Updated `LANGUAGE_FALLBACKS` to only include truly unsupported languages

**Impact:** Backend API can now translate dynamic content to all Indian languages without fallbacks

### 3. Frontend Language Switcher ✅
**File:** `apps/web/src/app/components/LanguageSwitcher.tsx`

**What Changed:**
- Updated language array to show all as fully supported
- Changed `hasTranslation: false` to `hasTranslation: true` for mr, ta, te
- Removed fallback indicators ("via Hindi")
- All languages now show green checkmark icon

**Impact:** Users see all languages as fully supported in the dropdown

### 4. Frontend i18n Configuration ✅
**File:** `apps/web/src/lib/i18n.ts`

**Status:** Already correctly configured
- Imports: en, hi, mr, ta, te, kn locale files
- Resources configured for all 6 languages
- Language detection working
- Persistence to localStorage and Supabase

**No changes needed** - already perfect!

### 5. Translation Scripts Created ✅
**New Files:**
- `scripts/translations/translate_all.py` (unified tool)
- `scripts/translations/translate_hindi.py`
- `scripts/translations/translate_marathi.py`
- `scripts/translations/translate_telugu.py`
- `scripts/translations/translate_tamil.py`
- `scripts/translations/run_all_translations.bat`
- `scripts/translations/run_all_translations.sh`
- `scripts/translations/setup_and_verify.py`

**Impact:** Easy translation of locale files with one command

### 6. Old Files Removed ✅
**Deleted:**
- `Netra-Ai/translate_mr.py` (moved to organized location)
- `scripts/translations/IMPLEMENTATION_COMPLETE.md` (redundant)
- `scripts/translations/MIGRATION_SUMMARY.md` (redundant)
- `scripts/translations/SETUP_GUIDE.md` (merged into README)
- `scripts/translations/QUICK_START.md` (merged into README)

**Impact:** Cleaner project structure, single source of truth

---

## 📚 DOCUMENTS TO ANALYZE FOR UPDATES

### 1. Docker Configuration
**File:** `docker-compose.yml`
**Section:** `libretranslate` service
**What to check:**
```yaml
libretranslate:
  command: --load-only en,hi,mr,ta,te,bn,gu,kn,ml,pa,ur,...
  environment:
    - LT_LOAD_ONLY=en,hi,mr,ta,te,bn,gu,kn,ml,pa,ur,...
```

### 2. Backend Translation Service
**File:** `services/core/app/services/translation.py`
**What to check:**
- `SUPPORTED_LANGUAGES` dictionary (lines 13-35)
- `LANGUAGE_FALLBACKS` dictionary (lines 37-41)
- Should have all Indian languages listed

### 3. Frontend Language Switcher
**File:** `apps/web/src/app/components/LanguageSwitcher.tsx`
**What to check:**
- `languages` array (lines 5-11)
- All should have `hasTranslation: true`
- No fallback indicators

### 4. Frontend i18n Config
**File:** `apps/web/src/lib/i18n.ts`
**What to check:**
- Import statements (lines 4-8)
- Resources object (lines 17-23)
- Should import and configure: en, hi, mr, ta, te

### 5. Locale Files
**Directory:** `apps/web/src/locales/`
**Files to check:**
- `en.json` (source - must exist)
- `hi.json` (Hindi)
- `mr.json` (Marathi)
- `ta.json` (Tamil)
- `te.json` (Telugu)

### 6. Translation Scripts
**Directory:** `scripts/translations/`
**Files to check:**
- `translate_all.py` (main script)
- Individual language scripts
- `setup_and_verify.py` (verification)
- `README.md` (this file)

---

## 🌍 Supported Languages

| Language | Code | Script File |
|----------|------|-------------|
| Hindi | `hi` | `translate_hindi.py` |
| Marathi | `mr` | `translate_marathi.py` |
| Telugu | `te` | `translate_telugu.py` |
| Tamil | `ta` | `translate_tamil.py` |
| Bengali | `bn` | `translate_all.py --lang bn` |
| Gujarati | `gu` | `translate_all.py --lang gu` |
| Kannada | `kn` | `translate_all.py --lang kn` |
| Malayalam | `ml` | `translate_all.py --lang ml` |
| Punjabi | `pa` | `translate_all.py --lang pa` |
| Urdu | `ur` | `translate_all.py --lang ur` |

## 🚀 Quick Start

### Prerequisites

1. **LibreTranslate Server Running**
   ```bash
   docker-compose up libretranslate
   ```
   Server should be accessible at: `http://localhost:5000`

2. **Python 3.7+** installed

### Option 1: Translate All Languages (Recommended)

```bash
# Navigate to project root
cd Netra-Ai

# Run unified translation script
python scripts/translations/translate_all.py --all
```

### Option 2: Translate Specific Language

```bash
# Translate to Hindi
python scripts/translations/translate_all.py --lang hi

# Translate to Marathi
python scripts/translations/translate_all.py --lang mr

# Translate to Telugu
python scripts/translations/translate_all.py --lang te

# Translate to Tamil
python scripts/translations/translate_all.py --lang ta
```

### Option 3: Translate Specific Sections

```bash
# Translate only patient and common sections to Hindi
python scripts/translations/translate_all.py --lang hi --sections patient common

# Translate all sections to all languages
python scripts/translations/translate_all.py --all --sections patient common doctor admin
```

### Option 4: Use Individual Scripts

```bash
# Hindi
python scripts/translations/translate_hindi.py

# Marathi
python scripts/translations/translate_marathi.py

# Telugu
python scripts/translations/translate_telugu.py

# Tamil
python scripts/translations/translate_tamil.py
```

### Option 5: Batch Translation (All at Once)

**Windows:**
```bash
scripts\translations\run_all_translations.bat
```

**Linux/Mac:**
```bash
bash scripts/translations/run_all_translations.sh
```

## 📖 Usage Examples

### Interactive Mode
```bash
python scripts/translations/translate_all.py
```
This will show a menu to select language interactively.

### Translate Everything
```bash
python scripts/translations/translate_all.py --all
```

### Translate Patient Dashboard Only
```bash
python scripts/translations/translate_all.py --lang hi --sections patient common
```

### Translate Multiple Languages
```bash
# Hindi and Marathi
python scripts/translations/translate_all.py --lang hi
python scripts/translations/translate_all.py --lang mr
```

## 🔧 How It Works

1. **Source File**: `apps/web/src/locales/en.json` (English)
2. **Target Files**: `apps/web/src/locales/{lang}.json` (e.g., `hi.json`, `mr.json`)
3. **Translation Service**: LibreTranslate (running on `http://localhost:5000`)
4. **Process**:
   - Reads English JSON file
   - Recursively traverses all nested objects
   - Translates each string value
   - Preserves JSON structure
   - Saves to target language file

## 📝 Locale File Structure

```json
{
  "common": {
    "welcome": "Welcome",
    "logout": "Logout"
  },
  "patient": {
    "dashboard": {
      "title": "Patient Dashboard",
      "greeting": "Hello, {{name}}"
    }
  },
  "doctor": {
    "appointments": {
      "title": "Appointments"
    }
  }
}
```

## ⚙️ Configuration

### Change Translation Server URL

Edit the `TRANSLATE_URL` variable in any script:

```python
TRANSLATE_URL = 'http://localhost:5000/translate'  # Default
# or
TRANSLATE_URL = 'https://your-translate-server.com/translate'
```

### Add New Language

1. Add language to `LANGUAGES` dict in `translate_all.py`:
   ```python
   LANGUAGES = {
       'hi': 'Hindi',
       'mr': 'Marathi',
       # ... existing languages
       'bn': 'Bengali',  # Add new language
   }
   ```

2. Create locale file:
   ```bash
   cp apps/web/src/locales/en.json apps/web/src/locales/bn.json
   ```

3. Run translation:
   ```bash
   python scripts/translations/translate_all.py --lang bn
   ```

## 🐛 Troubleshooting

### LibreTranslate Not Running
```
❌ Error: LibreTranslate server is not running!
```
**Solution**: Start LibreTranslate:
```bash
docker-compose up libretranslate
```

### Translation Timeout
```
⚠️ Translation error: timeout
```
**Solution**: Increase timeout in script or check network connection.

### File Not Found
```
❌ Error: English source file not found
```
**Solution**: Run script from project root directory:
```bash
cd Netra-Ai
python scripts/translations/translate_all.py
```

### Encoding Issues
```
UnicodeDecodeError
```
**Solution**: Ensure files are saved with UTF-8 encoding.

## 📊 Translation Progress

Track translation progress for each language:

| Language | Status | Last Updated | Sections Translated |
|----------|--------|--------------|---------------------|
| Hindi (hi) | ✅ Complete | - | patient, common |
| Marathi (mr) | ✅ Complete | - | patient, common |
| Telugu (te) | ⚠️ Partial | - | patient, common |
| Tamil (ta) | ⚠️ Partial | - | patient, common |
| Bengali (bn) | ❌ Not Started | - | - |
| Gujarati (gu) | ❌ Not Started | - | - |
| Kannada (kn) | ❌ Not Started | - | - |
| Malayalam (ml) | ❌ Not Started | - | - |
| Punjabi (pa) | ❌ Not Started | - | - |
| Urdu (ur) | ❌ Not Started | - | - |

## 🔄 Updating Translations

When English locale file is updated:

1. **Update all languages**:
   ```bash
   python scripts/translations/translate_all.py --all
   ```

2. **Update specific language**:
   ```bash
   python scripts/translations/translate_all.py --lang hi
   ```

3. **Update specific sections**:
   ```bash
   python scripts/translations/translate_all.py --all --sections patient
   ```

## 📚 Best Practices

1. **Always translate from English**: English is the source of truth
2. **Test translations**: Review translated text for accuracy
3. **Use consistent terminology**: Medical terms should be consistent
4. **Backup before translating**: Keep backup of existing translations
5. **Translate in batches**: Translate section by section for large files
6. **Review by native speakers**: Have native speakers review translations

## 🤝 Contributing

To add support for a new language:

1. Check if LibreTranslate supports the language
2. Add language code to `LANGUAGES` dict
3. Create individual translation script (optional)
4. Update this README
5. Test translation
6. Submit pull request

## 📞 Support

For issues or questions:
- Check troubleshooting section above
- Review LibreTranslate documentation
- Contact development team

## 📄 License

Part of Netra AI project. All rights reserved.

---

**Last Updated**: April 7, 2026  
**Maintained By**: Netra AI Development Team
