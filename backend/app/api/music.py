"""Music API routes"""
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.music import Song, Artist
from app.services.log_service import LogService
from sqlalchemy import desc, or_

bp = Blueprint('music', __name__)


@bp.route('/songs', methods=['GET'])
def get_songs():
    """Get songs list with pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        # Query songs with pagination
        pagination = Song.query.order_by(desc(Song.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )

        songs = [song.to_dict() for song in pagination.items]

        return jsonify({
            'songs': songs,
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/songs/trending', methods=['GET'])
def get_trending_songs():
    """Get trending songs"""
    try:
        limit = request.args.get('limit', 10, type=int)

        # Get songs ordered by play count
        songs = Song.query.order_by(desc(Song.play_count)).limit(limit).all()

        return jsonify({
            'songs': [song.to_dict() for song in songs]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/songs/latest', methods=['GET'])
def get_latest_songs():
    """Get latest songs"""
    try:
        limit = request.args.get('limit', 10, type=int)

        # Get latest songs
        songs = Song.query.order_by(desc(Song.created_at)).limit(limit).all()

        return jsonify({
            'songs': [song.to_dict() for song in songs]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/songs/<int:song_id>', methods=['GET'])
def get_song_detail(song_id):
    """Get song detail"""
    try:
        song = db.session.get(Song, song_id)
        if not song:
            return jsonify({'error': 'Song not found'}), 404

        # Log view song action (if authenticated)
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        try:
            verify_jwt_in_request(optional=True)
            current_user_id = get_jwt_identity()
            if current_user_id:
                LogService.log_view_song(int(current_user_id), song_id)
        except:
            pass

        return jsonify({'song': song.to_dict()}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/artists', methods=['GET'])
def get_artists():
    """Get artists list"""
    try:
        artists = Artist.query.all()

        return jsonify({
            'artists': [artist.to_dict() for artist in artists]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/artists/<int:artist_id>', methods=['GET'])
def get_artist_detail(artist_id):
    """Get artist detail"""
    try:
        artist = db.session.get(Artist, artist_id)
        if not artist:
            return jsonify({'error': 'Artist not found'}), 404

        return jsonify({'artist': artist.to_dict()}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/artists/<int:artist_id>/songs', methods=['GET'])
def get_artist_songs(artist_id):
    """Get artist's songs"""
    try:
        artist = db.session.get(Artist, artist_id)
        if not artist:
            return jsonify({'error': 'Artist not found'}), 404

        # Get artist's top songs by play count
        songs = Song.query.filter_by(artist_id=artist_id).order_by(
            desc(Song.play_count)
        ).limit(20).all()

        return jsonify({
            'artist': artist.to_dict(),
            'songs': [song.to_dict() for song in songs]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/search', methods=['GET'])
def search():
    """Search songs and artists"""
    try:
        query = request.args.get('q', '')
        type_filter = request.args.get('type', 'all')  # all, songs, artists
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        if not query or len(query.strip()) < 1:
            return jsonify({
                'songs': [],
                'artists': [],
                'total': 0
            }), 200

        results = {'songs': [], 'artists': []}
        total = 0

        # Search songs
        if type_filter in ['all', 'songs']:
            song_query = Song.query.filter(
                or_(
                    Song.title.ilike(f'%{query}%'),
                    Song.lyrics.ilike(f'%{query}%')
                )
            )

            pagination = song_query.order_by(desc(Song.play_count)).paginate(
                page=page, per_page=per_page, error_out=False
            )

            results['songs'] = [song.to_dict() for song in pagination.items]
            results['songs_total'] = pagination.total
            total += pagination.total

        # Search artists
        if type_filter in ['all', 'artists']:
            artist_query = Artist.query.filter(
                or_(
                    Artist.name.ilike(f'%{query}%'),
                    Artist.bio.ilike(f'%{query}%')
                )
            )

            artists = artist_query.order_by(Artist.name).limit(10).all()
            results['artists'] = [artist.to_dict() for artist in artists]
            results['artists_total'] = len(artists)
            total += len(artists)

        results['total'] = total

        return jsonify(results), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

