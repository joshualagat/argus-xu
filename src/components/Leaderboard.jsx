import React from 'react';
import { getLeaderboardData } from '../sheetsManager.js';
import { Trophy, Activity, Network } from 'lucide-react';



/**
 * Server Component specifically engineered for the "Bitcoin DeFi" Design System.
 * Expects Tailwind configured with standard arbitrary values, lucide-react, 
 * and Space Grotesk/Inter/JetBrains Mono fonts defined in the global CSS.
 */
export default async function Leaderboard() {
    // 1. Fetch exact data structure strictly from Google Sheets Backend
    const rawData = await getLeaderboardData();
    const leaderboardArr = rawData[0]?.LEADERBOARD || [];

    return (
        <section className="relative w-full min-h-screen mx-auto py-24 px-4 sm:px-6 lg:px-8 bg-[#030304] overflow-hidden">
            {/* The signature Grid Pattern Vignette background */}
            <div 
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                    backgroundSize: '50px 50px',
                    backgroundImage: `
                        linear-gradient(to right, rgba(30, 41, 59, 0.5) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(30, 41, 59, 0.5) 1px, transparent 1px)
                    `,
                    maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
                }}
            />

            {/* Ambient Radial Gradient Blur (Bitcoin Orange) */}
            <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#F7931A] rounded-full opacity-5 blur-[120px] pointer-events-none z-0" />

            {/* The Main "Block" Container (Glassmorphic Card) */}
            <div className="relative z-10 w-full max-w-4xl mx-auto bg-[#0F1115]/90 backdrop-blur-lg border border-white/10 rounded-2xl shadow-[0_0_50px_-10px_rgba(247,147,26,0.1)] overflow-hidden transition-all duration-300 hover:border-[#F7931A]/30">
                
                {/* Header Section */}
                <div className="p-8 pb-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {/* Glowing Holographic Node Icon */}
                        <div className="flex items-center justify-center p-3 rounded-lg bg-[#EA580C]/20 border border-[#EA580C]/50 shadow-[0_0_20px_rgba(234,88,12,0.4)]">
                            <Trophy className="w-6 h-6 text-[#F7931A]" />
                        </div>
                        <div>
                            <h2 className="font-heading font-semibold text-2xl md:text-4xl tracking-tight text-white flex items-center gap-3">
                                RANKING LEDGER
                                {/* Pulsing Live Network Indicator */}
                                <span className="relative flex h-3 w-3 mt-1">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD600] opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#F7931A]"></span>
                                </span>
                            </h2>
                            <p className="text-[#94A3B8] font-body text-sm mt-2 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-[#F7931A]" /> 
                                Live Sync • Scanning Top 5 Traders by Total Account Equity
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content Section (List) */}
                <div className="p-8 pt-6 flex flex-col gap-4">
                    {leaderboardArr.length === 0 ? (
                        <div className="text-center py-12 text-[#94A3B8] font-mono tracking-wider border border-white/10 rounded-xl bg-black/40">
                            AWAITING INITIAL NETWORK SYNCHRONIZATION...
                        </div>
                    ) : (
                        leaderboardArr.map((user, index) => {
                            const isFirstPlace = index === 0;
                            const positionStr = user["POSITION"]; 
                            const username = user["USERNAMES"];
                            const balanceRaw = user["ACCOUNT BALANACE"]; // Safely parsing the requested typo key

                            const cleanBalance = balanceRaw || 0;
                            // Clean number formatting with JetBrains Mono precision
                            const formattedBalance = typeof cleanBalance === 'number' 
                                ? cleanBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                                : (String(cleanBalance).includes('$') ? String(cleanBalance) : `$${parseFloat(cleanBalance).toLocaleString('en-US') || String(cleanBalance)}`);

                            return (
                                <div 
                                    key={`rank-${index}-${username}`}
                                    className={`
                                        group relative flex items-center justify-between p-4 sm:p-6 rounded-xl border transition-all duration-300
                                        ${isFirstPlace 
                                            ? 'bg-gradient-to-r from-[#EA580C]/10 to-[#F7931A]/5 border-[#F7931A]/50 shadow-[0_0_20px_rgba(255,214,0,0.15)] scale-105 z-10 my-4' 
                                            : 'bg-black/40 border-white/5 opacity-80 hover:opacity-100 hover:scale-[1.02] hover:border-[#F7931A]/30 hover:shadow-[0_0_30px_-10px_rgba(247,147,26,0.2)]'
                                        }
                                    `}
                                >
                                    {/* Left Side: Mathematical Rank & Name */}
                                    <div className="flex items-center gap-4 sm:gap-6">
                                        <div className={`
                                            font-mono text-xl sm:text-3xl font-bold tracking-widest w-16 text-center
                                            ${isFirstPlace ? 'bg-gradient-to-br from-[#F7931A] to-[#FFD600] bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(255,214,0,0.5)]' : 'text-[#94A3B8]'}
                                        `}>
                                            {positionStr}
                                        </div>
                                        
                                        <div className="flex flex-col">
                                            <span className="font-body font-medium text-white text-lg sm:text-xl truncate max-w-[140px] sm:max-w-xs block">
                                                {username}
                                            </span>
                                            {isFirstPlace && (
                                                <span className="text-xs uppercase tracking-widest font-mono font-medium text-[#F7931A] mt-1 shadow-[0_0_10px_rgba(247,147,26,0.2)]">
                                                    Apex Node
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Side: Exact Equity Value */}
                                    <div className="flex items-center">
                                        <span className={`
                                            font-mono text-xl sm:text-3xl tracking-wider
                                            ${isFirstPlace ? 'bg-gradient-to-r from-[#F7931A] to-[#FFD600] bg-clip-text text-transparent' : 'text-white'}
                                        `}>
                                            {formattedBalance}
                                        </span>
                                    </div>

                                    {/* Precision Accent Decoration (Corner Borders - hover reveal!) */}
                                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l opacity-0 group-hover:opacity-100 border-[#F7931A] rounded-tl-xl transition-opacity duration-300" />
                                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r opacity-0 group-hover:opacity-100 border-[#F7931A] rounded-br-xl transition-opacity duration-300" />
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </section>
    );
}
