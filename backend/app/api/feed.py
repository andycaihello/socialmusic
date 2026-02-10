"""Feed API routes"""
from flask import Blueprint, jsonify, request
from sqlalchemy import desc
from app.extensions import db
from app.models.user import User
from app.models.music import Song
from app.models.social import Follow
from app.models.log import UserBehaviorLog
from app.utils.decorators import login_required

bp = Blueprint('feed', __name__)


@bp.route('/friends-activity', methods=['GET'])
@login_required
def get_friends_activity(current_user_id):
    """Get friends' activity feed (likes and plays)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        # Get list of users that current user is following
        following = Follow.query.filter_by(follower_id=current_user_id).all()
        following_ids = [f.following_id for f in following]

        if not following_ids:
            return jsonify({
                'activities': [],
                'total': 0,
                'page': page,
                'per_page': per_page
            }), 200

        # Get friends' activities (like and play actions)
        activities_query = UserBehaviorLog.query.filter(
            UserBehaviorLog.user_id.in_(following_ids),
            UserBehaviorLog.action_type.in_(['like', 'play']),
            UserBehaviorLog.song_id.isnot(None)
        ).order_by(desc(UserBehaviorLog.created_at))

        # Paginate
        offset = (page - 1) * per_page
        total = activities_query.count()
        activities = activities_query.limit(per_page).offset(offset).all()

        # Format activities
        activities_list = []
        for activity in activities:
            user = db.session.get(User, activity.user_id)
            song = db.session.get(Song, activity.song_id)

            if user and song:
                activities_list.append({
                    'id': activity.id,
                    'action_type': activity.action_type,
                    'created_at': activity.created_at.isoformat(),
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'nickname': user.nickname,
                        'avatar_url': user.avatar_url
                    },
                    'song': song.to_dict()
                })

        return jsonify({
            'activities': activities_list,
            'total': total,
            'page': page,
            'per_page': per_page
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
