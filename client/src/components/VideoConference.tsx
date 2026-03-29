import React from 'react';

interface VideoConferenceProps {
  roomName: string; // Это уникальный ID кандидата
  userName: string; // Имя участника (Admin или имя студента)
  onClose: () => void;
}

const VideoConference: React.FC<VideoConferenceProps> = ({ roomName, userName, onClose }) => {
  // Используем MiroTalk P2P - это бесплатный сервис без регистрации и лимитов.
  // Мы передаем roomName и имя пользователя прямо в URL.
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
        // Разрешаем доступ к оборудованию внутри iframe
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
          Close View
        </button>
      </div>
    </div>
  );
};

export default VideoConference;