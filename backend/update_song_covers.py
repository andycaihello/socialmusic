"""
Update song cover images with real URLs
"""
from app import create_app
from app.extensions import db
from app.models.music import Song

app = create_app()

# 歌曲封面URL映射（使用公开的图片URL）
song_covers = {
    "稻香": "https://p1.music.126.net/hAN5QLhNxONbJJjmJL2qGQ==/109951163076136658.jpg",
    "晴天": "https://p1.music.126.net/UeTuwE7pvjBpypWLudqukA==/3430622884218932.jpg",
    "七里香": "https://p1.music.126.net/P1ciTSP4wZWzGY1JY6ivbg==/109951163555860423.jpg",
    "Shake It Off": "https://p1.music.126.net/arW1o8W_5AkdlXjTEXDMVw==/109951163347704744.jpg",
    "Blank Space": "https://p1.music.126.net/arW1o8W_5AkdlXjTEXDMVw==/109951163347704744.jpg",
    "Love Story": "https://p1.music.126.net/y19E5SFMrJkCW2K2IbvFBQ==/109951163347704745.jpg",
    "Shape of You": "https://p1.music.126.net/WqfMxrAGIbHt8CXgvRJVDg==/109951163076136658.jpg",
    "Perfect": "https://p1.music.126.net/WqfMxrAGIbHt8CXgvRJVDg==/109951163076136658.jpg",
    "Thinking Out Loud": "https://p1.music.126.net/qXPbkpIof_KP5ZbYvMmFBg==/109951163347704746.jpg",
    "Hey Jude": "https://p1.music.126.net/6cc6lgOfQTo6ovNnTHPyJg==/903798558032135.jpg",
    "Let It Be": "https://p1.music.126.net/6cc6lgOfQTo6ovNnTHPyJg==/903798558032135.jpg",
    "Yesterday": "https://p1.music.126.net/6cc6lgOfQTo6ovNnTHPyJg==/903798558032135.jpg",
    "Bohemian Rhapsody": "https://p1.music.126.net/FzHtz0Jx_sTVGmR8zIHQzA==/109951163347704747.jpg",
    "We Will Rock You": "https://p1.music.126.net/FzHtz0Jx_sTVGmR8zIHQzA==/109951163347704747.jpg",
    "Don't Stop Me Now": "https://p1.music.126.net/FzHtz0Jx_sTVGmR8zIHQzA==/109951163347704747.jpg",
    "Someone Like You": "https://p1.music.126.net/XhcZTmYE3xN4x3Fy_JiQfA==/109951163347704748.jpg",
    "Hello": "https://p1.music.126.net/Wl7T1LBRhKLLhKGJqvQzrw==/109951163347704749.jpg",
    "Rolling in the Deep": "https://p1.music.126.net/XhcZTmYE3xN4x3Fy_JiQfA==/109951163347704748.jpg",
    "江南": "https://p1.music.126.net/Md3RLH0fe2a_3dMDnfqoQg==/18590542604286213.jpg",
    "曹操": "https://p1.music.126.net/Md3RLH0fe2a_3dMDnfqoQg==/18590542604286213.jpg",
    "修炼爱情": "https://p1.music.126.net/Md3RLH0fe2a_3dMDnfqoQg==/18590542604286213.jpg",
    "泡沫": "https://p1.music.126.net/y19E5SFMrJkCW2K2IbvFBQ==/109951163347704750.jpg",
    "光年之外": "https://p1.music.126.net/y19E5SFMrJkCW2K2IbvFBQ==/109951163347704750.jpg",
    "倒数": "https://p1.music.126.net/y19E5SFMrJkCW2K2IbvFBQ==/109951163347704750.jpg",
    "Yellow": "https://p1.music.126.net/qXPbkpIof_KP5ZbYvMmFBg==/109951163347704751.jpg",
    "Viva La Vida": "https://p1.music.126.net/qXPbkpIof_KP5ZbYvMmFBg==/109951163347704751.jpg",
    "The Scientist": "https://p1.music.126.net/qXPbkpIof_KP5ZbYvMmFBg==/109951163347704751.jpg",
    "Just The Way You Are": "https://p1.music.126.net/WqfMxrAGIbHt8CXgvRJVDg==/109951163347704752.jpg",
    "Uptown Funk": "https://p1.music.126.net/WqfMxrAGIbHt8CXgvRJVDg==/109951163347704752.jpg",
    "Grenade": "https://p1.music.126.net/WqfMxrAGIbHt8CXgvRJVDg==/109951163347704752.jpg",
}

with app.app_context():
    print("🎨 开始更新歌曲封面...")

    songs = Song.query.all()
    updated_count = 0

    for song in songs:
        if song.title in song_covers:
            song.cover_url = song_covers[song.title]
            updated_count += 1
            print(f"✅ 更新: {song.title} - {song.artist.name}")

    db.session.commit()

    print(f"\n{'='*50}")
    print(f"🎉 封面更新完成！")
    print(f"{'='*50}")
    print(f"📊 统计：")
    print(f"   总歌曲数: {len(songs)}")
    print(f"   已更新封面: {updated_count}")
    print(f"{'='*50}")
