import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import VoteCard from './components/VoteCard';
import Leaderboard from './components/Leaderboard';
import AddProfile from './components/AddProfile';
import { Profile, View } from './types';
import { INITIAL_PROFILES } from './constants';
import { calculateElo } from './services/eloService';
import { generateRoastOrPraise } from './services/geminiService';
import { Flame, RefreshCw, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [view, setView] = useState<View>('VOTE');
  const [currentPair, setCurrentPair] = useState<[Profile, Profile] | null>(null);
  const [voting, setVoting] = useState(false);
  const [aiComment, setAiComment] = useState<string>('');
  const [showComment, setShowComment] = useState(false);

  const pickRandomPair = useCallback(() => {
    if (profiles.length < 2) return;
    
    let idx1 = Math.floor(Math.random() * profiles.length);
    let idx2 = Math.floor(Math.random() * profiles.length);

    while (idx1 === idx2) {
      idx2 = Math.floor(Math.random() * profiles.length);
    }

    setCurrentPair([profiles[idx1], profiles[idx2]]);
    setShowComment(false);
  }, [profiles]);

  useEffect(() => {
    pickRandomPair();
  }, []);

  const handleVote = async (winnerId: string) => {
    if (!currentPair || voting) return;
    setVoting(true);

    const winner = currentPair.find(p => p.id === winnerId)!;
    const loser = currentPair.find(p => p.id !== winnerId)!;

    const { newRatingWinner, newRatingLoser } = calculateElo(winner.rating, loser.rating);
    const commentary = await generateRoastOrPraise(winner.name, loser.name, winner.major);
    
    setAiComment(commentary);
    setShowComment(true);

    setProfiles(prev => prev.map(p => {
      if (p.id === winner.id) {
        return { ...p, rating: newRatingWinner, wins: p.wins + 1, matches: p.matches + 1 };
      }
      if (p.id === loser.id) {
        return { ...p, rating: newRatingLoser, losses: p.losses + 1, matches: p.matches + 1 };
      }
      return p;
    }));

    setTimeout(() => {
      pickRandomPair();
      setVoting(false);
      setTimeout(() => setShowComment(false), 2500);
    }, 1000);
  };

  const handleAddProfile = (newProfile: Profile) => {
    setProfiles(prev => [...prev, newProfile]);
    setView('VOTE');
    setCurrentPair(prev => {
      if(!prev) return [newProfile, profiles[0]];
      return [prev[0], newProfile];
    });
  };

  return (
    <div className="flex flex-col h-full bg-bits-dark text-white overflow-hidden font-sans">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-6 md:pt-28 pb-24 md:pb-10 px-4 relative custom-scrollbar">
        
        {/* Header Logo for Mobile */}
        <div className="md:hidden flex justify-center mb-6">
           <div className="flex items-center gap-1">
             <span className="bg-bits-red text-white font-black text-sm px-1 py-0.5 italic transform -skew-x-12">BITS</span>
             <span className="font-black text-lg italic tracking-tight">MASH</span>
           </div>
        </div>

        {view === 'VOTE' && currentPair && (
          <div className="flex flex-col items-center justify-center min-h-[75vh] max-w-6xl mx-auto animate-fade-in">
             
             <div className="text-center mb-8 md:mb-12 relative z-10">
               <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter text-white drop-shadow-2xl leading-[0.85]">
                 WHO IS <br className="md:hidden" />
                 <span className="text-transparent bg-clip-text bg-gradient-to-b from-bits-red to-red-700 filter drop-shadow-[0_0_10px_rgba(234,29,36,0.5)]">HOTTER?</span>
               </h1>
             </div>

             <div className="flex flex-col md:flex-row gap-12 md:gap-20 w-full items-center justify-center relative">
               
               {/* VS Badge */}
               <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none hidden md:flex items-center justify-center">
                 <div className="bg-bits-black border-4 border-bits-red rounded-full w-16 h-16 flex items-center justify-center shadow-[0_0_30px_rgba(234,29,36,0.4)]">
                    <span className="font-black italic text-2xl text-white">VS</span>
                 </div>
               </div>

               <VoteCard 
                 profile={currentPair[0]} 
                 onVote={handleVote} 
                 disabled={voting}
               />
               
               {/* Mobile VS spacer */}
               <div className="md:hidden font-black italic text-2xl text-gray-700">VS</div>

               <VoteCard 
                 profile={currentPair[1]} 
                 onVote={handleVote} 
                 disabled={voting}
               />
             </div>

             <button 
               onClick={() => pickRandomPair()}
               className="mt-16 flex items-center gap-2 text-gray-600 hover:text-white transition-colors text-xs uppercase tracking-widest font-bold"
             >
               <RefreshCw className="w-3 h-3" /> Skip This Pair
             </button>
          </div>
        )}

        {view === 'LEADERBOARD' && (
          <Leaderboard profiles={profiles} />
        )}

        {view === 'ADD_PROFILE' && (
          <AddProfile onAdd={handleAddProfile} />
        )}
      </main>

      {/* AI Comment Toast */}
      {showComment && (
        <div className="fixed bottom-24 md:bottom-12 left-1/2 transform -translate-x-1/2 z-[60] w-[90%] max-w-md animate-bounce-short">
          <div className="bg-white text-black p-4 rounded-2xl font-bold shadow-2xl flex items-center gap-4 border-b-4 border-bits-red">
             <div className="bg-bits-red p-2 rounded-full text-white">
               <Zap className="w-5 h-5 fill-current" />
             </div>
             <div>
               <p className="text-[10px] uppercase tracking-wider font-black text-gray-400">The Tea ☕️</p>
               <p className="text-sm md:text-base leading-tight font-bold italic">"{aiComment}"</p>
             </div>
          </div>
        </div>
      )}

      <Navbar currentView={view} setView={setView} />
    </div>
  );
};

export default App;