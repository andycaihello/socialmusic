"""Flask application factory"""
import os
from flask import Flask, send_from_directory
from app.config import config
from app.extensions import db, migrate, jwt, cors


def create_app(config_name=None):
    """Create and configure Flask application"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, origins=app.config['CORS_ORIGINS'])

    # Create upload folder if it doesn't exist
    upload_folder = os.path.join(app.root_path, '..', app.config['UPLOAD_FOLDER'])
    os.makedirs(upload_folder, exist_ok=True)

    # Serve uploaded files
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        upload_folder = os.path.join(app.root_path, '..', app.config['UPLOAD_FOLDER'])
        return send_from_directory(upload_folder, filename)

    # Register blueprints
    from app.api import auth, user, music, social, interaction, feed, message
    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(user.bp, url_prefix='/api/users')
    app.register_blueprint(music.bp, url_prefix='/api')
    app.register_blueprint(social.bp, url_prefix='/api/social')
    app.register_blueprint(interaction.bp, url_prefix='/api')
    app.register_blueprint(feed.bp, url_prefix='/api/feed')
    app.register_blueprint(message.bp, url_prefix='/api')

    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {'status': 'healthy'}, 200

    return app
