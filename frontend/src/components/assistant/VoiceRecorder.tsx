import React from 'react';
import { Mic, MicOff, Play, Pause, Trash2, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceRecorder({ onSend, disabled, className }: VoiceRecorderProps) {
  const {
    isRecording,
    duration,
    audioBlob,
    audioURL,
    error,
    startRecording,
    stopRecording,
    clearRecording,
    isSupported,
  } = useVoiceRecording();

  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !audioURL) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob);
    }
  };

  // Handle audio events
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioURL) return;

    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handleError = () => setIsPlaying(false);

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('error', handleError);
    };
  }, [audioURL]);

  if (!isSupported) {
    return (
      <div className={clsx('text-sm text-muted-foreground text-center p-4', className)}>
        Voice recording is not supported in this browser
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx('text-sm text-destructive text-center p-4', className)}>
        {error}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearRecording}
          className="mt-2 ml-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-3', className)}>
      {/* Recording Controls */}
      <div className="flex items-center gap-3">
        {!isRecording && !audioBlob && (
          <Button
            variant="outline"
            size="sm"
            onClick={startRecording}
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <Mic className="h-4 w-4" />
            Start Recording
          </Button>
        )}

        {isRecording && (
          <div className="flex items-center gap-3">
            <Button
              variant="destructive"
              size="sm"
              onClick={stopRecording}
              className="flex items-center gap-2"
            >
              <MicOff className="h-4 w-4" />
              Stop
            </Button>
            
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-3 h-3 bg-destructive rounded-full"
              />
              <Badge variant="destructive" className="text-xs">
                REC {formatDuration(duration)}
              </Badge>
            </div>
          </div>
        )}

        {audioBlob && !isRecording && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayPause}
              className="flex items-center gap-2"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>

            <Badge variant="secondary" className="text-xs">
              {formatDuration(duration)}
            </Badge>

            <Button
              variant="ghost"
              size="sm"
              onClick={clearRecording}
              className="p-2"
              aria-label="Delete recording"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleSend}
              disabled={disabled}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>
        )}
      </div>

      {/* Audio Element */}
      {audioURL && audioBlob && (
        <audio 
          ref={audioRef} 
          src={audioURL} 
          className="hidden" 
          preload="metadata"
        />
      )}

      {/* Recording Visualization */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center p-4 bg-muted rounded-lg"
          >
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-destructive rounded-full"
                  animate={{
                    height: [10, 20, 10],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}