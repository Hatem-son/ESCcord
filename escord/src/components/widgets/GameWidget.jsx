import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAppContext } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Gamepad2, RotateCcw, Users } from 'lucide-react'

const DEFAULT_CHANNEL_ID = '33333333-3333-3333-3333-333333333333'
const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6]             // Diagonals
]

export function GameWidget() {
  const { currentGroup } = useAppContext()
  const { user, profile } = useAuth()
  const channelId = currentGroup?.id
  const [gameState, setGameState] = useState(null)

  if (!currentGroup) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#09090b]/40 backdrop-blur-sm p-6 text-center">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10 shadow-lg">
          <Gamepad2 className="w-8 h-8 text-[#10b981]" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Tic-Tac-Toe HQ</h3>
        <p className="text-white/40 text-sm max-w-xs">Select a server from the sidebar to challenge friends.</p>
      </div>
    )
  }

  useEffect(() => {
    if (!channelId || !user) return

    const fetchGame = async () => {
      let { data } = await supabase.from('game_states').select('*').eq('channel_id', channelId).limit(1).maybeSingle()
      if (!data) {
        const { data: newGame } = await supabase.from('game_states').insert({ channel_id: channelId }).select().limit(1).maybeSingle()
        data = newGame
      }
      setGameState(data)
    }
    fetchGame()

    const channel = supabase.channel(`game:${channelId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_states', filter: `channel_id=eq.${channelId}` }, 
        (payload) => setGameState(payload.new)
      ).subscribe()

    return () => supabase.removeChannel(channel)
  }, [channelId, user])

  const joinGame = async () => {
    if (!gameState || !user) return
    const players = gameState.players || []
    if (players.length >= 2 || players.find(p => p.id === user.id)) return
    
    const newPlayers = [...players, { id: user.id, username: profile?.username, symbol: players.length === 0 ? 'X' : 'O' }]
    const updates = { players: newPlayers }
    if (newPlayers.length === 2) {
      updates.status = 'playing'
      updates.current_turn = newPlayers[0].id
    }
    
    await updateGame(updates)
  }

  const checkWinner = (board) => {
    for (let line of WIN_LINES) {
      const [a, b, c] = line
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a]
      }
    }
    return null
  }

  const makeMove = async (index) => {
    if (!gameState || gameState.status !== 'playing') return
    if (gameState.current_turn !== user.id) return
    if (gameState.board[index] !== "") return
    
    const newBoard = [...gameState.board]
    const myPlayer = gameState.players.find(p => p.id === user.id)
    newBoard[index] = myPlayer.symbol
    
    const updates = { board: newBoard }
    const winnerSymbol = checkWinner(newBoard)
    
    if (winnerSymbol) {
      updates.status = 'finished'
      updates.winner = user.id
      triggerConfetti()
    } else if (!newBoard.includes("")) {
      updates.status = 'finished' // Draw
      updates.winner = null
    } else {
      const otherPlayer = gameState.players.find(p => p.id !== user.id)
      updates.current_turn = otherPlayer.id
    }
    
    await updateGame(updates)
  }

  const resetGame = async () => {
    await updateGame({
      board: ["","","","","","","","",""],
      status: 'playing',
      winner: null,
      current_turn: gameState.players[0].id
    })
  }

  const updateGame = async (updates) => {
    setGameState(prev => ({ ...prev, ...updates })) // Optimistic
    await supabase.from('game_states').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', gameState.id)
  }

  const triggerConfetti = () => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#10b981', '#8b5cf6', '#ef4444'] })
  }

  if (!gameState) return <div className="h-full flex items-center justify-center p-4"><Gamepad2 className="w-6 h-6 animate-pulse text-white/30" /></div>

  const isPlayer = gameState.players.find(p => p.id === user?.id)
  const isMyTurn = gameState.current_turn === user?.id
  const myPlayer = isPlayer

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-transparent relative overflow-hidden">
      
      {/* Top Status Bar */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
        <div className="flex gap-4 items-center">
           {gameState.players.map(p => (
             <div key={p.id} className={`flex items-center gap-2 ${gameState.current_turn === p.id ? 'text-[#10b981] font-bold' : 'text-white/50'}`}>
                <span className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-xs">{p.symbol}</span>
                {p.username}
             </div>
           ))}
           {gameState.players.length === 0 && <span className="text-sm text-white/50">Waiting for players...</span>}
           {gameState.players.length === 1 && <span className="text-sm text-white/50">Waiting for opponent...</span>}
        </div>
        {!isPlayer && gameState.players.length < 2 && (
          <button onClick={joinGame} className="glass-button text-sm px-4 py-1.5 rounded-lg bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30">Join Game</button>
        )}
      </div>

      {/* Game Board */}
      <div className="xox-grid w-full">
         {gameState.board.map((cell, i) => {
           let cellClass = "xox-cell"
           if (cell === 'X') cellClass += " x"
           if (cell === 'O') cellClass += " o"
           // Add "win" logic later if needed
           
           return (
             <motion.button
               key={i}
               disabled={gameState.status !== 'playing' || cell !== "" || !isMyTurn}
               onClick={() => makeMove(i)}
               className={cellClass}
               whileTap={{ scale: cell === "" && isMyTurn ? 0.9 : 1 }}
             >
               <AnimatePresence>
                 {cell && (
                   <motion.span
                     initial={{ scale: 0, rotate: -45 }}
                     animate={{ scale: 1, rotate: 0 }}
                     transition={{ type: "spring", stiffness: 400, damping: 25 }}
                   >
                     {cell}
                   </motion.span>
                 )}
               </AnimatePresence>
             </motion.button>
           )
         })}
      </div>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {gameState.status === 'finished' && (
          <motion.div 
            key="game-over"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-10 glass-card px-8 py-6 text-center border-[#10b981]/30 shadow-[0_10px_40px_rgba(16,185,129,0.2)]"
          >
            <h2 className="text-2xl font-bold mb-2">
              {gameState.winner ? (gameState.winner === user?.id ? '🎉 You Won!' : '💀 You Lost') : '🤝 Draw'}
            </h2>
            <button 
              onClick={resetGame}
              className="mt-4 glass-button bg-[#10b981] hover:bg-[#34d399] border-none text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
