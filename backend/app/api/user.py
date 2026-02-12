"""User management API routes"""
import os
import uuid
from datetime import datetime
from io import BytesIO
from PIL import Image
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from marshmallow import ValidationError

from app.extensions import db
from app.models.user import User
from app.utils.decorators import login_required
from app.services.log_service import LogService

bp = Blueprint('user', __name__)


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']


def compress_image(image_file, max_size_kb=150):
    """
    Compress image to ensure it's under max_size_kb
    Returns compressed image as BytesIO object
    """
    # Open image
    img = Image.open(image_file)

    # Convert RGBA to RGB if necessary
    if img.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'P':
            img = img.convert('RGBA')
        background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
        img = background

    # Resize if image is too large (max 800x800)
    max_dimension = 800
    if img.width > max_dimension or img.height > max_dimension:
        img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)

    # Compress with quality adjustment
    output = BytesIO()
    quality = 95

    while quality > 20:
        output.seek(0)
        output.truncate()
        img.save(output, format='JPEG', quality=quality, optimize=True)
        size_kb = output.tell() / 1024

        if size_kb <= max_size_kb:
            break

        quality -= 5

    output.seek(0)
    return output


@bp.route('/me', methods=['GET'])
@login_required
def get_my_profile(current_user_id):
    """Get current user profile"""
    try:
        user = db.session.get(User, current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({'user': user.to_dict(include_private=True)}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/me', methods=['PUT'])
@login_required
def update_profile(current_user_id):
    """Update user profile"""
    try:
        user = db.session.get(User, current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.json

        # Update allowed fields
        if 'nickname' in data:
            user.nickname = data['nickname']

        if 'bio' in data:
            user.bio = data['bio']

        if 'phone' in data:
            # Check if phone is already taken by another user
            if data['phone']:
                existing_user = User.query.filter_by(phone=data['phone']).first()
                if existing_user and existing_user.id != current_user_id:
                    return jsonify({'error': 'Phone number already in use'}), 400
            user.phone = data['phone']

        db.session.commit()

        # Log profile update
        fields_updated = list(data.keys())
        LogService.log_profile_update(current_user_id, fields_updated)

        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict(include_private=True)
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/me/password', methods=['PUT'])
@login_required
def change_password(current_user_id):
    """Change user password"""
    try:
        user = db.session.get(User, current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.json

        if not data.get('current_password'):
            return jsonify({'error': 'Current password is required'}), 400

        if not data.get('new_password'):
            return jsonify({'error': 'New password is required'}), 400

        # Verify current password
        if not user.check_password(data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 400

        # Validate new password
        if len(data['new_password']) < 6:
            return jsonify({'error': 'New password must be at least 6 characters'}), 400

        # Set new password
        user.set_password(data['new_password'])
        db.session.commit()

        # Log password change
        LogService.log_password_change(current_user_id)

        return jsonify({'message': 'Password changed successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/me/avatar', methods=['POST'])
@login_required
def upload_avatar(current_user_id):
    """Upload user avatar"""
    try:
        user = db.session.get(User, current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Check if file is in request
        if 'avatar' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['avatar']

        # Check if file is selected
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Check if file is allowed
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed. Only png, jpg, jpeg, gif are allowed'}), 400

        # Compress image
        try:
            compressed_image = compress_image(file, max_size_kb=150)
        except Exception as e:
            return jsonify({'error': f'Image compression failed: {str(e)}'}), 400

        # Generate unique filename using timestamp and UUID (always save as .jpg after compression)
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        unique_id = str(uuid.uuid4())[:8]
        filename = f"avatar_{current_user_id}_{timestamp}_{unique_id}.jpg"

        # Save compressed file
        upload_folder = os.path.join(current_app.root_path, '..', current_app.config['UPLOAD_FOLDER'])
        os.makedirs(upload_folder, exist_ok=True)
        filepath = os.path.join(upload_folder, filename)

        with open(filepath, 'wb') as f:
            f.write(compressed_image.read())

        # Delete old avatar file if exists
        if user.avatar_url:
            old_filename = user.avatar_url.split('/')[-1]
            old_filepath = os.path.join(upload_folder, old_filename)
            if os.path.exists(old_filepath):
                try:
                    os.remove(old_filepath)
                except Exception as e:
                    # Log but don't fail if old file can't be deleted
                    current_app.logger.warning(f"Failed to delete old avatar: {str(e)}")

        # Update user avatar URL
        avatar_url = f"/uploads/{filename}"
        user.avatar_url = avatar_url
        db.session.commit()

        # Log avatar upload
        LogService.log_avatar_upload(current_user_id)

        return jsonify({
            'message': 'Avatar uploaded successfully',
            'avatar_url': avatar_url
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:user_id>', methods=['GET'])
def get_user_profile(user_id):
    """Get user profile by ID"""
    try:
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # 获取关注统计
        from app.models.social import Follow
        followers_count = Follow.query.filter_by(following_id=user_id).count()
        following_count = Follow.query.filter_by(follower_id=user_id).count()

        user_data = user.to_dict()
        user_data['followers_count'] = followers_count
        user_data['following_count'] = following_count

        # Log view user action (if authenticated)
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        try:
            verify_jwt_in_request(optional=True)
            current_user_id = get_jwt_identity()
            if current_user_id and int(current_user_id) != user_id:
                LogService.log_view_user(int(current_user_id), user_id)
        except:
            pass

        return jsonify({'user': user_data}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
