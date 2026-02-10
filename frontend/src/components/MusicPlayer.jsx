import { useState, useEffect, useRef } from 'react';
import { Card, Slider, Button, Space, Typography, Avatar } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  SoundOutlined,
  CustomerServiceOutlined
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentSong) return null;

  return (
    <Card
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderRadius: 0,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.15)',
      }}
      bodyStyle={{ padding: '16px 24px' }}
    >
      <audio ref={audioRef} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {/* 歌曲信息 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 250 }}>
          {currentSong.cover_url ? (
            <img
              src={currentSong.cover_url}
              alt={currentSong.title}
              style={{
                width: 56,
                height: 56,
                borderRadius: 4,
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{
              width: 56,
              height: 56,
              background: '#f0f0f0',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CustomerServiceOutlined style={{ fontSize: 24, color: '#999' }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentSong.title}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {currentSong.artist?.name}
            </Text>
          </div>
        </div>

        {/* 播放控制 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={<StepBackwardOutlined />}
              onClick={handlePrevious}
              size="large"
            />
            <Button
              type="primary"
              shape="circle"
              icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={handlePlayPause}
              size="large"
              style={{ width: 48, height: 48 }}
            />
            <Button
              type="text"
              icon={<StepForwardOutlined />}
              onClick={handleNext}
              size="large"
            />
          </div>

          {/* 进度条 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 12, minWidth: 40, textAlign: 'right' }}>
              {formatTime(currentTime)}
            </Text>
            <Slider
              value={currentTime}
              max={duration}
              onChange={handleSeek}
              tooltip={{ formatter: (value) => formatTime(value) }}
              style={{ flex: 1, margin: 0 }}
            />
            <Text style={{ fontSize: 12, minWidth: 40 }}>
              {formatTime(duration)}
            </Text>
          </div>
        </div>

        {/* 音量控制 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 150 }}>
          <SoundOutlined />
          <Slider
            value={volume}
            onChange={setVolume}
            style={{ flex: 1, margin: 0 }}
          />
        </div>
      </div>
    </Card>
  );
};

export default MusicPlayer;
