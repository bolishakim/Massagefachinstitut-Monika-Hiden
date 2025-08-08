import { useState, useCallback, useRef, useEffect } from 'react';
import { VoiceRecordingState } from '@/types';

interface UseVoiceRecordingReturn extends VoiceRecordingState {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearRecording: () => void;
  isSupported: boolean;
}

export function useVoiceRecording(): UseVoiceRecordingReturn {
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    duration: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const isSupported = typeof navigator !== 'undefined' && 
    navigator.mediaDevices && 
    navigator.mediaDevices.getUserMedia &&
    typeof MediaRecorder !== 'undefined';

  const startRecording = useCallback(async () => {
    if (!isSupported || state.isRecording) return;

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        }
      });

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks available');
      }

      streamRef.current = stream;
      chunksRef.current = [];

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Handle data collection
      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      // Handle recording completion
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { 
          type: mediaRecorder.mimeType || 'audio/webm'
        });
        
        const audioURL = URL.createObjectURL(blob);

        setState(prev => ({
          ...prev,
          audioBlob: blob,
          audioURL,
          isRecording: false,
        }));

        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.onerror = () => {
        setState(prev => ({
          ...prev,
          error: 'Recording failed',
          isRecording: false,
        }));
      };

      // Start recording
      mediaRecorder.start(1000);
      startTimeRef.current = Date.now();

      setState(prev => ({
        ...prev,
        isRecording: true,
        duration: 0,
        error: undefined,
        audioBlob: undefined,
        audioURL: undefined,
      }));

      // Start duration timer
      intervalRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
        }));
      }, 1000);

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.name === 'NotAllowedError' 
          ? 'Microphone access denied. Please allow microphone permissions and try again.' 
          : 'Failed to access microphone',
        isRecording: false,
      }));
    }
  }, [isSupported, state.isRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current.stop();
      }
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [state.isRecording]);

  const clearRecording = useCallback(() => {
    // Stop recording if active
    if (state.isRecording) {
      stopRecording();
    }

    // Clean up URLs
    if (state.audioURL) {
      URL.revokeObjectURL(state.audioURL);
    }

    // Clean up streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Reset state
    setState({
      isRecording: false,
      duration: 0,
    });

    chunksRef.current = [];
    mediaRecorderRef.current = null;
  }, [state.isRecording, state.audioURL, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    clearRecording,
    isSupported,
  };
}