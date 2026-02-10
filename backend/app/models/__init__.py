"""Import all models for Flask-Migrate"""
from app.models.user import User
from app.models.music import Artist, Album, Song
from app.models.social import Follow, Like, Comment, PlayHistory
from app.models.log import UserBehaviorLog

__all__ = [
    'User',
    'Artist',
    'Album',
    'Song',
    'Follow',
    'Like',
    'Comment',
    'PlayHistory',
    'UserBehaviorLog'
]
