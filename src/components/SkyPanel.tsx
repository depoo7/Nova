import { Bot, Send, Volume2, VolumeX, X } from 'lucide-react';
import { useState } from 'react';
import { getDisplayCommander } from '../data/i18n';
import { useGameStore } from '../store/gameStore';

export function SkyPanel() {
  const [input, setInput] = useState('');

  const lang = useGameStore((s) => s.lang);
  const character = useGameStore((s) => s.character);
  const skyMessages = useGameStore((s) => s.skyMessages);
  const skyOpen = useGameStore((s) => s.skyOpen);
  const speechEnabled = useGameStore((s) => s.speechEnabled);
  const setSkyOpen = useGameStore((s) => s.setSkyOpen);
  const sendSkyUserQuery = useGameStore((s) => s.sendSkyUserQuery);
  const toggleSpeech = useGameStore((s) => s.toggleSpeech);

  const playerName = getDisplayCommander(character.name, lang);

  const quickQueries =
    lang === 'ar'
      ? [
          'لماذا تفشل مهمتي؟',
          'كيف أحسّن بعثة أوروبا؟',
          'فحص الاتصالات والبيانات',
          'توازن الطاقة والحرارة',
        ]
      : [
          'Why is my mission failing?',
          'How to improve Europa mission?',
          'Check comms & data rate',
          'Power & thermal balance',
        ];

  const handleSend = () => {
    if (!input.trim()) return;
    sendSkyUserQuery(input);
    setInput('');
  };

  if (!skyOpen) {
    return null;
  }

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-4">
      <div className="nova-panel flex h-[500px] max-h-[88vh] w-full max-w-lg flex-col rounded-3xl p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/40 bg-violet-500/15 text-violet-300">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white">
                {lang === 'ar' ? `المرافقة الذكية سكاي • ${playerName}` : `SKY AI • ${playerName}`}
              </h3>
              <p className="text-[11px] text-cyan-300">
                {lang === 'ar'
                  ? 'مساعدة الملاحة الشخصية والصوتية'
                  : 'Personalized Navigation & Engineering Co-Pilot'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleSpeech}
              title={lang === 'ar' ? 'تبديل صوت سكاي' : 'Toggle Sky Voice'}
              className="rounded-xl border border-white/15 bg-white/5 p-2 text-slate-300 hover:text-white"
            >
              {speechEnabled ? <Volume2 className="h-4 w-4 text-cyan-300" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setSkyOpen(false)}
              className="rounded-xl border border-white/15 bg-white/5 p-2 text-slate-300 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Message Feed */}
        <div className="my-3 flex-1 space-y-2.5 overflow-y-auto pe-1">
          {skyMessages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                msg.sender === 'sky'
                  ? 'border border-cyan-400/25 bg-cyan-500/10 text-slate-100'
                  : 'ms-8 border border-amber-400/25 bg-amber-500/15 text-amber-100'
              }`}
            >
              <div className="mb-1 text-[10px] font-bold opacity-75">
                {msg.sender === 'sky' ? 'SKY AI' : playerName}
              </div>
              {msg.text}
            </div>
          ))}
        </div>

        {/* Quick Prompts */}
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {quickQueries.map((q) => (
            <button
              key={q}
              onClick={() => sendSkyUserQuery(q)}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-cyan-200 hover:bg-cyan-500/15"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              lang === 'ar'
                ? `اسأل سكاي يا ${playerName}...`
                : `Ask Sky anything, ${playerName}...`
            }
            className="flex-1 rounded-xl border border-white/20 bg-slate-950/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
          />
          <button
            onClick={handleSend}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-slate-950 transition hover:brightness-110"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
