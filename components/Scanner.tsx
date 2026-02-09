import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronLeftIcon } from './Icons';

interface ScannerProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'denied' | 'granted'>('prompt');

  const startCamera = async () => {
    setError('');
    
    // Verifica suporte básico do navegador
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Seu navegador não suporta acesso à câmera ou o site não está seguro (HTTPS).");
        return;
    }

    // Configurações otimizadas para Android
    // audio: false é CRUCIAL para evitar prompts extras que causam rejeição
    const constraints = {
      audio: false, 
      video: {
        facingMode: 'environment', // Tenta câmera traseira
        width: { ideal: 1280 },    // Ajuda o driver a selecionar a câmera correta
        height: { ideal: 720 }
      }
    };

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      handleStreamSuccess(mediaStream);
    } catch (err: any) {
      console.warn("Tentativa 1 (Environment HD) falhou:", err);
      
      // Tentativa 2: Fallback genérico (máxima compatibilidade)
      try {
        const fallbackConstraints = { 
            audio: false,
            video: true 
        };
        const fallbackStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        handleStreamSuccess(fallbackStream);
      } catch (finalErr: any) {
        console.error("Erro fatal ao acessar câmera:", finalErr);
        handleError(finalErr);
      }
    }
  };

  const handleStreamSuccess = (mediaStream: MediaStream) => {
    setStream(mediaStream);
    setPermissionStatus('granted');
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
      // Garante que o vídeo toque no Android/iOS (requer playsInline no elemento)
      videoRef.current.play().catch(e => console.error("Erro ao dar play no vídeo:", e));
    }
  };

  const handleError = (err: any) => {
    let errorMessage = "Não foi possível acessar a câmera.";
    let status: 'denied' | 'prompt' = 'prompt';
    
    // Tratamento de erros comuns
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.includes('Permission dismissed')) {
       errorMessage = "Acesso à câmera foi negado.";
       status = 'denied';
    } else if (err.name === 'NotFoundError') {
       errorMessage = "Nenhuma câmera encontrada neste dispositivo.";
    } else if (err.name === 'NotReadableError') {
       errorMessage = "A câmera pode estar em uso por outro app. Feche-o e tente novamente.";
    } else if (err.name === 'OverconstrainedError') {
       errorMessage = "A câmera não suporta a resolução solicitada.";
    } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
       errorMessage = "Por segurança, o Android exige que o site use HTTPS para acessar a câmera.";
    }

    setPermissionStatus(status);
    setError(errorMessage);
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Qualidade 0.85 é um bom equilíbrio para OCR
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const base64Data = dataUrl.split(',')[1]; 
        
        stopCamera();
        onCapture(base64Data);
      }
    }
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white p-6 z-50">
        <div className="bg-gray-800 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl border border-gray-700">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-red-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3">Acesso Necessário</h3>
            <p className="text-gray-300 mb-6 text-base leading-relaxed">{error}</p>
            
            <div className="flex flex-col gap-3">
                {permissionStatus === 'denied' && (
                   <div className="bg-gray-700/50 p-4 rounded-xl text-sm text-left text-gray-400 mb-2">
                      <p className="font-bold text-gray-300 mb-1">Como ativar:</p>
                      1. Toque no cadeado 🔒 na barra de endereço.<br/>
                      2. Vá em "Permissões" e ative a "Câmera".<br/>
                      3. Clique em "Tentar Novamente" abaixo.
                   </div>
                )}
                
                <button 
                  onClick={() => startCamera()}
                  className="bg-teal-600 w-full py-4 rounded-xl font-bold active:scale-95 transition-transform hover:bg-teal-700 text-lg shadow-lg text-white"
                >
                  Tentar Novamente
                </button>
                
                <button 
                  onClick={onCancel}
                  className="bg-transparent border border-gray-600 w-full py-4 rounded-xl font-medium active:scale-95 transition-transform hover:bg-gray-700 text-gray-300"
                >
                  Cancelar
                </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={onCancel} className="text-white p-3 bg-white/10 rounded-full backdrop-blur-md active:bg-white/20">
            <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <span className="text-white font-semibold text-lg drop-shadow-md tracking-wide">Escanear Produto</span>
        <div className="w-12"></div> {/* Spacer */}
      </div>

      {/* Camera View */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Helper Frame Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-72 h-72 border-2 border-white/50 rounded-3xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-teal-400 -mt-0.5 -ml-0.5 rounded-tl-xl shadow-sm"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-teal-400 -mt-0.5 -mr-0.5 rounded-tr-xl shadow-sm"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-teal-400 -mb-0.5 -ml-0.5 rounded-bl-xl shadow-sm"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-teal-400 -mb-0.5 -mr-0.5 rounded-br-xl shadow-sm"></div>
            </div>
            <div className="absolute bottom-24 bg-black/60 px-6 py-3 rounded-full backdrop-blur-md border border-white/10 text-center">
                <p className="text-white font-medium text-sm">Aponte para os ingredientes</p>
            </div>
        </div>
      </div>

      {/* Hidden Canvas for Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Footer Controls */}
      <div className="bg-black/80 pb-12 pt-8 px-8 flex justify-center items-center backdrop-blur-sm">
        <button 
          onClick={captureImage}
          className="w-20 h-20 bg-white rounded-full border-4 border-gray-400 flex items-center justify-center shadow-2xl active:scale-90 transition-all duration-200 hover:border-teal-400 hover:scale-105"
        >
            <div className="w-16 h-16 bg-teal-500 rounded-full border-[4px] border-white"></div>
        </button>
      </div>
    </div>
  );
};

export default Scanner;