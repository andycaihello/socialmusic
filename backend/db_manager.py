#!/usr/bin/env python3
"""
数据库管理工具
使用方法：
  python db_manager.py                    # 进入交互式shell
  python db_manager.py --query "SQL"      # 执行SQL查询
  python db_manager.py --tables           # 查看所有表
  python db_manager.py --users            # 查看所有用户
  python db_manager.py --songs            # 查看所有歌曲
"""
import sys
import argparse
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.music import Song, Artist, Album
from app.models.social import Like, Comment, Follow
from sqlalchemy import text

app = create_app()

def interactive_shell():
    """进入交互式Python shell"""
    import code
    with app.app_context():
        banner = """
=================================================
数据库管理 Shell
=================================================
可用对象：
  - db: 数据库对象
  - User, Song, Artist, Album: 模型类
  - Like, Comment, Follow: 社交模型

示例命令：
  User.query.all()                    # 查询所有用户
  Song.query.filter_by(id=1).first()  # 查询ID为1的歌曲
  db.session.execute(text("SELECT * FROM users")).fetchall()  # 执行SQL

输入 exit() 退出
=================================================
"""
        code.interact(banner=banner, local=locals())

def show_tables():
    """显示所有表"""
    with app.app_context():
        result = db.session.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        ))
        tables = result.fetchall()

        print("\n" + "="*50)
        print("数据库表列表")
        print("="*50)
        for i, (table,) in enumerate(tables, 1):
            print(f"{i}. {table}")
        print("="*50 + "\n")

def show_users():
    """显示所有用户"""
    with app.app_context():
        users = User.query.all()

        print("\n" + "="*80)
        print(f"{'ID':<5} {'用户名':<15} {'邮箱':<25} {'昵称':<15} {'手机号':<15}")
        print("="*80)
        for user in users:
            print(f"{user.id:<5} {user.username:<15} {user.email:<25} "
                  f"{(user.nickname or ''):<15} {(user.phone or ''):<15}")
        print("="*80)
        print(f"总计: {len(users)} 个用户\n")

def show_songs():
    """显示所有歌曲"""
    with app.app_context():
        songs = Song.query.all()

        print("\n" + "="*100)
        print(f"{'ID':<5} {'歌曲名':<25} {'歌手':<20} {'播放':<8} {'点赞':<8} {'评论':<8}")
        print("="*100)
        for song in songs:
            print(f"{song.id:<5} {song.title:<25} {song.artist.name:<20} "
                  f"{song.play_count:<8} {song.like_count:<8} {song.comment_count:<8}")
        print("="*100)
        print(f"总计: {len(songs)} 首歌曲\n")

def show_artists():
    """显示所有歌手"""
    with app.app_context():
        artists = Artist.query.all()

        print("\n" + "="*80)
        print(f"{'ID':<5} {'歌手名':<20} {'风格':<15} {'国家/地区':<20}")
        print("="*80)
        for artist in artists:
            print(f"{artist.id:<5} {artist.name:<20} {artist.genre:<15} {artist.country:<20}")
        print("="*80)
        print(f"总计: {len(artists)} 位歌手\n")

def show_comments():
    """显示最近的评论"""
    with app.app_context():
        comments = Comment.query.order_by(Comment.created_at.desc()).limit(20).all()

        print("\n" + "="*100)
        print(f"{'ID':<5} {'用户':<15} {'歌曲':<25} {'内容':<40} {'时间':<20}")
        print("="*100)
        for comment in comments:
            content = comment.content[:37] + "..." if len(comment.content) > 40 else comment.content
            print(f"{comment.id:<5} {comment.user.username:<15} "
                  f"{Song.query.get(comment.song_id).title:<25} "
                  f"{content:<40} {str(comment.created_at)[:19]:<20}")
        print("="*100)
        print(f"显示最近 {len(comments)} 条评论\n")

def execute_query(sql):
    """执行SQL查询"""
    with app.app_context():
        try:
            result = db.session.execute(text(sql))

            # 如果是SELECT查询，显示结果
            if sql.strip().upper().startswith('SELECT'):
                rows = result.fetchall()
                if rows:
                    # 显示列名
                    columns = result.keys()
                    print("\n" + "="*100)
                    print(" | ".join(str(col) for col in columns))
                    print("="*100)

                    # 显示数据
                    for row in rows:
                        print(" | ".join(str(val) for val in row))
                    print("="*100)
                    print(f"总计: {len(rows)} 行\n")
                else:
                    print("查询结果为空")
            else:
                # 对于INSERT/UPDATE/DELETE，提交事务
                db.session.commit()
                print(f"✅ SQL执行成功")

        except Exception as e:
            db.session.rollback()
            print(f"❌ 错误: {e}")

def show_stats():
    """显示数据库统计信息"""
    with app.app_context():
        user_count = User.query.count()
        song_count = Song.query.count()
        artist_count = Artist.query.count()
        comment_count = Comment.query.count()
        like_count = Like.query.count()
        follow_count = Follow.query.count()

        print("\n" + "="*50)
        print("数据库统计信息")
        print("="*50)
        print(f"用户数量:     {user_count}")
        print(f"歌手数量:     {artist_count}")
        print(f"歌曲数量:     {song_count}")
        print(f"评论数量:     {comment_count}")
        print(f"点赞数量:     {like_count}")
        print(f"关注关系:     {follow_count}")
        print("="*50 + "\n")

def main():
    parser = argparse.ArgumentParser(description='数据库管理工具')
    parser.add_argument('--query', '-q', help='执行SQL查询')
    parser.add_argument('--tables', '-t', action='store_true', help='显示所有表')
    parser.add_argument('--users', '-u', action='store_true', help='显示所有用户')
    parser.add_argument('--songs', '-s', action='store_true', help='显示所有歌曲')
    parser.add_argument('--artists', '-a', action='store_true', help='显示所有歌手')
    parser.add_argument('--comments', '-c', action='store_true', help='显示最近评论')
    parser.add_argument('--stats', action='store_true', help='显示统计信息')

    args = parser.parse_args()

    if args.query:
        execute_query(args.query)
    elif args.tables:
        show_tables()
    elif args.users:
        show_users()
    elif args.songs:
        show_songs()
    elif args.artists:
        show_artists()
    elif args.comments:
        show_comments()
    elif args.stats:
        show_stats()
    else:
        # 默认进入交互式shell
        interactive_shell()

if __name__ == '__main__':
    main()
