// import { useRouter } from "next/router";
// import { useEffect, useState } from "react";
// import io from "socket.io-client";
// import Editor from "@monaco-editor/react";

// const socket = io("http://localhost:3001");

// export default function EditorPage() {
//     const router = useRouter();
//     const { roomId, username } = router.query;
//     const [code, setCode] = useState("");
//     const [users, setUsers] = useState([]);
//     const [language, setLanguage] = useState("javascript");

//     useEffect(() => {
//         if (!roomId || !username) return;
//         socket.emit("join-room", { roomId, username });

//         socket.on("update-code", (newCode) => setCode(newCode));
//         socket.on("room-users", (roomUsers) => setUsers(roomUsers));

//         return () => socket.disconnect();
//     }, [roomId, username]);

//     return (
//         <div className="flex flex-col h-screen bg-gray-900 text-white p-4">
//             <h2 className="text-lg font-bold">Room ID: {roomId}</h2>
//             <h3 className="text-md mb-2">Users: {users.join(", ")}</h3>
//             <select className="mb-2 p-2 bg-gray-700 text-white rounded" value={language} onChange={(e) => setLanguage(e.target.value)}>
//                 <option value="javascript">JavaScript</option>
//                 <option value="python">Python</option>
//                 <option value="cpp">C++</option>
//                 <option value="java">Java</option>
//             </select>
//             <Editor
//                 height="80vh"
//                 theme="vs-dark"
//                 language={language}
//                 value={code}
//                 onChange={(newCode) => {
//                     setCode(newCode);
//                     socket.emit("code-changed", { roomId, code: newCode });
//                 }}
//             />
//         </div>
//     );
// }


// collab_editor/pages/editor/[roomId].js

// collab_editor/pages/editor/[roomId].js

// collab_editor/pages/editor/[roomId].js

// collab_editor/pages/editor/[roomId].js

// collab_editor/pages/editor/[roomId].js

// collab_editor/pages/editor/[roomId].js

// collab_editor/pages/editor/[roomId].js

import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import dynamic from "next/dynamic";
import { toast } from "react-hot-toast";
import Head from "next/head";
import { Copy, ArrowLeft, Users, Settings, Code, Save, Download, Share2 } from "lucide-react";

// Dynamically import CodeMirror to ensure it only loads on the client side
const CodeMirror = dynamic(
  () => import("@uiw/react-codemirror").then((mod) => mod.default),
  { ssr: false }
);

// Dynamically import language support
const javascript = dynamic(
  () => import("@codemirror/lang-javascript").then((mod) => mod.default),
  { ssr: false }
);

// Dynamically import theme
const dracula = dynamic(
  () => import("@uiw/codemirror-theme-dracula").then((mod) => mod.default),
  { ssr: false }
);

// Initialize socket connection
let socket;

export default function EditorPage() {
    const router = useRouter();
    const { roomId, username } = router.query;
    const [code, setCode] = useState("");
    const [users, setUsers] = useState([]);
    const [language, setLanguage] = useState("javascript");
    const [theme, setTheme] = useState("dark");
    const [activeSection, setActiveSection] = useState("roomInfo");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const editorRef = useRef(null);

    // Initialize socket connection when component mounts
    useEffect(() => {
        if (!roomId || !username) return;
        
        // Initialize socket connection
        socket = io("http://localhost:3001", {
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            transports: ['websocket', 'polling'] // Ensure cross-browser compatibility
        });

        // Socket event handlers
        socket.on("connect", () => {
            setIsConnected(true);
            toast.success("Connected to server!");
            socket.emit("join-room", { roomId, username });
        });

        socket.on("connect_error", () => {
            toast.error("Connection error. Retrying...");
        });

        socket.on("disconnect", () => {
            setIsConnected(false);
            toast.error("Disconnected from server");
        });

        socket.on("update-code", (newCode) => {
            setCode(newCode);
        });

        socket.on("room-users", (roomUsers) => {
            setUsers(roomUsers);
            // Show toast when a new user joins
            if (roomUsers.length > users.length) {
                const newUser = roomUsers.find(user => !users.includes(user));
                if (newUser && newUser !== username) {
                    toast.success(`${newUser} joined the room`);
                }
            }
        });

        // Clean up on unmount
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [roomId, username]);

    // Handle code changes
    const handleCodeChange = (value) => {
        setCode(value);
        if (socket && isConnected) {
            socket.emit("code-changed", { roomId, code: value });
        }
    };

    // Copy room ID to clipboard with browser compatibility
    const copyRoomId = () => {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
            navigator.clipboard.writeText(roomId)
                .then(() => toast.success("Room ID copied to clipboard!"))
                .catch(() => {
                    // Fallback for browsers that don't support clipboard API
                    fallbackCopyToClipboard(roomId);
                });
        } else {
            fallbackCopyToClipboard(roomId);
        }
    };

    // Fallback copy method for older browsers
    const fallbackCopyToClipboard = (text) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";  // Avoid scrolling to bottom
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand("copy");
            if (successful) {
                toast.success("Room ID copied to clipboard!");
            } else {
                toast.error("Failed to copy: " + text);
            }
        } catch (err) {
            toast.error("Failed to copy: " + text);
        }

        document.body.removeChild(textArea);
    };

    // Save code to local storage
    const saveCode = () => {
        try {
            localStorage.setItem(`code-collab-${roomId}`, code);
            setLastSaved(new Date());
            toast.success("Code saved to browser storage");
        } catch (error) {
            toast.error("Failed to save code");
        }
    };

    // Download code as a file
    const downloadCode = () => {
        const fileExtension = getFileExtension();
        const blob = new Blob([code], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `collaborative-code${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Code downloaded");
    };

    // Get file extension based on language
    const getFileExtension = () => {
        switch (language) {
            case "javascript": return ".js";
            case "python": return ".py";
            case "cpp": return ".cpp";
            case "java": return ".java";
            default: return ".txt";
        }
    };

    // Share room link
    const shareRoom = () => {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: "Join my coding room",
                text: `Join my collaborative coding session with username: ${username} and room ID: ${roomId}`,
                url: url,
            })
            .then(() => toast.success("Shared successfully"))
            .catch(() => toast.error("Error sharing"));
        } else {
            copyToClipboard(url);
            toast.success("Room URL copied to clipboard!");
        }
    };

    // Copy text to clipboard
    const copyToClipboard = (text) => {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
            navigator.clipboard.writeText(text);
        } else {
            fallbackCopyToClipboard(text);
        }
    };

    // Return to home
    const goToHome = () => {
        router.push("/");
    };

    // Get language extension for CodeMirror
    const getLanguageExtension = () => {
        switch (language) {
            case "javascript":
                return javascript();
            default:
                return javascript();
        }
    };

    // Toggle theme
    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    return (
        <div className={`flex flex-col md:flex-row h-screen relative ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}>
            <Head>
                <title>Collaborative Editor - Room {roomId}</title>
                <meta name="description" content="Real-time collaborative code editor" />
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
            </Head>
            
            {/* Theme toggle button in top right corner */}
            <button 
                onClick={toggleTheme} 
                className={`absolute top-4 right-4 p-3 rounded-full z-50 shadow-lg ${theme === "dark" ? "bg-gray-800 text-yellow-300 hover:bg-gray-700" : "bg-white text-blue-800 hover:bg-blue-50"} transition-all duration-300 flex items-center justify-center`}
                aria-label="Toggle theme"
            >
                {theme === "dark" ? "☀️" : "🌙"}
            </button>
            
            {/* Mobile Header */}
            <div className={`md:hidden flex items-center justify-between p-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"} border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                <button 
                    onClick={goToHome}
                    className={`p-2 rounded-full ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-semibold truncate">Room: {roomId}</h1>
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className={`p-2 rounded-full ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
                >
                    <Settings size={20} />
                </button>
            </div>

            {/* Sidebar - Hidden on mobile unless menu is open */}
            <div 
                className={`${isMobileMenuOpen ? "fixed inset-0 z-50" : "hidden"} md:relative md:block md:w-80 ${theme === "dark" ? "bg-gray-800" : "bg-white"} md:shadow-xl transition-all duration-300 ease-in-out`}
            >
                {/* Mobile menu close button */}
                <div className="md:hidden flex justify-end p-4">
                    <button 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`p-2 rounded-full ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
                    >
                        ✕
                    </button>
                </div>
                
                {/* Sidebar content */}
                <div className="p-6 h-full flex flex-col">
                    {/* Connection status indicator */}
                    <div className="flex items-center gap-2 mb-6">
                        <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"} animate-pulse`}></div>
                        <span className={`text-sm ${isConnected ? "text-green-400" : "text-red-400"}`}>
                            {isConnected ? "Connected" : "Disconnected"}
                        </span>
                    </div>
                    
                    {/* Navigation */}
                    <nav className="space-y-2 mb-6">
                        <button
                            className={`w-full p-3 rounded-lg text-left flex items-center gap-3 transition-colors ${activeSection === "roomInfo" ? (theme === "dark" ? "bg-gray-700" : "bg-gray-200") : (theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200")}`}
                            onClick={() => setActiveSection("roomInfo")}
                        >
                            <Code size={18} />
                            <span>Room Info</span>
                        </button>
                        <button
                            className={`w-full p-3 rounded-lg text-left flex items-center gap-3 transition-colors ${activeSection === "participants" ? (theme === "dark" ? "bg-gray-700" : "bg-gray-200") : (theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200")}`}
                            onClick={() => setActiveSection("participants")}
                        >
                            <Users size={18} />
                            <span>Participants ({users.length})</span>
                        </button>
                        <button
                            className={`w-full p-3 rounded-lg text-left flex items-center gap-3 transition-colors ${activeSection === "settings" ? (theme === "dark" ? "bg-gray-700" : "bg-gray-200") : (theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200")}`}
                            onClick={() => setActiveSection("settings")}
                        >
                            <Settings size={18} />
                            <span>Settings</span>
                        </button>
                    </nav>

                    {/* Section content */}
                    <div className="flex-grow overflow-y-auto">
                        {activeSection === "roomInfo" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className={`text-lg font-bold mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Username</h2>
                                    <div className={`p-3 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} shadow-inner`}>
                                        {username}
                                    </div>
                                </div>
                                
                                <div>
                                    <h2 className={`text-lg font-bold mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Room ID</h2>
                                    <div className="flex items-center gap-2">
                                        <div className={`flex-grow p-3 rounded-lg truncate ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} shadow-inner`}>
                                            {roomId}
                                        </div>
                                        <button 
                                            onClick={copyRoomId} 
                                            className={`p-2 rounded-full ${theme === "dark" ? "bg-blue-600 hover:bg-blue-500" : "bg-blue-500 hover:bg-blue-400"} transition-colors`}
                                            aria-label="Copy room ID"
                                        >
                                            <Copy size={18} />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="pt-4 space-y-3">
                                    <button 
                                        onClick={saveCode}
                                        className={`w-full p-3 rounded-lg flex items-center justify-center gap-2 ${theme === "dark" ? "bg-green-600 hover:bg-green-500" : "bg-green-500 hover:bg-green-400"} transition-colors`}
                                    >
                                        <Save size={18} />
                                        <span>Save Locally</span>
                                    </button>
                                    
                                    <button 
                                        onClick={downloadCode}
                                        className={`w-full p-3 rounded-lg flex items-center justify-center gap-2 ${theme === "dark" ? "bg-purple-600 hover:bg-purple-500" : "bg-purple-500 hover:bg-purple-400"} transition-colors`}
                                    >
                                        <Download size={18} />
                                        <span>Download</span>
                                    </button>
                                    
                                    <button 
                                        onClick={shareRoom}
                                        className={`w-full p-3 rounded-lg flex items-center justify-center gap-2 ${theme === "dark" ? "bg-indigo-600 hover:bg-indigo-500" : "bg-indigo-500 hover:bg-indigo-400"} transition-colors`}
                                    >
                                        <Share2 size={18} />
                                        <span>Share Room</span>
                                    </button>
                                </div>
                                
                                {lastSaved && (
                                    <div className={`text-xs text-center ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                                        Last saved: {lastSaved.toLocaleTimeString()}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeSection === "participants" && (
                            <div className="space-y-4">
                                <h3 className={`text-lg font-semibold mb-3 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Participants</h3>
                                {users.length === 0 ? (
                                    <div className={`text-center p-4 rounded-lg ${theme === "dark" ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-500"}`}>
                                        No participants yet
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {users.map((user, index) => (
                                            <div 
                                                key={index} 
                                                className={`flex items-center gap-3 p-3 rounded-xl shadow-lg ${user === username ? 
                                                    (theme === "dark" ? "bg-gradient-to-r from-blue-600 to-indigo-600" : "bg-gradient-to-r from-blue-400 to-indigo-400") : 
                                                    (theme === "dark" ? "bg-gray-700" : "bg-gray-200")}`}
                                            >
                                                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                                <span className={`${user === username ? "font-semibold" : ""}`}>
                                                    {user} {user === username && "(you)"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeSection === "settings" && (
                            <div className="space-y-6">
                                <div>
                                    <label className={`block text-sm mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Language:</label>
                                    <select
                                        className={`w-full p-3 rounded-lg ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                    >
                                        <option value="javascript">JavaScript</option>
                                        <option value="python">Python</option>
                                        <option value="cpp">C++</option>
                                        <option value="java">Java</option>
                                    </select>
                                </div>
                                

                                
                                <div className="pt-4">
                                    <button
                                        className={`w-full p-3 rounded-lg ${theme === "dark" ? "bg-red-600 hover:bg-red-500" : "bg-red-500 hover:bg-red-400"} transition-colors`}
                                        onClick={goToHome}
                                    >
                                        Leave Room
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Editor Section */}
            <div className="flex-grow overflow-hidden">
                {typeof window !== "undefined" && (
                    <CodeMirror
                        value={code}
                        height="100%"
                        theme={theme === "dark" ? dracula : "light"}
                        extensions={[getLanguageExtension()]}
                        onChange={handleCodeChange}
                        className="h-full text-base"
                        basicSetup={{
                            lineNumbers: true,
                            highlightActiveLineGutter: true,
                            highlightSpecialChars: true,
                            history: true,
                            foldGutter: true,
                            drawSelection: true,
                            dropCursor: true,
                            allowMultipleSelections: true,
                            indentOnInput: true,
                            syntaxHighlighting: true,
                            bracketMatching: true,
                            closeBrackets: true,
                            autocompletion: true,
                            rectangularSelection: true,
                            crosshairCursor: true,
                            highlightActiveLine: true,
                            highlightSelectionMatches: true,
                            closeBracketsKeymap: true,
                            searchKeymap: true,
                            foldKeymap: true,
                            completionKeymap: true,
                            lintKeymap: true,
                        }}
                    />
                )}
            </div>
        </div>
    );
}

