"""WebSocket event handlers"""
from flask_socketio import emit, join_room, leave_room
from flask_jwt_extended import decode_token
from app.extensions import socketio


@socketio.on('connect')
def handle_connect(auth):
    """Handle client connection"""
    try:
        # Get token from auth
        token = auth.get('token') if auth else None
        if token:
            # Decode JWT to get user ID
            decoded = decode_token(token)
            user_id = decoded['sub']

            # Join user-specific room
            room = f'user_{user_id}'
            join_room(room)
            print(f"User {user_id} connected and joined room {room}")
            emit('connected', {'status': 'success', 'user_id': user_id})
        else:
            print("Connection without token")
            emit('connected', {'status': 'no_auth'})
    except Exception as e:
        print(f"Connection error: {e}")
        emit('error', {'message': 'Authentication failed'})


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print("Client disconnected")


@socketio.on('join')
def handle_join(data):
    """Handle joining a room"""
    try:
        token = data.get('token')
        if token:
            decoded = decode_token(token)
            user_id = decoded['sub']
            room = f'user_{user_id}'
            join_room(room)
            print(f"User {user_id} joined room {room}")
    except Exception as e:
        print(f"Join error: {e}")
