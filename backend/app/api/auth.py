"""Authentication API routes"""
from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models.user import User
from app.schemas.auth import RegisterSchema, LoginSchema
from app.utils.jwt_helper import generate_tokens
from app.services.log_service import LogService

bp = Blueprint('auth', __name__)


@bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        # Validate request data
        schema = RegisterSchema()
        data = schema.load(request.json)

        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400

        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already taken'}), 400

        if data.get('phone'):
            if User.query.filter_by(phone=data['phone']).first():
                return jsonify({'error': 'Phone number already registered'}), 400

        # Create new user
        user = User(
            username=data['username'],
            email=data['email'],
            phone=data.get('phone'),
            nickname=data.get('nickname')
        )
        user.set_password(data['password'])

        db.session.add(user)
        db.session.commit()

        # Generate tokens
        tokens = generate_tokens(user.id)

        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict(include_private=True),
            **tokens
        }), 201

    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'User already exists'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/login', methods=['POST'])
def login():
    """User login"""
    try:
        # Validate request data
        schema = LoginSchema()
        data = schema.load(request.json)

        # Find user by email or username
        identifier = data['identifier']
        user = User.query.filter(
            (User.email == identifier) | (User.username == identifier)
        ).first()

        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401

        # Generate tokens
        tokens = generate_tokens(user.id)

        # Log login
        LogService.log_login(user.id)

        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(include_private=True),
            **tokens
        }), 200

    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """User logout"""
    # Log logout
    current_user_id = get_jwt_identity()
    LogService.log_logout(int(current_user_id))

    # In a production environment, you would typically add the token to a blacklist
    # For now, we'll just return a success message
    # The client should remove the token from storage
    return jsonify({'message': 'Logout successful'}), 200


@bp.route('/refresh-token', methods=['POST'])
@jwt_required(refresh=True)
def refresh_token():
    """Refresh access token using refresh token"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Generate new tokens
        tokens = generate_tokens(user.id)

        return jsonify({
            'message': 'Token refreshed successfully',
            **tokens
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({'user': user.to_dict(include_private=True)}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
