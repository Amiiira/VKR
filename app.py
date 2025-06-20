from flask import Flask, render_template, send_from_directory, request, jsonify
import os, datetime

app = Flask(__name__,
            static_folder='static',
            template_folder='templates')

# Папка, где будут сохраняться схемы (xml)
SAVE_DIR = os.path.join(app.root_path, 'diagrams')
os.makedirs(SAVE_DIR, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

# ---------- REST API ----------

@app.route('/api/save', methods=['POST'])
def api_save():
    """Сохраняем присланный XML в файл и возвращаем имя."""
    data = request.get_json(force=True)
    xml = data.get('xml')
    name = data.get('name', f'diagram_{datetime.datetime.now().strftime("%Y%m%d_%H%M%S")}.bpmn')
    path = os.path.join(SAVE_DIR, name)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(xml)
    return jsonify({'status': 'ok', 'filename': name})

@app.route('/download/<path:filename>')
def download(filename):
    return send_from_directory(SAVE_DIR, filename, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
