"""Message API endpoints"""
import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_, and_, func
from app.extensions import db, socketio
from app.models.message import Message
from app.models.social import Follow
from app.models.user import User
from app.models.log import UserBehaviorLog

bp = Blueprint('message', __name__)


@bp.route('/messages', methods=['POST'])
@jwt_required()
def send_message():
    """Send a private message"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    receiver_id = data.get('receiver_id')
    content = data.get('content', '').strip()

    if not receiver_id or not content:
        return jsonify({'error': '接收者和消息内容不能为空'}), 400

    if len(content) > 2000:
        return jsonify({'error': '消息内容不能超过2000字符'}), 400

    if receiver_id == current_user_id:
        return jsonify({'error': '不能给自己发送消息'}), 400

    # Check if users are mutually following each other
    mutual_follow = db.session.query(Follow).filter(
        or_(
            and_(Follow.follower_id == current_user_id, Follow.following_id == receiver_id),
            and_(Follow.follower_id == receiver_id, Follow.following_id == current_user_id)
        )
    ).count()

    if mutual_follow < 2:
        return jsonify({'error': '只能给互相关注的好友发送私信'}), 403

    # Create message
    message = Message(
        sender_id=current_user_id,
        receiver_id=receiver_id,
        content=content
    )

    db.session.add(message)
    db.session.commit()

    # Check if this is a song share and log the behavior
    try:
        content_data = json.loads(content)
        if content_data.get('type') == 'song_share' and content_data.get('song'):
            song_id = content_data['song'].get('id')
            if song_id:
                # Log share behavior
                share_log = UserBehaviorLog(
                    user_id=current_user_id,
                    action_type='share',
                    song_id=song_id,
                    extra_data={
                        'shared_to_user_id': receiver_id,
                        'share_method': 'private_message'
                    },
                    ip_address=request.remote_addr,
                    user_agent=request.headers.get('User-Agent')
                )
                db.session.add(share_log)
                db.session.commit()
    except (json.JSONDecodeError, KeyError):
        # Not a song share message, skip logging
        pass

    # Emit WebSocket event to receiver
    message_data = message.to_dict()
    socketio.emit('new_message', message_data, room=f'user_{receiver_id}')

    return jsonify(message_data), 201


@bp.route('/messages/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    """Get conversation list with recent contacts"""
    current_user_id = int(get_jwt_identity())

    # Get all messages involving current user
    messages = db.session.query(Message).filter(
        or_(Message.sender_id == current_user_id, Message.receiver_id == current_user_id)
    ).order_by(Message.created_at.desc()).all()

    # Group by conversation partner
    conversations_dict = {}
    for msg in messages:
        # Determine the other user
        other_user_id = msg.receiver_id if msg.sender_id == current_user_id else msg.sender_id

        # Only keep the most recent message for each conversation
        if other_user_id not in conversations_dict:
            conversations_dict[other_user_id] = msg

    # Build conversation list
    conversations = []
    for other_user_id, last_message in conversations_dict.items():
        # Get unread count
        unread_count = db.session.query(Message).filter(
            Message.sender_id == other_user_id,
            Message.receiver_id == current_user_id,
            Message.is_read == False
        ).count()

        # Get other user info
        other_user = db.session.query(User).get(other_user_id)

        if other_user:
            conversations.append({
                'user': other_user.to_dict(),
                'last_message': {
                    'content': last_message.content,
                    'created_at': last_message.created_at.isoformat(),
                    'is_from_me': last_message.sender_id == current_user_id
                },
                'unread_count': unread_count
            })

    # Sort by last message time
    conversations.sort(key=lambda x: x['last_message']['created_at'], reverse=True)

    return jsonify(conversations), 200


@bp.route('/messages/conversation/<int:user_id>', methods=['GET'])
@jwt_required()
def get_conversation(user_id):
    """Get conversation history with a specific user"""
    current_user_id = int(get_jwt_identity())

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    # Get messages between current user and specified user
    messages_query = db.session.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user_id, Message.receiver_id == user_id),
            and_(Message.sender_id == user_id, Message.receiver_id == current_user_id)
        )
    ).order_by(Message.created_at.desc())

    # Paginate
    pagination = messages_query.paginate(page=page, per_page=per_page, error_out=False)
    messages = [msg.to_dict() for msg in pagination.items]

    return jsonify({
        'messages': messages,
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'has_next': pagination.has_next
    }), 200


@bp.route('/messages/<int:message_id>/read', methods=['PUT'])
@jwt_required()
def mark_message_as_read(message_id):
    """Mark a message as read"""
    current_user_id = int(get_jwt_identity())

    message = db.session.query(Message).get(message_id)
    if not message:
        return jsonify({'error': '消息不存在'}), 404

    if message.receiver_id != current_user_id:
        return jsonify({'error': '无权操作此消息'}), 403

    message.is_read = True
    db.session.commit()

    return jsonify({'message': '已标记为已读'}), 200


@bp.route('/messages/conversation/<int:user_id>/read', methods=['PUT'])
@jwt_required()
def mark_conversation_as_read(user_id):
    """Mark all messages from a user as read"""
    current_user_id = int(get_jwt_identity())

    db.session.query(Message).filter(
        Message.sender_id == user_id,
        Message.receiver_id == current_user_id,
        Message.is_read == False
    ).update({'is_read': True})

    db.session.commit()

    return jsonify({'message': '已标记所有消息为已读'}), 200


@bp.route('/messages/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get unread message count"""
    current_user_id = int(get_jwt_identity())

    count = db.session.query(Message).filter(
        Message.receiver_id == current_user_id,
        Message.is_read == False
    ).count()

    return jsonify({'count': count}), 200


@bp.route('/messages/<int:message_id>', methods=['DELETE'])
@jwt_required()
def delete_message(message_id):
    """Delete a message"""
    current_user_id = int(get_jwt_identity())

    message = db.session.query(Message).get(message_id)
    if not message:
        return jsonify({'error': '消息不存在'}), 404

    if message.sender_id != current_user_id and message.receiver_id != current_user_id:
        return jsonify({'error': '无权删除此消息'}), 403

    db.session.delete(message)
    db.session.commit()

    return jsonify({'message': '消息已删除'}), 200
