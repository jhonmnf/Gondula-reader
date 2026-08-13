from flask import Flask, jsonify, request
import json
import os

app = Flask(__name__)

# Carrega os dados do JSON
DATA_FILE = 'mock_data.json'

def load_data():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

@app.route('/')
def home():
    return jsonify({
        "status": "online",
        "message": "Simulador Alterdata Shop Ativo",
        "endpoint": "/api/product/<codigo>"
    })

@app.route('/api/product/<codigo>', methods=['GET'])
def get_product(codigo):
    products = load_data()
    # Busca o produto pelo código de barras
    product = next((p for p in products if p['codigo'] == codigo), None)

    if product:
        return jsonify({
            "success": True,
            "data": product
        }), 200
    else:
        return jsonify({
            "success": False,
            "message": "Produto não encontrado no Alterdata Shop"
        }), 404

if __name__ == '__main__':
    # O servidor rodará na porta 5000 por padrão
    print("🚀 Simulador Alterdata Shop iniciado!")
    print("URL de teste: http://localhost:5000/api/product/7891234567890")
    app.run(debug=True, host='0.0.0.0', port=5000)
