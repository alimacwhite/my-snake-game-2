import React, { useState, useCallback } from 'react';
import { GameEventType, CommentaryMessage } from './types';
import { DIFFICULTY_CONFIG } from './constants';
import GameBoard from './components/GameBoard';
import Controls from './components/Controls';
import CommentaryPanel from './components/CommentaryPanel';
import { generateGameCommentary } from './services/geminiService';
import { useSnakeGame } from './hooks/useSnakeGame';
import { Trophy, Zap, Gauge } from 'lucide-react';

const App: React.FC = () => {
  const [messages, setMessages] = useState<CommentaryMessage[]>([]);

  // --- AI Integration ---
  
  const addMessage = useCallback((text: string, sender: 'ai' | 'system') => {
    setMessages(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      text,
      sender,
      timestamp: Date.now()
    }]);
  }, []);

  const handleGameEvent = useCallback(async (event: GameEventType, score: number, highScore: number) => {
    if (event === 'start') {
      setMessages([]);
      addMessage(`System: Game Started`, "system");
    }
    
    // Call Gemini API
    const comment = await generateGameCommentary(score, event, highScore);
    if (comment) addMessage(comment, 'ai');
  }, [addMessage]);

  // --- Game Hook ---

  const { state, actions } = useSnakeGame(handleGameEvent);
  const { snake, food, status, score, highScore, difficulty, speedProgress } = state;

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col md:flex-row items-center justify-center p-4 gap-8">
      
      {/* Left Column: Game Area */}
      <div className="flex flex-col items-center gap-4 w-full md:w-auto">
        
        {/* Header / Score */}
        <div className="w-full flex justify-between items-center px-4 py-2 bg-gray-900/50 rounded-lg border border-gray-800">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-mono uppercase tracking-widest">Score</span>
            <span className="text-3xl font-mono font-bold text-neon-blue">{score}</span>
          </div>
          
          <div className="flex items-center gap-2">
             <h1 className="hidden md:block text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-pink">
              NEON SNAKE
            </h1>
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-xs text-yellow-500 font-mono uppercase tracking-widest">
              <Trophy size={12} /> High Score
            </div>
            <span className="text-2xl font-mono font-bold text-white">{highScore}</span>
          </div>
        </div>

        {/* Speed Indicator */}
        <div className="w-full flex items-center gap-3 px-2 py-1">
             <div className="flex items-center gap-2 w-16">
                <Gauge size={14} className={DIFFICULTY_CONFIG[difficulty].color} />
                <span className={`text-xs font-mono font-bold ${DIFFICULTY_CONFIG[difficulty].color}`}>
                  {DIFFICULTY_CONFIG[difficulty].label}
                </span>
             </div>
             
             <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 shadow-[0_0_10px_currentColor]"
                  style={{ width: `${Math.max(5, speedProgress)}%` }}
                />
             </div>
             
             <div className="w-12 text-right text-[10px] text-gray-500 font-mono">
                {Math.round(speedProgress)}% MAX
             </div>
        </div>

        <GameBoard snake={snake} food={food} status={status} />

        <Controls 
          status={status}
          difficulty={difficulty}
          onStart={actions.startGame}
          onPause={actions.pauseGame}
          onRestart={actions.restartGame}
          onDirectionChange={actions.handleDirectionInput}
          onDifficultyChange={actions.setDifficulty}
        />
      </div>

      {/* Right Column: AI Commentary */}
      <div className="w-full md:w-auto flex flex-col gap-4">
         <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg">
            <h3 className="flex items-center gap-2 font-mono font-bold text-neon-green mb-2">
               <Zap size={18} /> POWERED BY GEMINI
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
              NeonBit watches your gameplay and reacts in real-time using the Google Gemini API. 
              Try to impress it!
            </p>
         </div>
         <CommentaryPanel messages={messages} />
      </div>

    </div>
  );
};

export default App;