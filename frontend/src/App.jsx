import { useState, useEffect } from 'react';
import api from './api/api';
import { Calendar, User, Scissors, CheckCircle, Clock } from 'lucide-react';

function App() {
  const [step, setStep] = useState(1); // 1: Serviço, 2: Barbeiro, 3: Data/Confirmar, 4: Sucesso
  const [specialties, setSpecialties] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);

  // Carrega os dados iniciais do seu Backend Java
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [specRes, userRes] = await Promise.all([
          api.get('/specialties'),
          api.get('/users')
        ]);
        setSpecialties(specRes.data);
        setBarbers(userRes.data); // Aqui o ideal é o Henry criar um filtro para trazer só Barbeiros
        setLoading(false);
      } catch (error) {
        console.error("Erro ao conectar com o backend:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAgendar = () => {
    if (!date) return alert("Por favor, escolha uma data e horário.");

    const payload = {
      date: date + ":00", // Formato que o LocalDateTime do Java espera
      clientId: 5,       // ID do 'Cliente Feliz' que criamos no teste anterior
      barberId: selectedBarber.id,
      specialtyId: selectedSpecialty.id
    };

    api.post('/appointments', payload)
      .then(() => setStep(4))
      .catch(err => {
        console.error(err);
        alert("Erro ao realizar agendamento. Verifique se o Java está rodando.");
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center font-sans">
      {/* Container Principal (Simula a largura de um Celular) */}
      <div className="w-full max-w-md bg-white shadow-2xl min-h-screen flex flex-col border-x border-slate-200">
        
        {/* Header Superior */}
        <div className="bg-slate-900 p-8 text-white rounded-b-[2.5rem] shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black tracking-tight">BarberApp 💈</h1>
              <p className="text-slate-400 text-sm mt-1">Estilo e confiança.</p>
            </div>
            <div className="bg-amber-500 p-2 rounded-lg">
               <Clock className="text-slate-900" size={24} />
            </div>
          </div>
        </div>

        {/* Área de Conteúdo */}
        <div className="flex-1 p-6 overflow-y-auto">
          
          {/* PASSO 1: SELEÇÃO DE SERVIÇO */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
                <Scissors className="text-amber-500" /> O que vamos fazer hoje?
              </h2>
              <div className="grid gap-4">
                {specialties.map(spec => (
                  <button 
                    key={spec.id} 
                    onClick={() => { setSelectedSpecialty(spec); setStep(2); }}
                    className="w-full p-5 bg-white border-2 border-slate-100 rounded-2xl hover:border-amber-500 hover:bg-amber-50 transition-all flex justify-between items-center shadow-sm group"
                  >
                    <div className="text-left">
                      <span className="block font-bold text-slate-700 text-lg">{spec.name}</span>
                      <span className="text-slate-400 text-xs uppercase">{spec.description || 'Serviço Premium'}</span>
                    </div>
                    <span className="text-amber-500 font-bold group-hover:translate-x-1 transition-transform">➔</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PASSO 2: SELEÇÃO DE BARBEIRO */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button onClick={() => setStep(1)} className="text-slate-400 font-bold mb-6 text-xs tracking-widest hover:text-slate-600">← VOLTAR</button>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
                <User className="text-amber-500" /> Escolha o Profissional
              </h2>
              <div className="grid gap-4">
                {barbers.map(b => (
                  <button 
                    key={b.id} 
                    onClick={() => { setSelectedBarber(b); setStep(3); }}
                    className="w-full p-5 bg-white border-2 border-slate-100 rounded-2xl hover:border-amber-500 hover:bg-amber-50 transition-all flex items-center gap-4 shadow-sm"
                  >
                    <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center text-2xl shadow-inner">👤</div>
                    <div className="text-left">
                      <div className="font-bold text-slate-700 text-lg">{b.name}</div>
                      <div className="text-green-500 text-xs font-semibold">Disponível</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PASSO 3: DATA E CONFIRMAÇÃO */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
              <button onClick={() => setStep(2)} className="text-slate-400 font-bold mb-4 text-xs tracking-widest hover:text-slate-600">← VOLTAR</button>
              
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-700 shadow-lg text-white">
                <p className="text-amber-500 font-bold text-xs uppercase tracking-widest mb-4">Resumo do Agendamento</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Scissors size={18} className="text-slate-400" />
                    <span className="text-lg font-medium">{selectedSpecialty?.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-slate-400" />
                    <span className="text-lg font-medium">{selectedBarber?.name}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-slate-500 font-bold text-xs uppercase ml-2">Data e Horário</label>
                <input 
                  type="datetime-local" 
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-5 border-2 border-slate-100 rounded-2xl focus:border-amber-500 focus:bg-amber-50 outline-none font-bold text-slate-700 transition-all shadow-sm" 
                />
              </div>

              <button 
                onClick={handleAgendar}
                className="w-full py-5 bg-amber-500 text-slate-900 font-black rounded-2xl shadow-xl shadow-amber-200 text-lg hover:bg-amber-600 active:scale-95 transition-all"
              >
                CONFIRMAR AGENDAMENTO
              </button>
            </div>
          )}

          {/* PASSO 4: SUCESSO */}
          {step === 4 && (
            <div className="text-center py-16 animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={60} className="text-green-500" />
              </div>
              <h2 className="text-3xl font-black text-slate-800">FECHADO!</h2>
              <p className="text-slate-500 mt-3 font-medium px-4">Seu horário foi reservado e já aparece no sistema da barbearia.</p>
              
              <button 
                onClick={() => { setStep(1); setSelectedSpecialty(null); setSelectedBarber(null); }} 
                className="mt-12 px-8 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-800 transition-colors"
              >
                Voltar para o Início
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default App;