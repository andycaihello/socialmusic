#!/usr/bin/env python3
"""
数据库同步脚本
从本地 SQLite 数据库导出数据，生成 PostgreSQL 兼容的 SQL 文件
"""
import os
import sys
import json
from datetime import datetime
from app import create_app, db
from app.models import User, Song, Artist, Comment, Like, Follow, PlayHistory, UserBehaviorLog, Album

def export_data_to_sql(output_file='data_export.sql'):
    """导出数据库数据为 SQL 文件"""
    app = create_app()

    with app.app_context():
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("-- Database Export\n")
            f.write(f"-- Generated at: {datetime.now()}\n")
            f.write("-- WARNING: This will delete all existing data!\n\n")

            # 禁用外键约束
            f.write("SET session_replication_role = 'replica';\n\n")

            # 清空所有表（按依赖顺序）
            f.write("-- Clear all tables\n")
            tables = ['user_behavior_logs', 'play_history', 'follows', 'likes', 'comments', 'songs', 'albums', 'artists', 'users']
            for table in tables:
                f.write(f"DELETE FROM {table};\n")
            f.write("\n")

            # 导出用户数据
            print("导出用户数据...")
            users = User.query.all()
            if users:
                f.write("-- Users\n")
                for user in users:
                    phone = f"'{escape_sql(user.phone)}'" if user.phone else 'NULL'
                    avatar_url = f"'{escape_sql(user.avatar_url)}'" if user.avatar_url else 'NULL'
                    nickname = f"'{escape_sql(user.nickname)}'" if user.nickname else 'NULL'
                    bio = f"'{escape_sql(user.bio)}'" if user.bio else 'NULL'
                    f.write(f"INSERT INTO users (id, username, email, phone, password_hash, avatar_url, nickname, bio, created_at, updated_at) VALUES ")
                    f.write(f"({user.id}, ")
                    f.write(f"'{escape_sql(user.username)}', ")
                    f.write(f"'{escape_sql(user.email)}', ")
                    f.write(f"{phone}, ")
                    f.write(f"'{escape_sql(user.password_hash)}', ")
                    f.write(f"{avatar_url}, ")
                    f.write(f"{nickname}, ")
                    f.write(f"{bio}, ")
                    f.write(f"'{user.created_at}', ")
                    f.write(f"'{user.updated_at}');\n")
                f.write("\n")
                print(f"  导出 {len(users)} 个用户")

            # 导出艺术家数据
            print("导出艺术家数据...")
            artists = Artist.query.all()
            if artists:
                f.write("-- Artists\n")
                for artist in artists:
                    bio = f"'{escape_sql(artist.bio)}'" if artist.bio else 'NULL'
                    avatar_url = f"'{escape_sql(artist.avatar_url)}'" if artist.avatar_url else 'NULL'
                    genre = f"'{escape_sql(artist.genre)}'" if artist.genre else 'NULL'
                    country = f"'{escape_sql(artist.country)}'" if artist.country else 'NULL'
                    f.write(f"INSERT INTO artists (id, name, bio, avatar_url, genre, country, created_at, updated_at) VALUES ")
                    f.write(f"({artist.id}, ")
                    f.write(f"'{escape_sql(artist.name)}', ")
                    f.write(f"{bio}, ")
                    f.write(f"{avatar_url}, ")
                    f.write(f"{genre}, ")
                    f.write(f"{country}, ")
                    f.write(f"'{artist.created_at}', ")
                    f.write(f"'{artist.updated_at}');\n")
                f.write("\n")
                print(f"  导出 {len(artists)} 个艺术家")

            # 导出专辑数据
            print("导出专辑数据...")
            albums = Album.query.all()
            if albums:
                f.write("-- Albums\n")
                for album in albums:
                    release_date = f"'{album.release_date}'" if album.release_date else 'NULL'
                    cover_url = f"'{escape_sql(album.cover_url)}'" if album.cover_url else 'NULL'
                    f.write(f"INSERT INTO albums (id, title, artist_id, cover_url, release_date, created_at, updated_at) VALUES ")
                    f.write(f"({album.id}, ")
                    f.write(f"'{escape_sql(album.title)}', ")
                    f.write(f"{album.artist_id}, ")
                    f.write(f"{cover_url}, ")
                    f.write(f"{release_date}, ")
                    f.write(f"'{album.created_at}', ")
                    f.write(f"'{album.updated_at}');\n")
                f.write("\n")
                print(f"  导出 {len(albums)} 个专辑")

            # 导出歌曲数据
            print("导出歌曲数据...")
            songs = Song.query.all()
            if songs:
                f.write("-- Songs\n")
                for song in songs:
                    album_id = song.album_id if song.album_id else 'NULL'
                    external_url = f"'{escape_sql(song.external_url)}'" if song.external_url else 'NULL'
                    cover_url = f"'{escape_sql(song.cover_url)}'" if song.cover_url else 'NULL'
                    genre = f"'{escape_sql(song.genre)}'" if song.genre else 'NULL'
                    lyrics = f"'{escape_sql(song.lyrics)}'" if song.lyrics else 'NULL'
                    f.write(f"INSERT INTO songs (id, title, artist_id, album_id, duration, external_url, cover_url, genre, lyrics, play_count, like_count, comment_count, created_at, updated_at) VALUES ")
                    f.write(f"({song.id}, ")
                    f.write(f"'{escape_sql(song.title)}', ")
                    f.write(f"{song.artist_id}, ")
                    f.write(f"{album_id}, ")
                    f.write(f"{song.duration or 0}, ")
                    f.write(f"{external_url}, ")
                    f.write(f"{cover_url}, ")
                    f.write(f"{genre}, ")
                    f.write(f"{lyrics}, ")
                    f.write(f"{song.play_count}, ")
                    f.write(f"{song.like_count}, ")
                    f.write(f"{song.comment_count}, ")
                    f.write(f"'{song.created_at}', ")
                    f.write(f"'{song.updated_at}');\n")
                f.write("\n")
                print(f"  导出 {len(songs)} 首歌曲")

            # 导出评论数据
            print("导出评论数据...")
            comments = Comment.query.all()
            if comments:
                f.write("-- Comments\n")
                for comment in comments:
                    parent_id = comment.parent_id if comment.parent_id else 'NULL'
                    f.write(f"INSERT INTO comments (id, user_id, song_id, content, parent_id, like_count, created_at, updated_at) VALUES ")
                    f.write(f"({comment.id}, ")
                    f.write(f"{comment.user_id}, ")
                    f.write(f"{comment.song_id}, ")
                    f.write(f"'{escape_sql(comment.content)}', ")
                    f.write(f"{parent_id}, ")
                    f.write(f"{comment.like_count}, ")
                    f.write(f"'{comment.created_at}', ")
                    f.write(f"'{comment.updated_at}');\n")
                f.write("\n")
                print(f"  导出 {len(comments)} 条评论")

            # 导出点赞数据
            print("导出点赞数据...")
            likes = Like.query.all()
            if likes:
                f.write("-- Likes\n")
                for like in likes:
                    f.write(f"INSERT INTO likes (id, user_id, song_id, created_at) VALUES ")
                    f.write(f"({like.id}, ")
                    f.write(f"{like.user_id}, ")
                    f.write(f"{like.song_id}, ")
                    f.write(f"'{like.created_at}');\n")
                f.write("\n")
                print(f"  导出 {len(likes)} 个点赞")

            # 导出关注数据
            print("导出关注数据...")
            follows = Follow.query.all()
            if follows:
                f.write("-- Follows\n")
                for follow in follows:
                    f.write(f"INSERT INTO follows (id, follower_id, following_id, created_at) VALUES ")
                    f.write(f"({follow.id}, ")
                    f.write(f"{follow.follower_id}, ")
                    f.write(f"{follow.following_id}, ")
                    f.write(f"'{follow.created_at}');\n")
                f.write("\n")
                print(f"  导出 {len(follows)} 个关注关系")

            # 导出播放历史
            print("导出播放历史...")
            play_history = PlayHistory.query.all()
            if play_history:
                f.write("-- Play History\n")
                for play in play_history:
                    source = f"'{escape_sql(play.source)}'" if play.source else 'NULL'
                    f.write(f"INSERT INTO play_history (id, user_id, song_id, play_duration, completion_rate, source, created_at) VALUES ")
                    f.write(f"({play.id}, ")
                    f.write(f"{play.user_id}, ")
                    f.write(f"{play.song_id}, ")
                    f.write(f"{play.play_duration}, ")
                    f.write(f"{play.completion_rate}, ")
                    f.write(f"{source}, ")
                    f.write(f"'{play.created_at}');\n")
                f.write("\n")
                print(f"  导出 {len(play_history)} 条播放历史")

            # 导出活动日志
            print("导出用户行为日志...")
            behavior_logs = UserBehaviorLog.query.all()
            if behavior_logs:
                f.write("-- User Behavior Logs\n")
                for log in behavior_logs:
                    song_id = log.song_id if log.song_id else 'NULL'
                    artist_id = log.artist_id if log.artist_id else 'NULL'
                    duration = log.duration if log.duration else 'NULL'
                    # Convert extra_data to proper JSON format
                    if log.extra_data:
                        try:
                            extra_data = f"'{json.dumps(log.extra_data)}'"
                        except:
                            extra_data = 'NULL'
                    else:
                        extra_data = 'NULL'
                    ip_address = f"'{escape_sql(log.ip_address)}'" if log.ip_address else 'NULL'
                    user_agent = f"'{escape_sql(log.user_agent)}'" if log.user_agent else 'NULL'
                    f.write(f"INSERT INTO user_behavior_logs (id, user_id, action_type, song_id, artist_id, duration, extra_data, ip_address, user_agent, created_at) VALUES ")
                    f.write(f"({log.id}, ")
                    f.write(f"{log.user_id}, ")
                    f.write(f"'{escape_sql(log.action_type)}', ")
                    f.write(f"{song_id}, ")
                    f.write(f"{artist_id}, ")
                    f.write(f"{duration}, ")
                    f.write(f"{extra_data}, ")
                    f.write(f"{ip_address}, ")
                    f.write(f"{user_agent}, ")
                    f.write(f"'{log.created_at}');\n")
                f.write("\n")
                print(f"  导出 {len(behavior_logs)} 条行为日志")

            # 重置序列（PostgreSQL 自增 ID）
            f.write("\n-- Reset sequences\n")
            f.write("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));\n")
            f.write("SELECT setval('artists_id_seq', (SELECT MAX(id) FROM artists));\n")
            f.write("SELECT setval('albums_id_seq', (SELECT MAX(id) FROM albums));\n")
            f.write("SELECT setval('songs_id_seq', (SELECT MAX(id) FROM songs));\n")
            f.write("SELECT setval('comments_id_seq', (SELECT MAX(id) FROM comments));\n")
            f.write("SELECT setval('likes_id_seq', (SELECT MAX(id) FROM likes));\n")
            f.write("SELECT setval('follows_id_seq', (SELECT MAX(id) FROM follows));\n")
            f.write("SELECT setval('play_history_id_seq', (SELECT MAX(id) FROM play_history));\n")
            f.write("SELECT setval('user_behavior_logs_id_seq', (SELECT MAX(id) FROM user_behavior_logs));\n")

            # 恢复外键约束
            f.write("\nSET session_replication_role = 'origin';\n")

            print(f"\n✅ 数据导出完成: {output_file}")
            print(f"文件大小: {os.path.getsize(output_file) / 1024:.2f} KB")

def escape_sql(text):
    """转义 SQL 字符串"""
    if text is None:
        return ''
    return str(text).replace("'", "''").replace('\n', '\\n').replace('\r', '\\r')

if __name__ == '__main__':
    output_file = 'data_export.sql'
    if len(sys.argv) > 1:
        output_file = sys.argv[1]

    print("开始导出数据库...")
    export_data_to_sql(output_file)
    print("\n下一步:")
    print(f"1. 将 {output_file} 上传到服务器")
    print("2. 在服务器上执行: psql -U socialmusic -d socialmusic -f data_export.sql")