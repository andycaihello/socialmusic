"""Message model for private messaging"""
from datetime import datetime
from app.extensions import db


class Message(db.Model):
    """Message model for private messaging between users"""
    __tablename__ = 'messages'

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_messages')
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref='received_messages')

    # Indexes
    __table_args__ = (
        db.Index('idx_receiver_messages', 'receiver_id', 'created_at'),
        db.Index('idx_sender_messages', 'sender_id', 'created_at'),
        db.Index('idx_unread_messages', 'receiver_id', 'is_read'),
    )

    def to_dict(self):
        """Convert message to dictionary"""
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'receiver_id': self.receiver_id,
            'sender': self.sender.to_dict() if self.sender else None,
            'receiver': self.receiver.to_dict() if self.receiver else None,
            'content': self.content,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<Message {self.id} from {self.sender_id} to {self.receiver_id}>'
