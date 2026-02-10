"""Custom decorators"""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models.user import User
from app.extensions import db


def login_required(fn):
    """Decorator to require authentication and inject current_user_id"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current_user_id = int(get_jwt_identity())
        return fn(current_user_id=current_user_id, *args, **kwargs)
    return wrapper


def get_current_user(fn):
    """Decorator to require authentication and inject current_user object"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current_user_id = int(get_jwt_identity())
        current_user = db.session.get(User, current_user_id)
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        return fn(current_user=current_user, *args, **kwargs)
    return wrapper
