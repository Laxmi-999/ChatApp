import React, { useEffect, useRef, useState, useCallback } from "react";
import Avatar from '../../assets/avatar.png';
import { io } from 'socket.io-client';

const DashBoard = () => {
    const [conversation, setConversation] = useState([]);
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [currentChatInfo, setCurrentChatInfo] = useState({ receiver: null, conversationId: null });
    const [messageInput, setMessageInput] = useState('');
    const [socket, setSocket] = useState(null);
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const messageRef = useRef(null);

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


    const fetchAllUsers = useCallback(async () => {
        if (!loggedInUser) return;

        try {
            console.log('Fetching all users...');
            const res = await fetch('https://chat-server-vi4d.onrender.com/api/users', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Error fetching users: ${res.status} ${res.statusText} - ${errorText}`);
            }

            const resData = await res.json();
            console.log('API response for all users:', resData);

            setUsers(resData.filter(user => user.id !== loggedInUser.id));
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    }, [loggedInUser]);

    useEffect(() => {
        if (loggedInUser) {
            fetchAllUsers();
        }
    }, [loggedInUser, fetchAllUsers]);

    const fetchUserConversations = useCallback(async () => {
        if (!loggedInUser?._id && !loggedInUser?.id) {
            console.log('User not logged in or invalid user details, skipping conversation fetch.');
            setConversation([]);
            return;
        }

        const userId = loggedInUser._id || loggedInUser.id;

        try {
            console.log(`Fetching conversations for user ID: ${userId}`);
           const res = await fetch(`https://chat-server-vi4d.onrender.com/api/conversation/${userId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                });
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Error fetching conversation: ${res.status} ${res.statusText} - ${errorText}`);
            }

            const resData = await res.json();
            console.log('API response for conversations:', resData);

            if (Array.isArray(resData) && resData.length > 0) {
                setConversation(resData);
            } else {
                console.log('No conversations found for this user.');
                setConversation([]);
            }
        } catch (error) {
            console.error('Failed to fetch conversation:', error);
            setConversation([]);
        }
    }, [loggedInUser]);

    useEffect(() => {
        fetchUserConversations();
    }, [fetchUserConversations]);

    const fetchMessages = useCallback(async (selectedConversationId, userDetails) => {
        if (!loggedInUser || (!loggedInUser._id && !loggedInUser.id)) {
            console.log("Logged-in user details missing for fetching messages.");
            return;
        }

        setCurrentChatInfo({ receiver: userDetails, conversationId: selectedConversationId });
        setMessages([]);
        console.log(`Fetching messages for conversation ID: ${selectedConversationId} with receiver:`, userDetails);

        let url = '';
        if (selectedConversationId === 'new') {
            url = `https://chat-server-vi4d.onrender.com/api/conversation?senderId=${loggedInUser.id}&receiverId=${userDetails.receiverId}`;
        } else {
            url = `https://chat-server-vi4d.onrender.com/api/message/${selectedConversationId}`;
        }

        try {
            const res = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Network response was not ok: ${errorText}`);
            }

            const resData = await res.json();
            console.log('API response for messages or conversation check:', resData);

            if (selectedConversationId === 'new') {
                if (resData.conversationId) {
                    setCurrentChatInfo(prev => ({ ...prev, conversationId: resData.conversationId }));
                    const messagesRes = await fetch(`https://chat-server-vi4d.onrender.com/api/message/${resData.conversationId}`);
                    if (messagesRes.ok) {
                        const messagesData = await messagesRes.json();
                        setMessages(messagesData);
                    } else {
                        setMessages([]);
                    }
                    fetchUserConversations();
                } else {
                    console.warn("API did not return a conversationId for a 'new' conversation check.");
                    setMessages([]);
                }
            } else if (Array.isArray(resData)) {
                setMessages(resData);
            } else {
                setMessages([]);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            setMessages([]);
        }
    }, [loggedInUser, fetchUserConversations]);

    useEffect(() => {
        const currentUserId = loggedInUser?._id || loggedInUser?.id;
        if (socket && currentUserId) {
            socket.emit('addUser', currentUserId);

            socket.on('getMessage', data => {
                console.log('New message received from socket:', data);

                setCurrentChatInfo(prevChatInfo => {
                    const isMessageForCurrentConversation =
                        prevChatInfo.receiver &&
                        (
                            (data.senderId === prevChatInfo.receiver.receiverId && data.receiverId === currentUserId) ||
                            (data.receiverId === prevChatInfo.receiver.receiverId && data.senderId === currentUserId)
                        ) &&
                        (prevChatInfo.conversationId === data.conversationId);

                    console.log(`Is message for current conversation? ${isMessageForCurrentConversation}`);

                    if (isMessageForCurrentConversation) {
                        setMessages(prevMsgs => {
                            const isDuplicate = prevMsgs.some(
                                m => m.message === data.message && m.user.id === data.user.id && m.createdAt === data.createdAt
                            );
                            if (!isDuplicate) {
                                return [...prevMsgs, { user: data.user, message: data.message }];
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
            };
        }
    }, [socket, loggedInUser, fetchUserConversations]);

    useEffect(() => {
        messageRef?.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!messageInput.trim() || !currentChatInfo.receiver || !loggedInUser) {
            console.log('Message is empty, no receiver, or user not logged in.');
            return;
        }

        const senderId = loggedInUser._id || loggedInUser.id;
        const receiverId = currentChatInfo.receiver.receiverId;
        const messageText = messageInput.trim();
        let conversationIdToSend = currentChatInfo.conversationId;

        if (conversationIdToSend === 'new') {
            conversationIdToSend = undefined;
        }

        const payload = {
            conversationId: conversationIdToSend,
            senderId: senderId,
            message: messageText,
            receiverId: receiverId
        };

        console.log('Sending message payload to API:', payload);

        try {
            const res = await fetch(`https://chat-server-vi4d.onrender.com/api/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const resData = await res.json();
            if (!res.ok) {
                const errorMessage = resData.error || res.statusText;
                throw new Error(`Failed to save message to DB: ${errorMessage}`);
            }

            console.log('API response after saving message:', resData);

            if (currentChatInfo.conversationId === 'new' && resData.conversationId) {
                console.log(`New conversation created with ID: ${resData.conversationId}`);
                setCurrentChatInfo(prev => ({ ...prev, conversationId: resData.conversationId }));
                fetchUserConversations();
            }

            socket.emit('sendMessage', {
                senderId: senderId,
                receiverId: receiverId,
                message: messageText,
                conversationId: resData.conversationId || currentChatInfo.conversationId,
                user: { id: loggedInUser._id || loggedInUser.id, fullName: loggedInUser.fullName, email: loggedInUser.email }
            });

            setMessages(prevMessages => {
                const updatedMessages = Array.isArray(prevMessages) ? [...prevMessages] : [];
                updatedMessages.push({
                    user: { id: loggedInUser._id || loggedInUser.id, fullName: loggedInUser.fullName, email: loggedInUser.email },
                    message: messageText,
                    createdAt: new Date().toISOString(),
                });
                return updatedMessages;
            });

            setMessageInput('');
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        console.log('Search query:', e.target.value);
    };

    if (!loggedInUser) {
        return <div className="text-center text-xl mt-20 text-gray-300">Loading user details or not logged in...</div>;
    }

    return (
        <div className="w-screen h-screen flex bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100">
            {/* New Icon Sidebar */}
            <div className="w-[4%] bg-[#1f2937] flex flex-col items-center py-4 space-y-6 mt-4 mr-[2rem]">
                <div className="relative group">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-user" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#fde68a" fill="none" strokeLinecap="round" strokeLinejoin="round" onClick={() => console.log('User Account clicked')}>
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <circle cx="12" cy="7" r="4" />
                        <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
                    </svg>
                    <span className="absolute left-12 top-1/2 transform -translate-y-1/2 bg-gray-700 text-yellow-300 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Account</span>
                </div>
                <div className="relative group">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-lock" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#fde68a" fill="none" strokeLinecap="round" strokeLinejoin="round" onClick={() => console.log('Privacy clicked')}>
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <circle cx="12" cy="16" r="1" />
                        <path d="M8 11v-4a4 4 0 0 1 8 0v4" />
                    </svg>
                    <span className="absolute left-12 top-1/2 transform -translate-y-1/2 bg-gray-700 text-yellow-300 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Privacy</span>
                </div>
                <div className="relative group">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-help" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#fde68a" fill="none" strokeLinecap="round" strokeLinejoin="round" onClick={() => console.log('Help clicked')}>
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 17l0 .01" />
                        <path d="M12 13.5a1.5 1.5 0 0 1 1 -1.5a2.6 2.6 0 1 0 -3 -4" />
                    </svg>
                    <span className="absolute left-12 top-1/2 transform -translate-y-1/2 bg-gray-700 text-yellow-300 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Help</span>
                </div>
                <div className="relative group">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-settings" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#fde68a" fill="none" strokeLinecap="round" strokeLinejoin="round" onClick={() => console.log('Settings clicked')}>
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .645 2.825 .436 3.35 0z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span className="absolute left-12 top-1/2 transform -translate-y-1/2 bg-gray-700 text-yellow-300 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Settings</span>
                </div>
            </div>

            {/* Conversations Sidebar */}
            <div className="w-[23%] bg-gray-900 p-4 flex flex-col mr-[2rem]">
                <div className="flex items-center mb-4">
                    <div className="border-2 border-indigo-500 rounded-full p-1 mb-[1rem]">
                        <img src={Avatar} width={50} height={50} alt="User Avatar" className="rounded-full" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-xl font-semibold text-yellow-300">{loggedInUser.fullName}</h3>
                        <p className="text-sm text-yellow-400">{loggedInUser.email}</p>
                    </div>
                </div>

                <input
                    type="text"
                    className="w-full bg-gray-700 text-yellow-300 border-0 h-10 rounded-lg px-4 outline-none focus:ring-2 focus:ring-yellow-500 mb-[2rem]"
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder="Search users..."
                />

                <div className="flex space-x-2 mb-4">
                    <button
                        className="flex-1 bg-gray-700 text-yellow-300 text-sm py-2 rounded-lg hover:bg-gray-600 focus:bg-yellow-500 focus:text-gray-900 transition-colors"
                        onClick={() => console.log('All clicked')}
                    >
                        All
                    </button>
                    <button
                        className="flex-1 bg-gray-700 text-yellow-300 text-sm py-2 rounded-lg hover:bg-gray-600 focus:bg-yellow-500 focus:text-gray-900 transition-colors"
                        onClick={() => console.log('Unread clicked')}
                    >
                        Unread
                    </button>
                    <button
                        className="flex-1 bg-gray-700 text-yellow-300 text-sm py-2 rounded-lg hover:bg-gray-600 focus:bg-yellow-500 focus:text-gray-900 transition-colors"
                        onClick={() => console.log('Favorite clicked')}
                    >
                        Favorite
                    </button>
                    <button
                        className="flex-1 bg-gray-700 text-yellow-300 text-sm py-2 rounded-lg hover:bg-gray-600 focus:bg-yellow-500 focus:text-gray-900 transition-colors"
                        onClick={() => console.log('Groups clicked')}
                    >
                        Groups
                    </button>
                </div>

                <hr className="border-gray-700 mb-[2rem]" />

                <div className="flex-grow overflow-y-auto ">
                    <h2 className="text-lg font-semibold mb-3 text-yellow-300">Conversations</h2>
                    {conversation.length > 0 ? (
                        conversation.map(({ user, conversationId, unreadCount }) => (
                            <div
                                key={conversationId}
                                className="flex items-center p-3 mb-2 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors duration-200"
                                onClick={() => fetchMessages(conversationId, user)}
                            >
                                <div className="relative">
                                    <img src={Avatar} width={40} height={40} alt="User Avatar" className="rounded-full" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-yellow-300">{user?.fullName || 'Unknown User'}</h3>
                                    <p className="text-xs text-yellow-400">{user?.email || 'N/A'}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-yellow-400 mt-10">No conversations yet. Start a new one!</div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="w-[50%] h-screen bg-gray-800 flex flex-col">
                {currentChatInfo.receiver ? (
                    <>
                        <div className="w-full bg-gray-900 p-4 flex items-center">
                            <img src={currentChatInfo.receiver.avatar || Avatar} width={40} height={40} alt="Receiver Avatar" className="rounded-full" />
                            <div className="ml-3">
                                <h3 className="text-lg font-semibold text-yellow-300">{currentChatInfo.receiver.fullName}</h3>
                                <p className="text-xs text-yellow-400">{currentChatInfo.receiver.email}</p>
                            </div>
                            <div className="ml-auto">
                                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-phone-outgoing" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#fde68a" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                    <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"/>
                                    <path d="M15 9l5 -5"/>
                                    <path d="M16 4l4 0l0 4"/>
                                </svg>
                            </div>
                        </div>

                        <div
                            className="flex-grow overflow-y-auto p-4"
                            style={{
                                backgroundImage: `url('https://media.istockphoto.com/id/468756992/photo/night-sky-with-stars-and-blue-nebula-over-water.jpg?s=612x612&w=0&k=20&c=7l7orITTtsTp3iUtAPESp1-RC4wtC17Fa-QbpthfVzI=')`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat'
                            }}
                        >
                            {messages.length > 0 ? (
                                messages.map((msg, index) => {
                                    const isSender = loggedInUser && msg.user && (msg.user.id === (loggedInUser._id || loggedInUser.id));
                                    return (
                                        <div
                                            key={msg.createdAt || index}
                                            className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-4`}
                                        >
                                            <div
                                                className={`max-w-[70%] p-3 text-sm  ${isSender ? ' text-black bg-yellow-200 rounded-tl-lg rounded-tr-lg rounded-bl-lg' : ' text-black bg-yellow-300 rounded-tl-lg rounded-tr-lg rounded-br-lg'}`}
                                            >
                                                {msg.message}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center text-yellow-400 mt-20">
                                    Start a conversation with {currentChatInfo.receiver.fullName}
                                </div>
                            )}
                            <div ref={messageRef}></div>
                        </div>

                        <div className="p-4 bg-gray-900 flex items-center">
                            <input
                                className="flex-grow bg-gray-700 text-yellow-300 border-0 h-10 rounded-lg px-4 outline-none focus:ring-2 focus:ring-yellow-500"
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
                                className={`ml-2 p-2 rounded-lg ${messageInput.trim() ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-600 cursor-not-allowed'}`}
                                onClick={() => messageInput.trim() && sendMessage()}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-send" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#fde68a" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                    <path d="M10 14l11 -11"/>
                                    <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5"/>
                                </svg>
                            </button>
                            <button className="ml-2 p-2 bg-gray-700 rounded-lg hover:bg-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-circle-plus" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#fde68a" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                    <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/>
                                    <path d="M9 12h6"/>
                                    <path d="M12 9v6"/>
                                </svg>
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-yellow-400 mt-20">Select a conversation to start chatting</div>
                )}
            </div>

            {/* Users Sidebar */}
            <div className="w-[23%] bg-gray-900 p-4 flex flex-col">
                <h2 className="text-lg font-semibold mb-3 text-yellow-300">Users</h2>
                <div className="flex-grow overflow-y-auto">
                    {users.length > 0 ? (
                        users.map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center p-3 mb-2 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors duration-200"
                                onClick={() => fetchMessages("new", { receiverId: user.id, fullName: user.fullName, email: user.email, avatar: user.avatar })}
                            >
                                <img src={Avatar} width={40} height={40} alt="User Avatar" className="rounded-full" />
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-yellow-300">{user.fullName}</h3>
                                    <p className="text-xs text-yellow-400">{user.email}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-yellow-400">No users found to chat with.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashBoard;