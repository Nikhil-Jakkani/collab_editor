import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Users, ArrowRight, Clock } from 'lucide-react';

export default function RoomList({ theme = 'dark', username }) {
    const [recentRooms, setRecentRooms] = useState([]);
    const [activeRooms, setActiveRooms] = useState([]);
    const router = useRouter();

    useEffect(() => {
        // Load recent rooms from localStorage
        try {
            const storedRooms = localStorage.getItem('code-collab-recent-rooms');
            if (storedRooms) {
                const rooms = JSON.parse(storedRooms);
                setRecentRooms(rooms);
            }
            
            // In a real app, you might fetch active rooms from the server
            // For demo, we'll use some sample data
            setActiveRooms([
                { id: '1a2b3c', users: ['Alice', 'Bob'], language: 'javascript', lastActive: new Date() },
                { id: '4d5e6f', users: ['Charlie', 'Dave'], language: 'python', lastActive: new Date(Date.now() - 1000 * 60 * 5) },
                { id: '7g8h9i', users: ['Eve'], language: 'java', lastActive: new Date(Date.now() - 1000 * 60 * 15) },
            ]);
        } catch (error) {
            console.error('Error loading recent rooms:', error);
        }
    }, []);

    const joinRoom = (roomId) => {
        if (username) {
            router.push(`/editor/${roomId}?username=${username}`);
        } else {
            alert('Please enter a username first');
        }
    };

    const formatTime = (date) => {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        
        return date.toLocaleDateString();
    };

    return (
        <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-sm shadow-lg`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                <Users size={18} />
                <span>Available Rooms</span>
            </h3>
            
            {activeRooms.length > 0 ? (
                <div className="space-y-3">
                    {activeRooms.map((room) => (
                        <div 
                            key={room.id} 
                            className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors cursor-pointer flex justify-between items-center`}
                            onClick={() => joinRoom(room.id)}
                        >
                            <div>
                                <div className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                                    Room: {room.id.substring(0, 6)}
                                </div>
                                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {room.users.length} user{room.users.length !== 1 ? 's' : ''} • {room.language}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs flex items-center gap-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <Clock size={12} />
                                    {formatTime(room.lastActive)}
                                </span>
                                <ArrowRight size={16} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={`text-center py-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    No active rooms found
                </div>
            )}
            
            {recentRooms.length > 0 && (
                <div className="mt-6">
                    <h4 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Recent Rooms
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {recentRooms.map((room) => (
                            <button 
                                key={room.id} 
                                onClick={() => joinRoom(room.id)}
                                className={`text-xs px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} transition-colors`}
                            >
                                {room.id.substring(0, 6)}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
