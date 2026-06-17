import os
import json

# Paths setup
JSON_PATH = "data/papers.json"
UPLOADS_DIR = "uploads"

# 1. Purana data load karo (agar file nahi hai toh khali list banao)
if os.path.exists(JSON_PATH):
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        try:
            database = json.load(f)
        except json.JSONDecodeError:
            database = []
else:
    database = []

# Pehle se database mein jo files hain unki list banao taaki double entry na ho
existing_pdfs = {item["pdf"] for item in database}

# 2. Uploads folder scan karo
new_papers_added = 0
if not os.path.exists(UPLOADS_DIR):
    os.makedirs(UPLOADS_DIR)

for file in os.listdir(UPLOADS_DIR):
    if file.endswith(".pdf"):
        pdf_path = f"{UPLOADS_DIR}/{file}"
        
        # Agar ye PDF pehle se added nahi hai, toh isko jodo
        if pdf_path not in existing_pdfs:
            # File name se title banao (e.g., "bpsc_67.pdf" -> "bpsc 67")
            clean_title = os.path.splitext(file)[0].replace("-", " ").replace("_", " ")
            
            # Exam category pata karo name se
            exam_type = "Other"
            if "bpsc" in clean_title.lower():
                exam_type = "BPSC"
            elif "ssc" in clean_title.lower():
                exam_type = "SSC"
            elif "railway" in clean_title.lower():
                exam_type = "Railway"

            # Keywords auto-generate karo
            keywords = [word.lower() for word in clean_title.split() if len(word) > 1]
            
            # Naya paper object
            new_item = {
                "id": os.path.splitext(file)[0].lower(),
                "title": clean_title,
                "exam": exam_type,
                "year": "2026", # By default current year, baad mein change kar sakte ho
                "keywords": keywords,
                "pdf": pdf_path
            }
            
            database.append(new_item)
            new_papers_added += 1
            print(f"✅ Auto-Added: {clean_title}")

# 3. Agar naye papers mile toh JSON file update karo
if new_papers_added > 0:
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(database, f, indent=2)
    print(f"\n🎉 Total {new_papers_added} naye papers 'data/papers.json' mein jud gaye hain!")
else:
    print("ℹ️ Kuch naya nahi mila. Saare PDFs pehle se added hain.")