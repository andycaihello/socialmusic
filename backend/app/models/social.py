"""Social models (Follow, Like, Comment, PlayHistory)"""
from datetime import datetime
from app.extensions import db


class Follow(db.Model):
    """Follow relationship model"""
    __tablename__ = 'follows'

    id = db.Column(db.Integer, primary_key=True)
    follower_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    following_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    follower = db.relationship('User', foreign_keys=[follower_id], back_populates='following')
    following = db.relationship('User', foreign_keys=[following_id], back_populates='followers')

    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('follower_id', 'following_id', name='unique_follow'),
        db.Index('idx_follower_id', 'follower_id'),
        db.Index('idx_following_id', 'following_id'),
    )

    def __repr__(self):
        return f'<Follow {self.follower_id} -> {self.following_id}>'


class Like(db.Model):
    """Like model for songs"""
    __tablename__ = 'likes'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    song_id = db.Column(db.Integer, db.ForeignKey('songs.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', back_populates='likes')
    song = db.relationship('Song', back_populates='likes')

    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('user_id', 'song_id', name='unique_like'),
        db.Index('idx_user_likes', 'user_id'),
        db.Index('idx_song_likes', 'song_id'),
    )

    def __repr__(self):
        return f'<Like user={self.user_id} song={self.song_id}>'


class Comment(db.Model):
    """Comment model for songs"""
    __tablename__ = 'comments'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    song_id = db.Column(db.Integer, db.ForeignKey('songs.id', ondelete='CASCADE'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('comments.id', ondelete='CASCADE'), nullable=True)
    like_count = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', back_populates='comments')
    song = db.relationship('Song', back_populates='comments')
    parent = db.relationship('Comment', remote_side=[id], backref='replies')
    comment_likes = db.relationship('CommentLike', back_populates='comment', cascade='all, delete-orphan')

    # Indexes
    __table_args__ = (
        db.Index('idx_song_comments', 'song_id'),
        db.Index('idx_user_comments', 'user_id'),
        db.Index('idx_parent_comments', 'parent_id'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'user': self.user.to_dict() if self.user else None,
            'content': self.content,
            'parent_id': self.parent_id,
            'like_count': self.like_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<Comment {self.id} by user={self.user_id}>'


class CommentLike(db.Model):
    """Like model for comments"""
    __tablename__ = 'comment_likes'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    comment_id = db.Column(db.Integer, db.ForeignKey('comments.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref='comment_likes')
    comment = db.relationship('Comment', back_populates='comment_likes')

    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('user_id', 'comment_id', name='unique_comment_like'),
        db.Index('idx_user_comment_likes', 'user_id'),
        db.Index('idx_comment_likes', 'comment_id'),
    )

    def __repr__(self):
        return f'<CommentLike user={self.user_id} comment={self.comment_id}>'


class PlayHistory(db.Model):
    """Play history model"""
    __tablename__ = 'play_history'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    song_id = db.Column(db.Integer, db.ForeignKey('songs.id', ondelete='CASCADE'), nullable=False)
    play_duration = db.Column(db.Integer, nullable=False)  # in seconds
    completion_rate = db.Column(db.Float, nullable=False, default=0.0)  # percentage
    source = db.Column(db.String(50), nullable=True)  # 'feed', 'search', 'artist', etc.
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', back_populates='play_history')
    song = db.relationship('Song', back_populates='play_history')

    # Indexes
    __table_args__ = (
        db.Index('idx_user_play_history', 'user_id'),
        db.Index('idx_song_play_history', 'song_id'),
        db.Index('idx_play_created_at', 'created_at'),
    )

    def __repr__(self):
        return f'<PlayHistory user={self.user_id} song={self.song_id}>'
