"""Music models (Artist, Album, Song)"""
from datetime import datetime
from app.extensions import db


class Artist(db.Model):
    """Artist model"""
    __tablename__ = 'artists'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, index=True)
    avatar_url = db.Column(db.String(255), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    genre = db.Column(db.String(100), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    albums = db.relationship('Album', back_populates='artist', cascade='all, delete-orphan')
    songs = db.relationship('Song', back_populates='artist', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'avatar_url': self.avatar_url,
            'bio': self.bio,
            'genre': self.genre,
            'country': self.country
        }

    def __repr__(self):
        return f'<Artist {self.name}>'


class Album(db.Model):
    """Album model"""
    __tablename__ = 'albums'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    artist_id = db.Column(db.Integer, db.ForeignKey('artists.id', ondelete='CASCADE'), nullable=False)
    cover_url = db.Column(db.String(255), nullable=True)
    release_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    artist = db.relationship('Artist', back_populates='albums')
    songs = db.relationship('Song', back_populates='album', cascade='all, delete-orphan')

    # Indexes
    __table_args__ = (
        db.Index('idx_artist_albums', 'artist_id'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'artist': self.artist.to_dict() if self.artist else None,
            'cover_url': self.cover_url,
            'release_date': self.release_date.isoformat() if self.release_date else None
        }

    def __repr__(self):
        return f'<Album {self.title}>'


class Song(db.Model):
    """Song model"""
    __tablename__ = 'songs'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False, index=True)
    artist_id = db.Column(db.Integer, db.ForeignKey('artists.id', ondelete='CASCADE'), nullable=False)
    album_id = db.Column(db.Integer, db.ForeignKey('albums.id', ondelete='SET NULL'), nullable=True)
    duration = db.Column(db.Integer, nullable=False)  # in seconds
    genre = db.Column(db.String(100), nullable=True)
    external_url = db.Column(db.String(500), nullable=True)  # Link to external music platform
    cover_url = db.Column(db.String(255), nullable=True)
    lyrics = db.Column(db.Text, nullable=True)
    play_count = db.Column(db.Integer, nullable=False, default=0)
    like_count = db.Column(db.Integer, nullable=False, default=0)
    comment_count = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    artist = db.relationship('Artist', back_populates='songs')
    album = db.relationship('Album', back_populates='songs')
    likes = db.relationship('Like', back_populates='song', cascade='all, delete-orphan')
    comments = db.relationship('Comment', back_populates='song', cascade='all, delete-orphan')
    play_history = db.relationship('PlayHistory', back_populates='song', cascade='all, delete-orphan')

    # Indexes
    __table_args__ = (
        db.Index('idx_artist_songs', 'artist_id'),
        db.Index('idx_album_songs', 'album_id'),
        db.Index('idx_play_count', 'play_count'),
        db.Index('idx_like_count', 'like_count'),
    )

    def to_dict(self, include_stats=True):
        data = {
            'id': self.id,
            'title': self.title,
            'artist': self.artist.to_dict() if self.artist else None,
            'album': self.album.to_dict() if self.album else None,
            'duration': self.duration,
            'genre': self.genre,
            'external_url': self.external_url,
            'cover_url': self.cover_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if include_stats:
            data.update({
                'play_count': self.play_count,
                'like_count': self.like_count,
                'comment_count': self.comment_count
            })

        return data

    def __repr__(self):
        return f'<Song {self.title}>'
