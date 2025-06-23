from flask import Flask, jsonify, request, send_from_directory
import json
import os
from datetime import datetime
from zoneinfo import ZoneInfo
import bcrypt

app = Flask(__name__, static_folder="static")

DATA_FILE = "data.json"
PASSWORD_HASHED = bcrypt.hashpw("IreVypadek".encode("utf-8"), bcrypt.gensalt())

@app.route("/")
def root():
    return send_from_directory("static", "index.html")

@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory("static", path)

@app.route("/admin_login", methods=["POST"])
def admin_login():
    data = request.get_json()
    if bcrypt.checkpw(data.get("password", "").encode("utf-8"), PASSWORD_HASHED):
        return jsonify({"success": True})
    return jsonify({"success": False}), 403

@app.route("/status")
def get_status():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return jsonify({
        "status": data.get("status", "OK"),
        "note": data.get("note", ""),
        "time": data.get("time", datetime.now().isoformat()),
        "notes": data.get("notes", [])
    })

@app.route("/status", methods=["POST"])
def update_status():
    data = request.get_json()
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        current = json.load(f)

    # Lokální čas pro Česko
    prague_now = datetime.now(ZoneInfo("Europe/Prague"))

    new_status = data.get("status", "OK")
    note_text = data.get("note", "").strip()

    if new_status != current.get("status"):
        current["notes"] = []

    current["status"] = new_status
    current["time"] = prague_now.strftime("%H:%M")

    if new_status == "VÝPADEK":
        if note_text:
            timestamp = prague_now.strftime("%d.%m.%Y %H:%M")
            current.setdefault("notes", []).append({"time": timestamp, "text": note_text})
        current["note"] = ""
    elif new_status == "OMEZENÍ":
        current["note"] = note_text
    else:
        current["note"] = ""

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(current, f, ensure_ascii=False, indent=2)

    return jsonify({"success": True})

@app.route("/delete_note", methods=["POST"])
def delete_note():
    index = request.get_json().get("index")
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    try:
        data["notes"].pop(index)
    except (IndexError, KeyError):
        return jsonify({"success": False, "error": "Invalid index"}), 400
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return jsonify({"success": True})

if __name__ == "__main__":
    app.run(debug=True)
