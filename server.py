from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

leaderboard = []

@app.route('/submit', methods=['POST'])
def submit_score():
    data = request.json
    name = data.get('name')
    score = data.get('score')
    leaderboard.append({'name': name, 'score': score})
    return jsonify({'message': 'Score submitted!'})

@app.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    sorted_board = sorted(leaderboard, key=lambda x: x['score'], reverse=True)
    return jsonify(sorted_board)

if __name__ == '__main__':
    app.run(port=5000) 