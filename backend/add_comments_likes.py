"""
Add more comments and likes to existing songs
"""
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.music import Song
from app.models.social import Like, Comment
from datetime import datetime, timedelta
import random

app = create_app()

with app.app_context():
    print("🎵 开始添加更多评论和点赞数据...")

    users = User.query.all()
    songs = Song.query.all()

    if not users or not songs:
        print("❌ 没有找到用户或歌曲数据")
        exit(1)

    # 更多评论内容
    comments_text = [
        "太好听了！单曲循环中",
        "这首歌陪我度过了很多时光",
        "经典永流传，百听不厌",
        "旋律太美了，歌词写得真好",
        "每次听都有新的感受",
        "强烈推荐！我的最爱",
        "这才是真正的音乐",
        "听了一整天都不会腻",
        "深夜单曲循环",
        "这首歌治愈了我",
        "歌手唱功太棒了",
        "编曲很用心",
        "MV也很好看",
        "现场版更好听",
        "这首歌让我想起了很多回忆",
        "适合开车的时候听",
        "运动的时候听很带劲",
        "失眠的时候听很舒服",
        "歌词写进心里了",
        "前奏一响就知道是神曲",
        "副歌部分太抓耳了",
        "这个转音绝了",
        "高音部分太震撼了",
        "低音炮必备",
        "耳机党狂喜",
        "音质太好了",
        "制作很精良",
        "值得收藏",
        "已经加入我的歌单了",
        "分享给朋友们",
    ]

    # 清除现有的评论和点赞（重新生成）
    print("\n🗑️  清除旧数据...")
    Comment.query.delete()
    Like.query.delete()
    db.session.commit()

    # 为每首歌添加评论
    print("\n💬 添加评论...")
    total_comments = 0
    for song in songs:
        # 每首歌随机10-30条评论
        num_comments = random.randint(10, 30)

        for _ in range(num_comments):
            user = random.choice(users)
            comment = Comment(
                user_id=user.id,
                song_id=song.id,
                content=random.choice(comments_text),
                like_count=random.randint(0, 200),
                created_at=datetime.utcnow() - timedelta(days=random.randint(0, 60))
            )
            db.session.add(comment)
            total_comments += 1

        # 更新歌曲的评论数
        song.comment_count = num_comments

    db.session.commit()
    print(f"✅ 添加了 {total_comments} 条评论")

    # 为每首歌添加点赞
    print("\n❤️  添加点赞...")
    total_likes = 0
    for song in songs:
        # 每首歌随机30-80个用户点赞
        num_likes = random.randint(30, 80)

        # 随机选择用户（避免重复）
        liked_users = random.sample(users * 10, min(num_likes, len(users) * 10))

        for user in liked_users[:num_likes]:
            # 检查是否已经点赞
            existing_like = Like.query.filter_by(user_id=user.id, song_id=song.id).first()
            if not existing_like:
                like = Like(
                    user_id=user.id,
                    song_id=song.id,
                    created_at=datetime.utcnow() - timedelta(days=random.randint(0, 60))
                )
                db.session.add(like)
                total_likes += 1

        # 更新歌曲的点赞数
        actual_likes = Like.query.filter_by(song_id=song.id).count()
        song.like_count = actual_likes

    db.session.commit()
    print(f"✅ 添加了 {total_likes} 个点赞")

    # 添加一些嵌套评论（回复）
    print("\n💬 添加评论回复...")
    all_comments = Comment.query.filter_by(parent_id=None).all()
    reply_count = 0

    for _ in range(min(50, len(all_comments))):
        parent_comment = random.choice(all_comments)
        user = random.choice(users)

        reply = Comment(
            user_id=user.id,
            song_id=parent_comment.song_id,
            content=random.choice([
                "说得对！",
                "同感",
                "我也是这么觉得",
                "完全同意",
                "+1",
                "赞同",
                "确实如此",
                "有道理",
            ]),
            parent_id=parent_comment.id,
            like_count=random.randint(0, 50),
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 30))
        )
        db.session.add(reply)
        reply_count += 1

    db.session.commit()
    print(f"✅ 添加了 {reply_count} 条回复")

    print("\n" + "="*50)
    print("🎉 数据添加完成！")
    print("="*50)
    print(f"📊 统计：")
    print(f"   总评论数: {Comment.query.count()} 条")
    print(f"   总点赞数: {Like.query.count()} 个")
    print(f"   平均每首歌评论: {Comment.query.count() // len(songs)} 条")
    print(f"   平均每首歌点赞: {Like.query.count() // len(songs)} 个")
    print("="*50)
