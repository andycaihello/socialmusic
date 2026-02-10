"""User behavior logging service"""
from datetime import datetime
from flask import request
from app.extensions import db
from app.models.log import UserBehaviorLog


class LogService:
    """Service for logging user behavior"""

    @staticmethod
    def log_behavior(user_id, action_type, **kwargs):
        """
        Log user behavior

        Args:
            user_id: User ID
            action_type: Type of action (login, play, like, comment, follow, etc.)
            **kwargs: Additional metadata (song_id, artist_id, duration, etc.)
        """
        try:
            # 获取请求信息
            ip_address = request.remote_addr if request else None
            user_agent = request.headers.get('User-Agent') if request else None

            # 创建日志记录
            log = UserBehaviorLog(
                user_id=user_id,
                action_type=action_type,
                song_id=kwargs.get('song_id'),
                artist_id=kwargs.get('artist_id'),
                duration=kwargs.get('duration'),
                extra_data=kwargs.get('metadata', {}),
                ip_address=ip_address,
                user_agent=user_agent
            )

            db.session.add(log)
            db.session.commit()

            return True

        except Exception as e:
            print(f"Error logging behavior: {e}")
            db.session.rollback()
            return False

    @staticmethod
    def log_login(user_id):
        """Log user login"""
        return LogService.log_behavior(user_id, 'login')

    @staticmethod
    def log_logout(user_id):
        """Log user logout"""
        return LogService.log_behavior(user_id, 'logout')

    @staticmethod
    def log_play(user_id, song_id, duration=None, completion_rate=None, source=None):
        """Log song play"""
        metadata = {}
        if completion_rate is not None:
            metadata['completion_rate'] = completion_rate
        if source:
            metadata['source'] = source

        return LogService.log_behavior(
            user_id,
            'play',
            song_id=song_id,
            duration=duration,
            metadata=metadata
        )

    @staticmethod
    def log_like(user_id, song_id):
        """Log song like"""
        return LogService.log_behavior(user_id, 'like', song_id=song_id)

    @staticmethod
    def log_unlike(user_id, song_id):
        """Log song unlike"""
        return LogService.log_behavior(user_id, 'unlike', song_id=song_id)

    @staticmethod
    def log_comment(user_id, song_id, comment_id=None, parent_id=None):
        """Log comment"""
        metadata = {}
        if comment_id:
            metadata['comment_id'] = comment_id
        if parent_id:
            metadata['parent_id'] = parent_id
            metadata['is_reply'] = True

        return LogService.log_behavior(
            user_id,
            'comment',
            song_id=song_id,
            metadata=metadata
        )

    @staticmethod
    def log_follow(user_id, target_user_id):
        """Log user follow"""
        return LogService.log_behavior(
            user_id,
            'follow',
            metadata={'target_user_id': target_user_id}
        )

    @staticmethod
    def log_unfollow(user_id, target_user_id):
        """Log user unfollow"""
        return LogService.log_behavior(
            user_id,
            'unfollow',
            metadata={'target_user_id': target_user_id}
        )

    @staticmethod
    def log_view_song(user_id, song_id):
        """Log song detail view"""
        return LogService.log_behavior(user_id, 'view_song', song_id=song_id)

    @staticmethod
    def log_view_user(user_id, target_user_id):
        """Log user profile view"""
        return LogService.log_behavior(
            user_id,
            'view_user',
            metadata={'target_user_id': target_user_id}
        )

    @staticmethod
    def log_search(user_id, query, result_count=0):
        """Log search"""
        return LogService.log_behavior(
            user_id,
            'search',
            metadata={'query': query, 'result_count': result_count}
        )

    @staticmethod
    def log_profile_update(user_id, fields_updated):
        """Log profile update"""
        return LogService.log_behavior(
            user_id,
            'profile_update',
            metadata={'fields_updated': fields_updated}
        )

    @staticmethod
    def log_password_change(user_id):
        """Log password change"""
        return LogService.log_behavior(user_id, 'password_change')

    @staticmethod
    def log_avatar_upload(user_id):
        """Log avatar upload"""
        return LogService.log_behavior(user_id, 'avatar_upload')
