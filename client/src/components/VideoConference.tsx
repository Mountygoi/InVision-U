import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface VideoConferenceProps {
  roomName: string; // Unique candidate ID
  userName: string; // Participant name (Admin or student)
  onClose: () => void;
}

const VideoConference: React.FC<VideoConferenceProps> = ({ roomName, userName, onClose }) => {
  const { t } = useLanguage();
  // MiroTalk P2P — free service, no registration required.
  // Room name and username are passed directly in the URL.
  const roomUrl = `https://p2p.mirotalk.com/join/${roomName}?name=${encodeURIComponent(userName)}`;

  return (
    <div style={{ 
      width: '100%', 
      height: '600px', 
      borderRadius: '12px', 
      overflow: 'hidden', 
      background: '#000',
      position: 'relative'
    }}>
      <iframe
        src={roomUrl}
        // Allow camera/microphone access inside iframe
        allow="camera; microphone; display-capture; fullscreen; clipboard-read; clipboard-write; autoplay"
        style={{ 
          width: '100%', 
          height: '100%', 
          border: 'none' 
        }}
      />
      
      {/* Кнопка принудительного закрытия, если пользователь не нажал "выйти" в самом MiroTalk */}
      <div style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 10 }}>
        <button 
          onClick={onClose}
          style={{
            padding: '5px 15px',
            background: 'rgba(255, 0, 0, 0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {t('closeView')}
        </button>
      </div>
    </div>
  );
};

export default VideoConference;