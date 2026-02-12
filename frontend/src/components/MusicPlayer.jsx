import { useState, useEffect, useRef } from 'react';
import { Card, Slider, Button, Space, Typography, Avatar } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  SoundOutlined,
  CustomerServiceOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { interactionAPI } from '../api';

const { Text } = Typography;

const MusicPlayer = ({ currentSong, playlist, onSongChange, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const audioRef = useRef(null);
  const playRecordedRef = useRef(false);

  useEffect(() => {
    if (currentSong && audioRef.current) {
      // 设置音频源
      if (currentSong.external_url) {
        audioRef.current.src = currentSong.external_url;
        audioRef.current.load();

        // 自动播放新歌曲
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          // 记录播放行为
          recordPlay();
        }).catch(err => {
          console.error('播放失败:', err);
          setIsPlaying(false);
        });
      }

      setDuration(currentSong.duration);
      setCurrentTime(0);
      playRecordedRef.current = false;
    }
  }, [currentSong]);

  const recordPlay = async () => {
    if (currentSong && !playRecordedRef.current) {
      try {
        await interactionAPI.playSong(currentSong.id, { duration: 0 });
        playRecordedRef.current = true;
      } catch (error) {
        console.error('记录播放失败:', error);
      }
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // 监听音频事件
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      handleNext();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentSong]);

  // 删除模拟播放进度的代码
  // useEffect(() => {
  //   let interval;
  //   if (isPlaying && currentSong) {
  //     interval = setInterval(() => {
  //       setCurrentTime((prev) => {
  //         if (prev >= currentSong.duration) {
  //           handleNext();
  //           return 0;
  //         }
  //         return prev + 1;
  //       });
  //     }, 1000);
  //   }
  //   return () => clearInterval(interval);
  // }, [isPlaying, currentSong]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => {
          console.error('播放失败:', err);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    if (playlist && playlist.length > 0) {
      const currentIndex = playlist.findIndex(s => s.id === currentSong.id);
      const nextIndex = (currentIndex + 1) % playlist.length;
      onSongChange(playlist[nextIndex]);
      setIsPlaying(true);
    }
  };

  const handlePrevious = () => {
    if (playlist && playlist.length > 0) {
      const currentIndex = playlist.findIndex(s => s.id === currentSong.id);
      const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
      onSongChange(playlist[prevIndex]);
      setIsPlaying(true);
    }
  };

  const handleSeek = (value) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const handleClose = () => {
    // 停止播放
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    // 调用父组件的关闭回调
    if (onSongChange) {
      onSongChange(null);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentSong) return null;

  return (
    <>
      <Card
        className="music-player"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          borderRadius: 0,
          boxShadow: '0 -2px 8px rgba(0,0,0,0.15)',
        }}
        bodyStyle={{ padding: '12px' }}
      >
        <audio ref={audioRef} />

        <div className="player-container">
          {/* 歌曲信息 */}
          <div className="song-info">
            {currentSong.cover_url ? (
              <img
                src={currentSong.cover_url}
                alt={currentSong.title}
                className="song-cover"
              />
            ) : (
              <div className="song-cover-placeholder">
                <CustomerServiceOutlined style={{ fontSize: 24, color: '#999' }} />
              </div>
            )}
            <div className="song-details">
              <div className="song-title">
                {currentSong.title}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {currentSong.artist?.name}
              </Text>
            </div>
          </div>

          {/* 播放控制 */}
          <div className="player-controls">
            <div className="control-buttons">
              <Button
                type="text"
                icon={<StepBackwardOutlined />}
                onClick={handlePrevious}
                size="large"
                className="control-btn"
              />
              <Button
                type="primary"
                shape="circle"
                icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={handlePlayPause}
                size="large"
                className="play-btn"
              />
              <Button
                type="text"
                icon={<StepForwardOutlined />}
                onClick={handleNext}
                size="large"
                className="control-btn"
              />
            </div>

            {/* 进度条 */}
            <div className="progress-bar">
              <Text className="time-text">
                {formatTime(currentTime)}
              </Text>
              <Slider
                value={currentTime}
                max={duration}
                onChange={handleSeek}
                tooltip={{ formatter: (value) => formatTime(value) }}
                style={{ flex: 1, margin: 0 }}
              />
              <Text className="time-text">
                {formatTime(duration)}
              </Text>
            </div>
          </div>

          {/* 音量控制 - 移动端隐藏 */}
          <div className="volume-control">
            <SoundOutlined />
            <Slider
              value={volume}
              onChange={setVolume}
              style={{ flex: 1, margin: 0 }}
            />
          </div>

          {/* 关闭按钮 */}
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={handleClose}
            className="close-btn"
            style={{ flexShrink: 0 }}
          />
        </div>
      </Card>

      {/* 响应式样式 */}
      <style>{`
        /* 移动端样式 */
        .music-player .player-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .music-player .song-info {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1;
        }

        .music-player .song-cover,
        .music-player .song-cover-placeholder {
          width: 48px;
          height: 48px;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .music-player .song-cover {
          object-fit: cover;
        }

        .music-player .song-cover-placeholder {
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .music-player .song-details {
          flex: 1;
          min-width: 0;
        }

        .music-player .song-title {
          font-weight: bold;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 14px;
        }

        .music-player .player-controls {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex-shrink: 0;
          margin-right: 12px;
        }

        .music-player .control-buttons {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 4px;
        }

        .music-player .control-btn {
          display: none;
        }

        .music-player .play-btn {
          width: 40px;
          height: 40px;
        }

        .music-player .progress-bar {
          display: none;
        }

        .music-player .volume-control {
          display: none;
        }

        .music-player .close-btn {
          color: #999;
          font-size: 16px;
        }

        .music-player .close-btn:hover {
          color: #ff4d4f;
        }

        /* 桌面端样式 */
        @media (min-width: 769px) {
          .music-player .ant-card-body {
            padding: 16px 24px !important;
          }

          .music-player .player-container {
            gap: 24px;
          }

          .music-player .song-info {
            min-width: 250px;
            flex: 0 0 auto;
            gap: 12px;
          }

          .music-player .song-cover,
          .music-player .song-cover-placeholder {
            width: 56px;
            height: 56px;
          }

          .music-player .song-title {
            font-size: 16px;
          }

          .music-player .player-controls {
            flex: 1;
            gap: 8px;
          }

          .music-player .control-buttons {
            gap: 16px;
          }

          .music-player .control-btn {
            display: inline-block;
          }

          .music-player .play-btn {
            width: 48px;
            height: 48px;
          }

          .music-player .progress-bar {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .music-player .time-text {
            font-size: 12px;
            min-width: 40px;
          }

          .music-player .time-text:first-child {
            text-align: right;
          }

          .music-player .volume-control {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 150px;
          }
        }
      `}</style>
    </>
  );
};

export default MusicPlayer;
