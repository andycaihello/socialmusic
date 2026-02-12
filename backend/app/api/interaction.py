"""Interaction API routes (likes, comments, play history)"""
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.music import Song
from app.models.social import Like, Comment, CommentLike
from app.utils.decorators import login_required
from app.services.log_service import LogService
from sqlalchemy import desc

bp = Blueprint('interaction', __name__)


@bp.route('/songs/<int:song_id>/play', methods=['POST'])
@login_required
def record_play(current_user_id, song_id):
    """Record song play"""
    try:
        song = db.session.get(Song, song_id)
        if not song:
            return jsonify({'error': 'Song not found'}), 404

        data = request.json or {}
        duration = data.get('duration', 0)

        # Log play action
        LogService.log_play(current_user_id, song_id, duration)

        # Update song play count
        song.play_count = (song.play_count or 0) + 1
        db.session.commit()

        return jsonify({
            'message': 'Play recorded successfully',
            'play_count': song.play_count
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/songs/<int:song_id>/like', methods=['POST'])
@login_required
def like_song(current_user_id, song_id):
    """Like a song"""
    try:
        song = db.session.get(Song, song_id)
        if not song:
            return jsonify({'error': 'Song not found'}), 404

        # Check if already liked
        existing_like = Like.query.filter_by(
            user_id=current_user_id,
            song_id=song_id
        ).first()

        if existing_like:
            return jsonify({'error': 'Already liked'}), 400

        # Create like
        like = Like(user_id=current_user_id, song_id=song_id)
        db.session.add(like)

        # Update song like count
        song.like_count = Like.query.filter_by(song_id=song_id).count() + 1

        db.session.commit()

        # Log like action
        LogService.log_like(current_user_id, song_id)

        return jsonify({
            'message': 'Song liked successfully',
            'like_count': song.like_count
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/songs/<int:song_id>/like', methods=['DELETE'])
@login_required
def unlike_song(current_user_id, song_id):
    """Unlike a song"""
    try:
        song = db.session.get(Song, song_id)
        if not song:
            return jsonify({'error': 'Song not found'}), 404

        # Find and delete like
        like = Like.query.filter_by(
            user_id=current_user_id,
            song_id=song_id
        ).first()

        if not like:
            return jsonify({'error': 'Not liked yet'}), 400

        db.session.delete(like)

        # Update song like count
        song.like_count = max(0, Like.query.filter_by(song_id=song_id).count() - 1)

        db.session.commit()

        # Log unlike action
        LogService.log_unlike(current_user_id, song_id)

        return jsonify({
            'message': 'Song unliked successfully',
            'like_count': song.like_count
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/songs/<int:song_id>/like/status', methods=['GET'])
@login_required
def get_like_status(current_user_id, song_id):
    """Check if user has liked a song"""
    try:
        like = Like.query.filter_by(
            user_id=current_user_id,
            song_id=song_id
        ).first()

        return jsonify({
            'is_liked': like is not None
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/songs/<int:song_id>/comments', methods=['GET'])
def get_comments(song_id):
    """Get comments for a song"""
    try:
        song = db.session.get(Song, song_id)
        if not song:
            return jsonify({'error': 'Song not found'}), 404

        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        # Get top-level comments (no parent)
        pagination = Comment.query.filter_by(
            song_id=song_id,
            parent_id=None
        ).order_by(desc(Comment.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )

        comments = []
        for comment in pagination.items:
            comment_dict = comment.to_dict()
            # Get replies
            replies = Comment.query.filter_by(parent_id=comment.id).order_by(
                Comment.created_at
            ).all()
            comment_dict['replies'] = [reply.to_dict() for reply in replies]
            comments.append(comment_dict)

        return jsonify({
            'comments': comments,
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/songs/<int:song_id>/comments', methods=['POST'])
@login_required
def add_comment(current_user_id, song_id):
    """Add a comment to a song"""
    try:
        song = db.session.get(Song, song_id)
        if not song:
            return jsonify({'error': 'Song not found'}), 404

        data = request.json
        content = data.get('content', '').strip()
        parent_id = data.get('parent_id')

        if not content:
            return jsonify({'error': 'Comment content is required'}), 400

        if len(content) > 500:
            return jsonify({'error': 'Comment is too long (max 500 characters)'}), 400

        # If replying to a comment, check if parent exists
        if parent_id:
            parent_comment = db.session.get(Comment, parent_id)
            if not parent_comment or parent_comment.song_id != song_id:
                return jsonify({'error': 'Parent comment not found'}), 404

        # Create comment
        comment = Comment(
            user_id=current_user_id,
            song_id=song_id,
            content=content,
            parent_id=parent_id
        )
        db.session.add(comment)

        # Update song comment count (only for top-level comments)
        if not parent_id:
            song.comment_count = Comment.query.filter_by(
                song_id=song_id,
                parent_id=None
            ).count() + 1

        db.session.commit()

        # Log comment action
        LogService.log_comment(current_user_id, song_id, comment.id, parent_id)

        return jsonify({
            'message': 'Comment added successfully',
            'comment': comment.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/comments/<int:comment_id>', methods=['DELETE'])
@login_required
def delete_comment(current_user_id, comment_id):
    """Delete a comment"""
    try:
        comment = db.session.get(Comment, comment_id)
        if not comment:
            return jsonify({'error': 'Comment not found'}), 404

        # Check if user owns the comment
        if comment.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        song_id = comment.song_id
        is_top_level = comment.parent_id is None

        db.session.delete(comment)

        # Update song comment count (only for top-level comments)
        if is_top_level:
            song = db.session.get(Song, song_id)
            if song:
                song.comment_count = max(0, Comment.query.filter_by(
                    song_id=song_id,
                    parent_id=None
                ).count() - 1)

        db.session.commit()

        return jsonify({'message': 'Comment deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500



@bp.route('/comments/<int:comment_id>/like', methods=['POST'])
@login_required
def like_comment(current_user_id, comment_id):
    """Like a comment"""
    try:
        comment = db.session.get(Comment, comment_id)
        if not comment:
            return jsonify({'error': 'Comment not found'}), 404

        # Check if already liked
        existing_like = CommentLike.query.filter_by(
            user_id=current_user_id,
            comment_id=comment_id
        ).first()

        if existing_like:
            return jsonify({'error': 'Comment already liked'}), 400

        # Create like
        comment_like = CommentLike(
            user_id=current_user_id,
            comment_id=comment_id
        )
        db.session.add(comment_like)

        # Update comment like count
        comment.like_count += 1
        db.session.commit()

        return jsonify({
            'message': 'Comment liked successfully',
            'like_count': comment.like_count
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/comments/<int:comment_id>/like', methods=['DELETE'])
@login_required
def unlike_comment(current_user_id, comment_id):
    """Unlike a comment"""
    try:
        comment = db.session.get(Comment, comment_id)
        if not comment:
            return jsonify({'error': 'Comment not found'}), 404

        # Find the like
        comment_like = CommentLike.query.filter_by(
            user_id=current_user_id,
            comment_id=comment_id
        ).first()

        if not comment_like:
            return jsonify({'error': 'Comment not liked yet'}), 400

        # Delete like
        db.session.delete(comment_like)

        # Update comment like count
        comment.like_count = max(0, comment.like_count - 1)
        db.session.commit()

        return jsonify({
            'message': 'Comment unliked successfully',
            'like_count': comment.like_count
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
