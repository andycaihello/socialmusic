"""Social features API routes"""
from flask import Blueprint, jsonify
from app.extensions import db
from app.models.user import User
from app.models.social import Follow
from app.utils.decorators import login_required
from app.services.log_service import LogService

bp = Blueprint('social', __name__)


@bp.route('/follow/<int:user_id>', methods=['POST'])
@login_required
def follow_user(current_user_id, user_id):
    """Follow a user"""
    try:
        # 不能关注自己
        if current_user_id == user_id:
            return jsonify({'error': 'Cannot follow yourself'}), 400

        # 检查用户是否存在
        target_user = db.session.get(User, user_id)
        if not target_user:
            return jsonify({'error': 'User not found'}), 404

        # 检查是否已经关注
        existing_follow = Follow.query.filter_by(
            follower_id=current_user_id,
            following_id=user_id
        ).first()

        if existing_follow:
            return jsonify({'error': 'Already following'}), 400

        # 创建关注关系
        follow = Follow(follower_id=current_user_id, following_id=user_id)
        db.session.add(follow)
        db.session.commit()

        # Log follow action
        LogService.log_follow(current_user_id, user_id)

        return jsonify({
            'message': 'Followed successfully',
            'is_following': True
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/follow/<int:user_id>', methods=['DELETE'])
@login_required
def unfollow_user(current_user_id, user_id):
    """Unfollow a user"""
    try:
        # 查找关注关系
        follow = Follow.query.filter_by(
            follower_id=current_user_id,
            following_id=user_id
        ).first()

        if not follow:
            return jsonify({'error': 'Not following'}), 400

        db.session.delete(follow)
        db.session.commit()

        # Log unfollow action
        LogService.log_unfollow(current_user_id, user_id)

        return jsonify({
            'message': 'Unfollowed successfully',
            'is_following': False
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/is-following/<int:user_id>', methods=['GET'])
@login_required
def is_following(current_user_id, user_id):
    """Check if current user is following another user"""
    try:
        follow = Follow.query.filter_by(
            follower_id=current_user_id,
            following_id=user_id
        ).first()

        return jsonify({
            'is_following': follow is not None
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/followers/<int:user_id>', methods=['GET'])
def get_followers(user_id):
    """Get user's followers list"""
    try:
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        followers = Follow.query.filter_by(following_id=user_id).all()
        followers_list = []

        for follow in followers:
            follower = db.session.get(User, follow.follower_id)
            if follower:
                followers_list.append({
                    'id': follower.id,
                    'username': follower.username,
                    'nickname': follower.nickname,
                    'avatar_url': follower.avatar_url,
                    'bio': follower.bio,
                    'followed_at': follow.created_at.isoformat()
                })

        return jsonify({
            'followers': followers_list,
            'total': len(followers_list)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/following/<int:user_id>', methods=['GET'])
def get_following(user_id):
    """Get user's following list"""
    try:
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        following = Follow.query.filter_by(follower_id=user_id).all()
        following_list = []

        for follow in following:
            followed_user = db.session.get(User, follow.following_id)
            if followed_user:
                following_list.append({
                    'id': followed_user.id,
                    'username': followed_user.username,
                    'nickname': followed_user.nickname,
                    'avatar_url': followed_user.avatar_url,
                    'bio': followed_user.bio,
                    'followed_at': follow.created_at.isoformat()
                })

        return jsonify({
            'following': following_list,
            'total': len(following_list)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
