"""
Initialize database with sample data
"""
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.music import Artist, Album, Song
from datetime import datetime, timedelta
import random

app = create_app()

with app.app_context():
    print("🎵 开始初始化数据库...")

    # 创建示例用户
    print("\n👥 创建示例用户...")
    users_data = [
        {"username": "alice", "email": "alice@example.com", "nickname": "Alice音乐迷", "bio": "热爱流行音乐"},
        {"username": "bob", "email": "bob@example.com", "nickname": "Bob摇滚", "bio": "摇滚乐狂热粉"},
        {"username": "charlie", "email": "charlie@example.com", "nickname": "Charlie爵士", "bio": "爵士乐爱好者"},
        {"username": "david", "email": "david@example.com", "nickname": "David电音", "bio": "电子音乐制作人"},
        {"username": "emma", "email": "emma@example.com", "nickname": "Emma古典", "bio": "古典音乐鉴赏家"},
        {"username": "frank", "email": "frank@example.com", "nickname": "Frank嘻哈", "bio": "说唱音乐爱好者"},
        {"username": "grace", "email": "grace@example.com", "nickname": "Grace民谣", "bio": "民谣歌手"},
        {"username": "henry", "email": "henry@example.com", "nickname": "Henry金属", "bio": "重金属乐队主唱"},
    ]

    users = []
    for user_data in users_data:
        user = User(
            username=user_data["username"],
            email=user_data["email"],
            nickname=user_data["nickname"],
            bio=user_data["bio"]
        )
        user.set_password("password123")
        db.session.add(user)
        users.append(user)

    db.session.commit()
    print(f"✅ 创建了 {len(users)} 个用户")

    # 创建歌手
    print("\n🎤 创建歌手...")
    artists_data = [
        {"name": "周杰伦", "genre": "流行", "country": "中国台湾", "bio": "华语流行音乐天王"},
        {"name": "Taylor Swift", "genre": "流行", "country": "美国", "bio": "格莱美获奖歌手"},
        {"name": "Ed Sheeran", "genre": "流行", "country": "英国", "bio": "创作型歌手"},
        {"name": "The Beatles", "genre": "摇滚", "country": "英国", "bio": "传奇摇滚乐队"},
        {"name": "Queen", "genre": "摇滚", "country": "英国", "bio": "经典摇滚乐队"},
        {"name": "Adele", "genre": "流行", "country": "英国", "bio": "灵魂歌手"},
        {"name": "林俊杰", "genre": "流行", "country": "新加坡", "bio": "华语流行歌手"},
        {"name": "邓紫棋", "genre": "流行", "country": "中国香港", "bio": "实力派女歌手"},
        {"name": "Coldplay", "genre": "摇滚", "country": "英国", "bio": "另类摇滚乐队"},
        {"name": "Bruno Mars", "genre": "流行", "country": "美国", "bio": "全能音乐人"},
    ]

    artists = []
    for artist_data in artists_data:
        artist = Artist(
            name=artist_data["name"],
            genre=artist_data["genre"],
            country=artist_data["country"],
            bio=artist_data["bio"]
        )
        db.session.add(artist)
        artists.append(artist)

    db.session.commit()
    print(f"✅ 创建了 {len(artists)} 个歌手")

    # 创建专辑
    print("\n💿 创建专辑...")
    albums_data = [
        {"title": "范特西", "artist_idx": 0, "release_date": "2001-09-14"},
        {"title": "1989", "artist_idx": 1, "release_date": "2014-10-27"},
        {"title": "÷ (Divide)", "artist_idx": 2, "release_date": "2017-03-03"},
        {"title": "Abbey Road", "artist_idx": 3, "release_date": "1969-09-26"},
        {"title": "A Night at the Opera", "artist_idx": 4, "release_date": "1975-11-21"},
        {"title": "21", "artist_idx": 5, "release_date": "2011-01-24"},
        {"title": "因你而在", "artist_idx": 6, "release_date": "2015-12-27"},
        {"title": "新的心跳", "artist_idx": 7, "release_date": "2015-11-06"},
        {"title": "Parachutes", "artist_idx": 8, "release_date": "2000-07-10"},
        {"title": "24K Magic", "artist_idx": 9, "release_date": "2016-11-18"},
    ]

    albums = []
    for album_data in albums_data:
        album = Album(
            title=album_data["title"],
            artist_id=artists[album_data["artist_idx"]].id,
            release_date=datetime.strptime(album_data["release_date"], "%Y-%m-%d").date()
        )
        db.session.add(album)
        albums.append(album)

    db.session.commit()
    print(f"✅ 创建了 {len(albums)} 个专辑")

    # 创建歌曲
    print("\n🎵 创建歌曲...")
    songs_data = [
        # 周杰伦
        {"title": "双截棍", "artist_idx": 0, "album_idx": 0, "duration": 200, "genre": "流行"},
        {"title": "爱在西元前", "artist_idx": 0, "album_idx": 0, "duration": 220, "genre": "流行"},
        {"title": "简单爱", "artist_idx": 0, "album_idx": 0, "duration": 270, "genre": "流行"},
        # Taylor Swift
        {"title": "Shake It Off", "artist_idx": 1, "album_idx": 1, "duration": 219, "genre": "流行"},
        {"title": "Blank Space", "artist_idx": 1, "album_idx": 1, "duration": 231, "genre": "流行"},
        {"title": "Style", "artist_idx": 1, "album_idx": 1, "duration": 231, "genre": "流行"},
        # Ed Sheeran
        {"title": "Shape of You", "artist_idx": 2, "album_idx": 2, "duration": 233, "genre": "流行"},
        {"title": "Perfect", "artist_idx": 2, "album_idx": 2, "duration": 263, "genre": "流行"},
        {"title": "Castle on the Hill", "artist_idx": 2, "album_idx": 2, "duration": 261, "genre": "流行"},
        # The Beatles
        {"title": "Come Together", "artist_idx": 3, "album_idx": 3, "duration": 259, "genre": "摇滚"},
        {"title": "Something", "artist_idx": 3, "album_idx": 3, "duration": 182, "genre": "摇滚"},
        {"title": "Here Comes the Sun", "artist_idx": 3, "album_idx": 3, "duration": 185, "genre": "摇滚"},
        # Queen
        {"title": "Bohemian Rhapsody", "artist_idx": 4, "album_idx": 4, "duration": 354, "genre": "摇滚"},
        {"title": "Love of My Life", "artist_idx": 4, "album_idx": 4, "duration": 213, "genre": "摇滚"},
        {"title": "You're My Best Friend", "artist_idx": 4, "album_idx": 4, "duration": 170, "genre": "摇滚"},
        # Adele
        {"title": "Rolling in the Deep", "artist_idx": 5, "album_idx": 5, "duration": 228, "genre": "流行"},
        {"title": "Someone Like You", "artist_idx": 5, "album_idx": 5, "duration": 285, "genre": "流行"},
        {"title": "Set Fire to the Rain", "artist_idx": 5, "album_idx": 5, "duration": 242, "genre": "流行"},
        # 林俊杰
        {"title": "因你而在", "artist_idx": 6, "album_idx": 6, "duration": 265, "genre": "流行"},
        {"title": "不为谁而作的歌", "artist_idx": 6, "album_idx": 6, "duration": 280, "genre": "流行"},
        {"title": "修炼爱情", "artist_idx": 6, "album_idx": 6, "duration": 245, "genre": "流行"},
        # 邓紫棋
        {"title": "泡沫", "artist_idx": 7, "album_idx": 7, "duration": 243, "genre": "流行"},
        {"title": "光年之外", "artist_idx": 7, "album_idx": 7, "duration": 240, "genre": "流行"},
        {"title": "来自天堂的魔鬼", "artist_idx": 7, "album_idx": 7, "duration": 258, "genre": "流行"},
        # Coldplay
        {"title": "Yellow", "artist_idx": 8, "album_idx": 8, "duration": 269, "genre": "摇滚"},
        {"title": "Trouble", "artist_idx": 8, "album_idx": 8, "duration": 270, "genre": "摇滚"},
        {"title": "Shiver", "artist_idx": 8, "album_idx": 8, "duration": 299, "genre": "摇滚"},
        # Bruno Mars
        {"title": "24K Magic", "artist_idx": 9, "album_idx": 9, "duration": 226, "genre": "流行"},
        {"title": "That's What I Like", "artist_idx": 9, "album_idx": 9, "duration": 206, "genre": "流行"},
        {"title": "Finesse", "artist_idx": 9, "album_idx": 9, "duration": 197, "genre": "流行"},
    ]

    songs = []
    for song_data in songs_data:
        # 随机生成播放量、点赞数、评论数
        play_count = random.randint(10000, 5000000)
        like_count = random.randint(500, 50000)
        comment_count = random.randint(50, 5000)

        song = Song(
            title=song_data["title"],
            artist_id=artists[song_data["artist_idx"]].id,
            album_id=albums[song_data["album_idx"]].id,
            duration=song_data["duration"],
            genre=song_data["genre"],
            play_count=play_count,
            like_count=like_count,
            comment_count=comment_count
        )
        db.session.add(song)
        songs.append(song)

    db.session.commit()
    print(f"✅ 创建了 {len(songs)} 首歌曲")

    # 创建一些关注关系
    print("\n👥 创建关注关系...")
    from app.models.social import Follow

    follow_count = 0
    for i in range(len(users)):
        # 每个用户随机关注2-4个其他用户
        num_follows = random.randint(2, 4)
        followed_users = random.sample([u for j, u in enumerate(users) if j != i], num_follows)

        for followed_user in followed_users:
            follow = Follow(
                follower_id=users[i].id,
                following_id=followed_user.id
            )
            db.session.add(follow)
            follow_count += 1

    db.session.commit()
    print(f"✅ 创建了 {follow_count} 个关注关系")

    # 创建一些点赞
    print("\n❤️ 创建点赞记录...")
    from app.models.social import Like

    like_count = 0
    for user in users:
        # 每个用户随机点赞5-15首歌
        num_likes = random.randint(5, 15)
        liked_songs = random.sample(songs, num_likes)

        for song in liked_songs:
            like = Like(
                user_id=user.id,
                song_id=song.id
            )
            db.session.add(like)
            like_count += 1

    db.session.commit()
    print(f"✅ 创建了 {like_count} 个点赞记录")

    # 创建一些播放历史
    print("\n▶️ 创建播放历史...")
    from app.models.social import PlayHistory

    play_history_count = 0
    for user in users:
        # 每个用户随机播放10-30首歌
        num_plays = random.randint(10, 30)

        for _ in range(num_plays):
            song = random.choice(songs)
            completion_rate = random.uniform(0.3, 1.0)
            play_duration = int(song.duration * completion_rate)

            play_history = PlayHistory(
                user_id=user.id,
                song_id=song.id,
                play_duration=play_duration,
                completion_rate=completion_rate * 100,
                source=random.choice(['feed', 'search', 'artist', 'album']),
                created_at=datetime.utcnow() - timedelta(days=random.randint(0, 30))
            )
            db.session.add(play_history)
            play_history_count += 1

    db.session.commit()
    print(f"✅ 创建了 {play_history_count} 条播放历史")

    # 创建一些评论
    print("\n💬 创建评论...")
    from app.models.social import Comment

    comment_count = 0
    comments_text = [
        "太好听了！",
        "单曲循环中",
        "这首歌陪我度过了很多时光",
        "经典永流传",
        "百听不厌",
        "旋律太美了",
        "歌词写得真好",
        "每次听都有新的感受",
        "强烈推荐！",
        "我的最爱",
    ]

    for user in users:
        # 每个用户随机评论3-8首歌
        num_comments = random.randint(3, 8)
        commented_songs = random.sample(songs, num_comments)

        for song in commented_songs:
            comment = Comment(
                user_id=user.id,
                song_id=song.id,
                content=random.choice(comments_text),
                like_count=random.randint(0, 100),
                created_at=datetime.utcnow() - timedelta(days=random.randint(0, 30))
            )
            db.session.add(comment)
            comment_count += 1

    db.session.commit()
    print(f"✅ 创建了 {comment_count} 条评论")

    print("\n" + "="*50)
    print("🎉 数据初始化完成！")
    print("="*50)
    print(f"📊 数据统计：")
    print(f"   用户: {len(users)} 个")
    print(f"   歌手: {len(artists)} 个")
    print(f"   专辑: {len(albums)} 个")
    print(f"   歌曲: {len(songs)} 首")
    print(f"   关注: {follow_count} 个")
    print(f"   点赞: {like_count} 个")
    print(f"   播放: {play_history_count} 条")
    print(f"   评论: {comment_count} 条")
    print("="*50)
