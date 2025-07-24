import React, { useEffect, useRef, useState, useCallback } from "react";
import Avatar from '../../assets/avatar.png';
import io from 'socket.io-client';

const DashBoard = () => {
    const [conversation, setConversation] = useState([]);
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [currentChatInfo, setCurrentChatInfo] = useState({ receiver: null, conversationId: null });
    const [messageInput, setMessageInput] = useState('');
    const [socket, setSocket] = useState(null);
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [isIconSidebarOpen, setIsIconSidebarOpen] = useState(false);
    const messageRef = useRef(null);

    // Effect to load logged-in user details from localStorage
    useEffect(() => {
        const userDetails = localStorage.getItem('user:details');
        if (userDetails) {
            try {
                setLoggedInUser(JSON.parse(userDetails));
            } catch (error) {
                console.error("Failed to parse user details from localStorage:", error);
                localStorage.removeItem('user:details');
                localStorage.removeItem('user:token');
            }
        }
    }, []);

    // Effect to initialize Socket.IO connection
    useEffect(() => {
        const newSocket = io('https://chat-server-vi4d.onrender.com', {
            transports: ['websocket'],
            withCredentials: true
        });
        setSocket(newSocket);
        return () => {
            newSocket.disconnect();
        };
    }, []);

    // Callback to fetch all users from the API
    const fetchAllUsers = useCallback(async () => {
        if (!loggedInUser) return;
        try {
            const res = await fetch('https://chat-server-vi4d.onrender.com/api/users', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error(`Error fetching users: ${res.status} ${await res.text()}`);
            const resData = await res.json();
            setUsers(resData.filter(user => user.id !== loggedInUser.id));
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    }, [loggedInUser]);

    // Callback to fetch conversations for the logged-in user
    const fetchUserConversations = useCallback(async () => {
        if (!loggedInUser?._id && !loggedInUser?.id) {
            setConversation([]);
            return;
        }
        const userId = loggedInUser._id || loggedInUser.id;
        try {
            const res = await fetch(`https://chat-server-vi4d.onrender.com/api/conversation/${userId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error(`Error fetching conversation: ${res.status} ${await res.text()}`);
            const resData = await res.json();
            setConversation(Array.isArray(resData) ? resData : []);
        } catch (error) {
            console.error('Failed to fetch conversation:', error);
            setConversation([]);
        }
    }, [loggedInUser]);

    // Effect for Socket.IO events (addUser, getUsers, getMessage)
    useEffect(() => {
        const currentUserId = loggedInUser?._id || loggedInUser?.id;
        if (socket && currentUserId) {
            socket.emit('addUser', currentUserId);
            socket.on('getUsers', (activeUsers) => {
                setOnlineUsers(new Set(activeUsers.map(user => user.userId)));
            });
            socket.on('getMessage', data => {
                if (data.senderId === currentUserId) return;
                setCurrentChatInfo(prevChatInfo => {
                    const isMessageForCurrentConversation =
                        prevChatInfo.receiver &&
                        (
                            (data.senderId === prevChatInfo.receiver.receiverId && data.receiverId === currentUserId) ||
                            (data.receiverId === prevChatInfo.receiver.receiverId && data.senderId === currentUserId)
                        ) &&
                        (prevChatInfo.conversationId === data.conversationId);
                    if (isMessageForCurrentConversation) {
                        setMessages(prevMsgs => {
                            const isDuplicate = prevMsgs.some(
                                m => m.message === data.message && m.user?.id === data.user?.id && m.createdAt === data.createdAt
                            );
                            if (!isDuplicate) {
                                return [...prevMsgs, { user: data.user, message: data.message, createdAt: data.createdAt || new Date().toISOString() }];
                            }
                            return prevMsgs;
                        });
                        return prevChatInfo;
                    } else {
                        fetchUserConversations();
                        return prevChatInfo;
                    }
                });
            });
            return () => {
                socket.off('getMessage');
                socket.off('getUsers');
            };
        }
    }, [socket, loggedInUser, fetchUserConversations]);

    useEffect(() => {
        if (loggedInUser) fetchAllUsers();
    }, [loggedInUser, fetchAllUsers]);

    useEffect(() => {
        fetchUserConversations();
    }, [fetchUserConversations]);

    // Callback to fetch messages for a specific conversation or start a new one
    const fetchMessages = useCallback(async (selectedConversationId, userDetails) => {
        if (!loggedInUser || (!loggedInUser._id && !loggedInUser.id) || !userDetails?.receiverId || !userDetails?.fullName) {
            console.error("Invalid user or receiver details");
            return;
        }
        setIsIconSidebarOpen(false);
        setCurrentChatInfo({ receiver: userDetails, conversationId: selectedConversationId });
        setMessages([]);
        let url = selectedConversationId === 'new'
            ? `https://chat-server-vi4d.onrender.com/api/conversation/check?senderId=${loggedInUser.id}&receiverId=${userDetails.receiverId}`
            : `https://chat-server-vi4d.onrender.com/api/message/${selectedConversationId}`;
        try {
            const res = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error(`Network response was not ok: ${await res.text()}`);
            const resData = await res.json();
            if (selectedConversationId === 'new' && resData.conversationId) {
                setCurrentChatInfo(prev => ({ ...prev, conversationId: resData.conversationId }));
                const messagesRes = await fetch(`https://chat-server-vi4d.onrender.com/api/message/${resData.conversationId}`);
                if (messagesRes.ok) setMessages(await messagesRes.json());
                else setMessages([]);
                fetchUserConversations();
            } else {
                setMessages(Array.isArray(resData) ? resData : []);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            setMessages([]);
        }
    }, [loggedInUser, fetchUserConversations]);

    // Effect to scroll to the latest message
    useEffect(() => {
        if (messageRef.current) {
            const timer = setTimeout(() => {
                messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!messageInput.trim() || !currentChatInfo.receiver || !loggedInUser) return;
        const senderId = loggedInUser._id || loggedInUser.id;
        const receiverId = currentChatInfo.receiver.receiverId;
        const messageText = messageInput.trim();
        const payload = {
            conversationId: currentChatInfo.conversationId === 'new' ? undefined : currentChatInfo.conversationId,
            senderId,
            message: messageText,
            receiverId
        };
        try {
            const res = await fetch(`https://chat-server-vi4d.onrender.com/api/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(`Failed to save message: ${await res.text()}`);
            const resData = await res.json();
            if (currentChatInfo.conversationId === 'new' && resData.conversationId) {
                setCurrentChatInfo(prev => ({ ...prev, conversationId: resData.conversationId }));
                fetchUserConversations();
            }
            socket.emit('sendMessage', {
                senderId,
                receiverId,
                message: messageText,
                conversationId: resData.conversationId || currentChatInfo.conversationId,
                user: { id: senderId, fullName: loggedInUser.fullName, email: loggedInUser.email }
            });
            setMessages(prev => [
                ...prev,
                { user: { id: senderId, fullName: loggedInUser.fullName, email: loggedInUser.email }, message: messageText, createdAt: new Date().toISOString() }
            ]);
            setMessageInput('');
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleSearch = (e) => setSearchQuery(e.target.value);

    const toggleIconSidebar = () => setIsIconSidebarOpen(!isIconSidebarOpen);

    if (!loggedInUser) {
        return <div className="text-center text-xl mt-20 text-gray-300">Loading user details or not logged in...</div>;
    }

    return (
        <div className="w-full h-screen flex flex-col lg:flex-row bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 overflow-hidden">
            {/* Hamburger Menu Button - Only shown when no chat is selected */}
            {!currentChatInfo.receiver && (
                <button
                    className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-700 rounded-lg"
                    onClick={toggleIconSidebar}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            )}

            {/* Icon Sidebar */}
            <div className={`lg:w-[80px] w-16 h-full bg-[#1f2937] flex flex-col items-center py-4 space-y-6 z-50 transform ${isIconSidebarOpen ? 'translate-x-0 fixed' : '-translate-x-full fixed'} lg:translate-x-0 transition-transform duration-300 flex-shrink-0`}>
                {isIconSidebarOpen && (
                    <button
                        className="lg:hidden absolute top-4 right-4 p-2 bg-gray-700 rounded-lg"
                        onClick={toggleIconSidebar}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
                <div className="relative group mt-12 lg:mt-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-300" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <circle cx="12" cy="7" r="4" />
                        <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
                    </svg>
                    <span className="absolute left-12 top-1/2 transform -translate-y-1/2 bg-gray-700 text-yellow-300 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Account</span>
                </div>
                <div className="relative group">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-300" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <circle cx="12" cy="16" r="1" />
                        <path d="M8 11v-4a4 4 0 0 1 8 0v4" />
                    </svg>
                    <span className="absolute left-12 top-1/2 transform -translate-y-1/2 bg-gray-700 text-yellow-300 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Privacy</span>
                </div>
                <div className="relative group">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-300" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 17l0 .01" />
                        <path d="M12 13.5a1.5 1.5 0 0 1 1 -1.5a2.6 2.6 0 1 0 -3 -4" />
                    </svg>
                    <span className="absolute left-12 top-1/2 transform -translate-y-1/2 bg-gray-700 text-yellow-300 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Help</span>
                </div>
                <div className="relative group">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-300" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .645 2.825 .436 3.35 0z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span className="absolute left-12 top-1/2 transform -translate-y-1/2 bg-gray-700 text-yellow-300 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Settings</span>
                </div>
            </div>

            {/* Main Content Wrapper */}
            <div className={`flex-1 flex flex-col lg:flex-row ${isIconSidebarOpen ? 'hidden' : 'flex'} w-full lg:ml-[80px]`}>
                {/* Conversations Sidebar */}
                <div className={`lg:w-1/3 w-full bg-gray-900 p-4 flex-col flex-shrink-0 hidden lg:flex ${currentChatInfo.receiver ? 'hidden' : 'flex'}`}>
                    <div className="flex items-center mb-4">
                        <div className="border-2 border-indigo-500 rounded-full p-1 relative">
                            <img src={Avatar} className="rounded-full w-12 h-12 sm:w-14 sm:h-14" alt="User Avatar" />
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 bg-green-500"></span>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-lg sm:text-xl font-semibold text-yellow-300">{loggedInUser.fullName}</h3>
                            <p className="text-xs sm:text-sm text-yellow-400">{loggedInUser.email}</p>
                        </div>
                    </div>
                    <input
                        type="text"
                        className="w-full bg-gray-700 text-yellow-300 border-0 h-10 rounded-lg px-4 outline-none focus:ring-2 focus:ring-yellow-500 mb-4"
                        value={searchQuery}
                        onChange={handleSearch}
                        placeholder="Search users..."
                    />
                    <div className="flex space-x-2 mb-4">
                        {['All', 'Unread', 'Favorite', 'Groups'].map((label) => (
                            <button
                                key={label}
                                className="flex-1 bg-gray-700 text-yellow-300 text-xs sm:text-sm py-2 rounded-lg hover:bg-gray-600 focus:bg-yellow-500 focus:text-gray-900 transition-colors"
                                onClick={() => console.log(`${label} clicked`)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <hr className="border-gray-700 mb-4" />
                    <div className="flex-grow overflow-y-auto">
                        <h2 className="text-lg font-semibold mb-3 text-yellow-300">Conversations</h2>
                        {conversation.length > 0 ? (
                            conversation.map(({ user, conversationId, unreadCount }) => {
                                const userIdForStatusCheck = user?.receiverId?.trim();
                                const isUserOnline = onlineUsers.has(userIdForStatusCheck);
                                return (
                                    <div
                                        key={conversationId}
                                        className="flex items-center p-3 mb-2 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors duration-200"
                                        onClick={() => fetchMessages(conversationId, user)}
                                    >
                                        <div className="relative">
                                            <img src={Avatar} className="rounded-full w-10 h-10 sm:w-12 sm:h-12" alt="User Avatar" />
                                            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-gray-900 ${isUserOnline ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                                            {unreadCount > 0 && (
                                                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <div className="ml-3">
                                            <div className="flex items-center">
                                                <h3 className="text-sm sm:text-base font-medium text-yellow-300">{user?.fullName || 'Unknown User'}</h3>
                                                <span className={`ml-2 text-xs ${isUserOnline ? 'text-green-400' : 'text-gray-400'}`}>
                                                    {isUserOnline ? 'Online' : 'Offline'}
                                                </span>
                                            </div>
                                            <p className="text-xs sm:text-sm text-yellow-400">{user?.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center text-yellow-400 mt-10 text-sm sm:text-base">No conversations yet. Start a new one!</div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex-col bg-gray-800 w-full ${currentChatInfo.receiver ? 'flex' : 'hidden'} lg:flex`}>
                    {currentChatInfo.receiver ? (
                        <>
                            <div className="w-full bg-gray-900 p-4 flex items-center">
                                <button
                                    className="lg:hidden mr-2 p-2 bg-gray-700 rounded-lg"
                                    onClick={() => {
                                        setCurrentChatInfo({ receiver: null, conversationId: null });
                                        setMessages([]);
                                    }}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-6 w-6 text-yellow-300"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <div className="relative">
                                    <img
                                        src={currentChatInfo.receiver.avatar || Avatar}
                                        className="rounded-full w-10 h-10 sm:w-12 sm:h-12"
                                        alt="Receiver Avatar"
                                    />
                                    <span
                                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-gray-900 ${
                                            onlineUsers.has(currentChatInfo.receiver.receiverId)
                                                ? 'bg-green-500'
                                                : 'bg-gray-500'
                                        }`}
                                    ></span>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-base sm:text-lg font-semibold text-yellow-300">
                                        {currentChatInfo.receiver.fullName}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-yellow-400">
                                        {currentChatInfo.receiver.email}
                                    </p>
                                </div>
                                <div className="ml-auto">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-6 w-6 text-yellow-300"
                                        viewBox="0 0 24 24"
                                        strokeWidth="1.5"
                                        stroke="currentColor"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                        <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
                                        <path d="M15 9l5 -5" />
                                        <path d="M16 4l4 0l0 4" />
                                    </svg>
                                </div>
                            </div>
                            <div
                                className="relative flex-grow overflow-y-auto p-4"
                                style={{
                                    maxHeight: 'calc(100vh - 128px)',
                                    backgroundImage: `url('https://media.istockphoto.com/id/468756992/photo/night-sky-with-stars-and-blue-nebula-over-water.jpg?s=612x612&w=0&k=20&c=7l7orITTtsTp3iUtAPESp1-RC4wtC17Fa-QbpthfVzI=')`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                }}
                            >
                                <style>
                                    {`
                                        div[style*="maxHeight: calc(100vh - 128px)"]::-webkit-scrollbar {
                                            display: none;
                                        }
                                    `}
                                </style>
                                {messages.length > 0 ? (
                                    messages.map((msg, index) => {
                                        const isSender =
                                            loggedInUser &&
                                            msg.user &&
                                            (msg.user.id === (loggedInUser._id || loggedInUser.id));
                                        return (
                                            <div
                                                key={msg.createdAt || index}
                                                className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-4`}
                                            >
                                                <div
                                                    className={`max-w-[70%] p-2 sm:p-3 text-xs sm:text-sm ${
                                                        isSender
                                                            ? 'text-black bg-yellow-200 rounded-tl-lg rounded-tr-lg rounded-bl-lg'
                                                            : 'text-black bg-yellow-300 rounded-tl-lg rounded-tr-lg rounded-br-lg'
                                                    }`}
                                                >
                                                    {msg.message}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center text-yellow-400 mt-20 text-sm sm:text-base">
                                        Start a conversation with {currentChatInfo.receiver.fullName}
                                    </div>
                                )}
                                <div ref={messageRef}></div>
                            </div>
                            <div className="p-4 bg-gray-900 flex items-center">
                                <input
                                    className="flex-grow bg-gray-700 text-yellow-300 border-0 h-10 rounded-lg px-4 outline-none focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Type a message..."
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            sendMessage();
                                        }
                                    }}
                                />
                                <button
                                    className={`ml-2 p-2 rounded-lg ${
                                        messageInput.trim() ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-600 cursor-not-allowed'
                                    }`}
                                    onClick={() => messageInput.trim() && sendMessage()}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-300"
                                        viewBox="0 0 24 24"
                                        strokeWidth="1.5"
                                        stroke="currentColor"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                        <path d="M10 14l11 -11" />
                                        <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
                                    </svg>
                                </button>
                                <button className="ml-2 p-2 bg-gray-700 rounded-lg hover:bg-gray-600">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-300"
                                        viewBox="0 0 24 24"
                                        strokeWidth="1.5"
                                        stroke="currentColor"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                        <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
                                        <path d="M9 12h6" />
                                        <path d="M12 9v6" />
                                    </svg>
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-yellow-400 mt-20 text-sm sm:text-base">
                            Select a conversation to start chatting
                        </div>
                    )}
                </div>

                {/* Users Sidebar */}
                <div className={`lg:w-1/3 w-full bg-gray-900 p-4 flex-col flex-shrink-0 h-full ${currentChatInfo.receiver ? 'hidden' : 'flex'} lg:flex`}>
                    <h2 className="text-lg font-semibold mb-3 text-yellow-300">Users</h2>
                    <div className="flex-grow overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
                        {users.length > 0 ? (
                            users.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center p-3 mb-2 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors duration-200"
                                    onClick={() => fetchMessages("new", { receiverId: user.id, fullName: user.fullName, email: user.email, avatar: user.avatar })}
                                >
                                    <div className="relative">
                                        <img src={Avatar} className="rounded-full w-10 h-10 sm:w-12 sm:h-12" alt="User Avatar" />
                                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-gray-900 ${onlineUsers.has(user.id) ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm sm:text-base font-medium text-yellow-300">{user.fullName}</h3>
                                        <p className="text-xs sm:text-sm text-yellow-400">{user.email}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-yellow-400 text-sm sm:text-base">No users found to chat with.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashBoard;