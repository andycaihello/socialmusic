"""User behavior log model"""
from datetime import datetime
from app.extensions import db
from sqlalchemy.dialects.postgresql import JSONB


class UserBehaviorLog(db.Model):
    """User behavior log for recommendation system"""
    __tablename__ = 'user_behavior_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    action_type = db.Column(db.String(50), nullable=False)  # 'play', 'like', 'comment', 'search', 'share', 'skip', 'complete'
    song_id = db.Column(db.Integer, db.ForeignKey('songs.id', ondelete='SET NULL'), nullable=True)
    artist_id = db.Column(db.Integer, db.ForeignKey('artists.id', ondelete='SET NULL'), nullable=True)
    duration = db.Column(db.Integer, nullable=True)  # in seconds, for play events
    extra_data = db.Column(JSONB, nullable=True)  # Additional context data (renamed from metadata)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)

    # Relationships
    user = db.relationship('User', back_populates='behavior_logs')

    # Indexes
    __table_args__ = (
        db.Index('idx_user_behavior', 'user_id'),
        db.Index('idx_action_type', 'action_type'),
        db.Index('idx_behavior_created_at', 'created_at'),
    )

    def __repr__(self):
        return f'<UserBehaviorLog user={self.user_id} action={self.action_type}>'
