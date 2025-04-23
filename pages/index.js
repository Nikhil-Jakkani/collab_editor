
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
import Head from "next/head";
import RoomList from "../components/RoomList";

export default function Home() {
    const [roomId, setRoomId] = useState("");
    const [username, setUsername] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [theme, setTheme] = useState("dark");
    const router = useRouter();

    useEffect(() => {
        // Check for stored username
        const storedUsername = localStorage.getItem("code-collab-username");
        if (storedUsername) {
            setUsername(storedUsername);
        }
        
        // Add animation class to body after component mounts
        document.body.classList.add("bg-animated");
        
        return () => {
            document.body.classList.remove("bg-animated");
        };
    }, []);

    const generateRoomId = () => {
        const newRoomId = uuidv4();
        setRoomId(newRoomId);

        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
            navigator.clipboard.writeText(newRoomId)
                .then(() => toast.success("Room ID copied to clipboard!"))
                .catch(() => toast.error("Copy manually: " + newRoomId));
        } else {
            // Fallback for unsupported browsers
            const textArea = document.createElement("textarea");
            textArea.value = newRoomId;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand("copy");
                toast.success("Room ID copied to clipboard!");
            } catch {
                toast.error("Copy manually: " + newRoomId);
            }
            document.body.removeChild(textArea);
        }
    };

    const joinRoom = () => {
        if (!username) {
            toast.error("Please enter a username");
            return;
        }
        
        if (!roomId) {
            toast.error("Please enter a room ID");
            return;
        }
        
        // Save username to localStorage
        localStorage.setItem("code-collab-username", username);
        
        setIsLoading(true);
        router.push(`/editor/${roomId}?username=${username}`);
    };

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-4 relative ${theme === "dark" ? "bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900" : "bg-gradient-to-br from-blue-50 via-indigo-100 to-blue-50"}`}>
            <Head>
                <title>Collaborative Code Editor</title>
                <meta name="description" content="Real-time collaborative code editor for seamless pair programming" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            
            {/* Theme toggle button in top right corner */}
            <button 
                onClick={toggleTheme} 
                className={`absolute top-4 right-4 p-3 rounded-full z-10 shadow-lg ${theme === "dark" ? "bg-gray-800 text-yellow-300 hover:bg-gray-700" : "bg-white text-blue-800 hover:bg-blue-50"} transition-all duration-300 flex items-center justify-center`}
                aria-label="Toggle theme"
            >
                {theme === "dark" ? "☀️" : "🌙"}
            </button>
            
            <div className={`relative w-full max-w-md p-8 rounded-2xl shadow-2xl backdrop-blur-sm ${theme === "dark" ? "bg-gray-800/70 text-white" : "bg-white/70 text-gray-800"} transition-all duration-300 transform hover:scale-[1.01]`}>
                
                <h1 className={`text-3xl font-bold mb-8 text-center ${theme === "dark" ? "text-gradient-purple" : "text-gradient-blue"}`}>
                    Collaborative Code Editor
                </h1>
                
                <div className="space-y-4">
                    <div className="relative">
                        <input
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={`w-full p-3 pl-10 rounded-lg border-2 focus:ring-2 focus:outline-none transition-all ${theme === "dark" ? "bg-gray-700 border-gray-600 focus:border-purple-500 focus:ring-purple-500/30" : "bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/30"}`}
                        />
                        <span className="absolute left-3 top-3.5">👤</span>
                    </div>
                    
                    <div className="relative">
                        <input
                            placeholder="Room ID"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            className={`w-full p-3 pl-10 rounded-lg border-2 focus:ring-2 focus:outline-none transition-all ${theme === "dark" ? "bg-gray-700 border-gray-600 focus:border-purple-500 focus:ring-purple-500/30" : "bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/30"}`}
                        />
                        <span className="absolute left-3 top-3.5">🔑</span>
                    </div>
                    
                    <div className="flex gap-4 mt-6">
                        <button 
                            onClick={joinRoom}
                            disabled={isLoading}
                            className={`flex-1 p-3 rounded-lg font-medium shadow-lg transform hover:translate-y-[-2px] active:translate-y-[1px] transition-all ${theme === "dark" ? "bg-purple-600 hover:bg-purple-500 active:bg-purple-700" : "bg-blue-600 hover:bg-blue-500 active:bg-blue-700"} text-white`}
                        >
                            {isLoading ? "Joining..." : "Join Room"}
                        </button>
                        
                        <button 
                            onClick={generateRoomId}
                            disabled={isLoading}
                            className={`flex-1 p-3 rounded-lg font-medium shadow-lg transform hover:translate-y-[-2px] active:translate-y-[1px] transition-all ${theme === "dark" ? "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700" : "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700"} text-white`}
                        >
                            Create Room
                        </button>
                    </div>
                </div>
                
                <div className={`mt-8 text-center text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    Create or join a room to start coding collaboratively across all browsers
                </div>
            </div>
            
            <div className="mt-8 w-full max-w-md">
                <RoomList theme={theme} username={username} />
            </div>
            
            <div className="floating-shapes">
                <div className="shape shape1"></div>
                <div className="shape shape2"></div>
                <div className="shape shape3"></div>
                <div className="shape shape4"></div>
            </div>
        </div>
    );
}

