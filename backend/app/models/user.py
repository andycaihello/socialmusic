"""User model"""
from datetime import datetime
from app.extensions import db
import bcrypt


class User(db.Model):
    """User model for authentication and profile"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), unique=True, nullable=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    avatar_url = db.Column(db.String(255), nullable=True)
    nickname = db.Column(db.String(100), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    likes = db.relationship('Like', back_populates='user', cascade='all, delete-orphan')
    comments = db.relationship('Comment', back_populates='user', cascade='all, delete-orphan')
    play_history = db.relationship('PlayHistory', back_populates='user', cascade='all, delete-orphan')
    behavior_logs = db.relationship('UserBehaviorLog', back_populates='user', cascade='all, delete-orphan')

    # Following relationships
    following = db.relationship(
        'Follow',
        foreign_keys='Follow.follower_id',
        back_populates='follower',
        cascade='all, delete-orphan'
    )
    followers = db.relationship(
        'Follow',
        foreign_keys='Follow.following_id',
        back_populates='following',
        cascade='all, delete-orphan'
    )

    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        """Verify password"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def to_dict(self, include_private=False):
        """Convert user to dictionary"""
        data = {
            'id': self.id,
            'username': self.username,
            'nickname': self.nickname or self.username,
            'avatar_url': self.avatar_url,
            'bio': self.bio,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if include_private:
            data['email'] = self.email
            data['phone'] = self.phone

        return data

    def __repr__(self):
        return f'<User {self.username}>'
