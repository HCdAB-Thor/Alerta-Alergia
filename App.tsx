import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, AnalysisResult, AppView } from './types';
import { analyzeProductImage } from './services/geminiService';
import Scanner from './components/Scanner';
import { PlusIcon, TrashIcon, UserIcon, CheckCircleIcon, XCircleIcon, CameraIcon, ExclamationTriangleIcon, PhotoIcon } from './components/Icons';

function App() {
  // State
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [newAllergen, setNewAllergen] = useState('');
  const [scanResult, setScanResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from LocalStorage
  useEffect(() => {
    const savedAllergens = localStorage.getItem('user_allergens');
    if (savedAllergens) {
      try {
        setAllergens(JSON.parse(savedAllergens));
      } catch (e) {
        console.error("Failed to parse allergens", e);
      }
    }

    const savedName = localStorage.getItem('user_name');
    if (savedName) {
      setUserName(savedName);
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('user_allergens', JSON.stringify(allergens));
  }, [allergens]);

  useEffect(() => {
    localStorage.setItem('user_name', userName);
  }, [userName]);

  // Handlers
  const addAllergen = () => {
    if (newAllergen.trim() && !allergens.includes(newAllergen.trim())) {
      setAllergens([...allergens, newAllergen.trim()]);
      setNewAllergen('');
    }
  };

  const removeAllergen = (item: string) => {
    setAllergens(allergens.filter(a => a !== item));
  };

  const handleSaveProfile = () => {
    // If user typed something but didn't click add, add it automatically on save
    if (newAllergen.trim()) {
      const itemToAdd = newAllergen.trim();
      if (!allergens.includes(itemToAdd)) {
        setAllergens(prev => [...prev, itemToAdd]);
      }
      setNewAllergen('');
    }
    // Return to home
    setView(AppView.HOME);
  };

  const handleCapture = async (base64Image: string) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setScanResult(null);
    setView(AppView.RESULT); // Move to result screen immediately to show loader

    try {
      const result = await analyzeProductImage(base64Image, allergens);
      setScanResult(result);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            // Remove data:image/jpeg;base64, prefix
            const base64 = result.split(',')[1];
            handleCapture(base64);
        };
        reader.readAsDataURL(file);
    }
    // Reset input to allow selecting the same file again if needed
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  // Helper for Result UI
  const getResultUI = (result: AnalysisResult) => {
    switch (result.riskLevel) {
      case 'SAFE':
        return {
          color: 'green',
          icon: <CheckCircleIcon className="w-24 h-24 text-green-500" />,
          title: 'PRODUTO SEGURO',
          borderColor: 'border-green-500',
          textColor: 'text-green-600',
          badgeColor: 'bg-green-100 text-green-700'
        };
      case 'WARNING':
        return {
          color: 'yellow',
          icon: <ExclamationTriangleIcon className="w-24 h-24 text-yellow-500" />,
          title: 'ATENÇÃO: VARIAÇÃO',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-600',
          badgeColor: 'bg-yellow-100 text-yellow-800'
        };
      case 'DANGER':
        return {
          color: 'red',
          icon: <XCircleIcon className="w-24 h-24 text-red-500" />,
          title: 'PERIGO!',
          borderColor: 'border-red-500',
          textColor: 'text-red-600',
          badgeColor: 'bg-red-100 text-red-700'
        };
      default:
        return {
          color: 'gray',
          icon: null,
          title: 'Desconhecido',
          borderColor: 'border-gray-500',
          textColor: 'text-gray-600',
          badgeColor: 'bg-gray-100 text-gray-700'
        };
    }
  };

  // Views Renderers

  const renderProfile = () => (
    <div className="min-h-screen bg-white pb-32">
      <div className="bg-teal-600 p-8 text-white rounded-b-[2rem] shadow-lg mb-6">
        <div className="relative mb-2">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Seu Perfil"
              className="w-full bg-transparent text-3xl font-bold text-white placeholder-teal-200 focus:outline-none border-b-2 border-transparent focus:border-white/20 transition-all pb-1 pr-8"
            />
            <div className="absolute right-0 top-1 pointer-events-none text-teal-200 opacity-60">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                  <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                  <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25v-5.5a.75.75 0 00-1.5 0v5.5a1.25 1.25 0 01-1.25 1.25h-9.5a1.25 1.25 0 01-1.25-1.25v-9.5z" />
                </svg>
            </div>
        </div>
        <p className="text-teal-100 text-sm opacity-90">Os dados ficam salvos neste dispositivo.</p>
      </div>

      <div className="px-6 max-w-lg mx-auto">
        <label className="block text-gray-700 font-semibold mb-2 ml-1">Adicionar Alergia</label>
        <div className="flex gap-2 mb-8">
          <input
            type="text"
            value={newAllergen}
            onChange={(e) => setNewAllergen(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addAllergen()}
            placeholder="Ex: Amendoim, Leite, Glúten..."
            className="flex-1 p-4 border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all shadow-sm"
          />
          <button 
            onClick={addAllergen}
            className="bg-teal-600 text-white p-4 rounded-2xl hover:bg-teal-700 transition-colors shadow-md active:scale-95"
          >
            <PlusIcon className="w-6 h-6" />
          </button>
        </div>

        <h2 className="text-lg font-bold text-gray-800 mb-4 ml-1 flex items-center gap-2">
            Minhas Alergias 
            <span className="bg-teal-100 text-teal-800 text-xs py-0.5 px-2 rounded-full">{allergens.length}</span>
        </h2>
        
        {allergens.length === 0 ? (
          <div className="text-center p-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">Nenhuma alergia cadastrada.</p>
            <p className="text-sm text-gray-400 mt-2">Adicione itens para começar a usar o scanner.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allergens.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <span className="font-medium text-gray-700 capitalize pl-2">{item}</span>
                <button 
                  onClick={() => removeAllergen(item)}
                  className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
        <button 
           onClick={handleSaveProfile}
           className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-teal-700 transition-transform active:scale-95 max-w-lg mx-auto flex items-center justify-center gap-2"
        >
          <CheckCircleIcon className="w-6 h-6 text-white" />
          Salvar Perfil
        </button>
      </div>
    </div>
  );

  const renderResult = () => {
    let ui = { color: 'gray', icon: <div/>, title: '', borderColor: '', textColor: '', badgeColor: '' };
    if (scanResult) {
      ui = getResultUI(scanResult);
    }

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
         {/* Simple Header */}
         <div className="bg-white p-4 shadow-sm flex items-center z-10 sticky top-0">
            <button onClick={() => setView(AppView.HOME)} className="text-gray-600 font-medium flex items-center gap-1 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="text-xl">&larr;</span> Voltar
            </button>
         </div>

         <div className="flex-1 flex flex-col items-center justify-center p-6 text-center w-full max-w-md mx-auto">
            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                    <div className="h-24 w-24 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <CameraIcon className="w-8 h-8 text-teal-500 opacity-50" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mt-8">Analisando Rótulo</h2>
                <p className="text-gray-500 mt-2">Buscando variações e derivados...</p>
              </div>
            )}

            {!isAnalyzing && errorMsg && (
              <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-red-100 max-w-sm w-full">
                <div className="text-red-500 mb-6 flex justify-center"><XCircleIcon className="w-20 h-20" /></div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Erro na Análise</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">{errorMsg}</p>
                <button onClick={() => setView(AppView.SCANNER)} className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold hover:bg-teal-700 transition-colors">Tentar Novamente</button>
              </div>
            )}

            {!isAnalyzing && scanResult && (
              <div className={`bg-white p-8 rounded-[2.5rem] shadow-2xl w-full border-t-8 ${ui.borderColor} animate-in fade-in slide-in-from-bottom-8 duration-500`}>
                
                <div className="flex justify-center mb-6 scale-110">
                  {ui.icon}
                </div>

                <h2 className={`text-3xl font-black mb-1 ${ui.textColor} tracking-tight`}>
                  {ui.title}
                </h2>
                
                <p className="text-gray-400 mb-8 font-semibold text-xs uppercase tracking-widest">
                  Resultado da Análise
                </p>

                <div className="bg-gray-50 p-5 rounded-2xl text-left mb-8 border border-gray-100">
                  <p className="text-gray-900 font-bold mb-2 flex items-center gap-2">
                    <span className="w-1 h-4 bg-gray-400 rounded-full"></span>
                    Motivo:
                  </p>
                  <p className="text-gray-600 leading-relaxed">{scanResult.reasoning}</p>
                </div>

                {scanResult.riskLevel !== 'SAFE' && scanResult.detectedAllergens.length > 0 && (
                  <div className="mb-8 text-left">
                    <p className={`${ui.textColor} font-bold text-xs uppercase tracking-wider mb-3`}>Itens Detectados:</p>
                    <div className="flex flex-wrap gap-2">
                      {scanResult.detectedAllergens.map((a, i) => (
                        <span key={i} className={`${ui.badgeColor} px-4 py-1.5 rounded-full text-sm font-bold shadow-sm`}>
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => setView(AppView.HOME)} 
                  className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <CameraIcon className="w-5 h-5" />
                  Escanear Novo Produto
                </button>
              </div>
            )}
         </div>
      </div>
    );
  };

  const renderHome = () => (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">
      {/* Header */}
      <header className="bg-white px-8 pt-8 pb-10 rounded-b-[2.5rem] shadow-sm z-10 relative overflow-hidden">
        <div className="flex justify-between items-start max-w-lg mx-auto relative z-10">
          <div className="flex flex-col">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
                {userName ? `Olá, ${userName.split(' ')[0]}` : 'Bem-vindo'}
            </p>
            <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-teal-700 tracking-tight leading-none">Alerta Alergia</h1>
            </div>
          </div>
          <button 
            onClick={() => setView(AppView.PROFILE)}
            className="bg-gray-50 p-3 rounded-2xl hover:bg-gray-100 transition-colors border border-gray-100 shadow-sm flex-shrink-0 mt-1"
          >
            <UserIcon className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        <div className="max-w-lg mx-auto bg-gradient-to-r from-teal-50 to-white p-1 rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition-shadow mt-6" onClick={() => setView(AppView.PROFILE)}>
            <div className="bg-white/50 p-4 rounded-xl flex items-center justify-between border border-teal-100">
                <div className="flex items-center gap-4">
                    <div className="bg-teal-100 p-2 rounded-lg">
                        <CheckCircleIcon className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                        <p className="text-gray-800 font-bold text-sm">Suas Alergias</p>
                        <p className="text-gray-500 text-xs mt-0.5 font-medium">
                            {allergens.length === 0 
                                ? "Nenhuma cadastrada" 
                                : `${allergens.length} cadastrada${allergens.length > 1 ? 's' : ''}`}
                        </p>
                    </div>
                </div>
                <span className="text-gray-300 text-2xl">&rsaquo;</span>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-lg mx-auto -mt-6 pb-12">
        <div className="w-full flex flex-col items-center">
            {allergens.length === 0 ? (
                 <div className="bg-white p-8 rounded-3xl shadow-xl text-center mb-8 border border-gray-100 w-full">
                    <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 text-teal-600">
                        <ExclamationTriangleIcon className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Configure seu Perfil</h2>
                    <p className="text-gray-500 mb-6 text-sm leading-relaxed">Antes de escanear produtos, precisamos saber quais ingredientes evitar.</p>
                    <button 
                        onClick={() => setView(AppView.PROFILE)}
                        className="bg-teal-600 text-white px-6 py-4 rounded-2xl font-bold w-full shadow-lg hover:bg-teal-700 transition-colors"
                    >
                        Configurar Agora
                    </button>
                 </div>
            ) : (
                <>
                    {/* Main Circular Scan Button */}
                    <div className="relative group cursor-pointer" onClick={() => setView(AppView.SCANNER)}>
                        <div className="absolute inset-0 bg-teal-400 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity animate-pulse"></div>
                        <button 
                            className="relative w-64 h-64 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full shadow-2xl flex flex-col items-center justify-center text-white border-[6px] border-white active:scale-95 transition-all duration-200 z-10"
                        >
                            <div className="bg-white/20 p-5 rounded-full mb-3 backdrop-blur-md">
                                <CameraIcon className="w-10 h-10 text-white" />
                            </div>
                            <span className="text-3xl font-bold tracking-tight drop-shadow-md">ESCANEAR</span>
                            <span className="text-teal-100 text-sm font-medium mt-1 tracking-wide">Ler Código / Rótulo</span>
                        </button>
                    </div>
                    
                    {/* Divider */}
                    <div className="flex items-center w-full max-w-xs my-8 opacity-60">
                        <div className="h-px bg-gray-300 flex-1"></div>
                        <span className="px-3 text-gray-400 text-xs font-bold uppercase tracking-widest">OU</span>
                        <div className="h-px bg-gray-300 flex-1"></div>
                    </div>

                    {/* Secondary Upload Button */}
                    <div className="w-full max-w-xs">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                            accept="image/*" 
                            className="hidden" 
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-white text-gray-600 hover:text-teal-600 border border-gray-200 hover:border-teal-400 hover:bg-teal-50 py-4 rounded-xl font-semibold shadow-sm flex items-center justify-center gap-3 transition-all active:scale-95 group"
                        >
                            <PhotoIcon className="w-5 h-5 text-gray-400 group-hover:text-teal-500 transition-colors" />
                            <span>Carregar Foto da Galeria</span>
                        </button>
                    </div>
                </>
            )}
        </div>
      </main>
    </div>
  );

  // Router
  switch (view) {
    case AppView.SCANNER:
      return <Scanner onCapture={handleCapture} onCancel={() => setView(AppView.HOME)} />;
    case AppView.PROFILE:
      return renderProfile();
    case AppView.RESULT:
      return renderResult();
    default:
      return renderHome();
  }
}

export default App;