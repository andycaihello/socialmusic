"""JWT helper utilities"""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    verify_jwt_in_request
)


def generate_tokens(user_id):
    """Generate access and refresh tokens for a user"""
    access_token = create_access_token(identity=str(user_id))
    refresh_token = create_refresh_token(identity=str(user_id))
    return {
        'access_token': access_token,
        'refresh_token': refresh_token
    }


def get_current_user_id():
    """Get current user ID from JWT token"""
    return int(get_jwt_identity())
