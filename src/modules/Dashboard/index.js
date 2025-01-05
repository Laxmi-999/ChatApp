import React, { useEffect, useRef, useState } from "react";
import Avatar from '../../assets/avatar.png';
// import Conversation from "../../../../ChatAppServer/models/Conversation";
// import Conversation from "../../../../ChatAppServer/models/Conversation";
import { io } from 'socket.io-client';

// Initialize socket connection

const DashBoard = () => {



    const [conversation, setConversation] = useState([]);
    const [loggedInUser, setLoggedInUser] = useState(JSON.parse(localStorage.getItem('user:details')));
    const [messages, setMessages] = useState({ messages: [], receiver: null, conversationId: null });
    const [message, setMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const [users, setUsers] = useState([]);
    const messageRef = useRef(null)

    // console.log('conversation', conversation);
    // console.log('user is:', user);



    useEffect(() => {
        setSocket(io('http://localhost:8080'));
    }, []);


    useEffect(() => {
        socket?.emit('addUser', loggedInUser.id)

        socket?.on('getUsers', users => {
            console.log('active users are ', users);
        })
        //listen to the 
        socket?.on('getMessage', data => {
            // Update the messages state with the new message
            console.log('data is ', data);
            setMessages(prevMessages => ({
                ...prevMessages,
                messages: [...prevMessages.messages, { user: { id: data.senderId }, message: data.message }]
                // Append the new message
            }));
        });
    }, [socket]);



    useEffect (() =>{
        messageRef?.current?.scrollIntoView({behavior:'smooth'})

    }, [messages?.messages])

    useEffect(() => {

        const fetchConversation = async () => {
            try {
                if (!loggedInUser || !loggedInUser.id) {
                    throw new Error('User not logged in or invalid user details');
                }

                const res = await fetch(`http://localhost:8000/api/conversation/${loggedInUser.id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!res.ok) {
                    throw new Error(`Error fetching conversation: ${res.status} ${res.statusText}`);
                }

                const resData = await res.json();

                // Check if the response data is valid
                if (Array.isArray(resData) && resData.length > 0) {
                    console.log('Conversation details:', resData);
                    setConversation(resData);
                } else {
                    console.log('No conversations found.');
                    setConversation([]); // Set empty array if no conversation
                }
            } catch (error) {
                console.error('Failed to fetch conversation:', error);
            }
        };

        fetchConversation();
    }, []);




    const fetchMessages = async (conversationId, User) => {
        try {
            const res = await fetch(`http://localhost:8000/api/message/${conversationId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) {
                throw new Error('Network response was not ok');
            }
            const resData = await res.json();
            console.log(resData);
            console.log('user is', loggedInUser);


            setMessages({ messages: resData, receiver: User, conversationId });

        } catch (error) {
            console.error('Failed to fetch conversation:', error);
        }
    };

    const sendMessage = async () => {
        console.log('messages', messages);
        console.log('receiverId', messages.receiver.receiverId,

        );
        // Emit the message to the server to notify other users
        socket.emit('sendMessage', {
            senderId: loggedInUser.id,
            receiverId: messages.receiver.receiverId,
            message,
            conversationId: messages.conversationId,
        });
        try {
            const res = await fetch(`http://localhost:8000/api/message`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        conversationId: messages.conversationId,
                        senderId: loggedInUser.id,
                        message,
                        receiverId: messages.receiver.id
                    })
                });

            if (!res.ok) {
                const errorMessage = await res.text();
                throw new Error(`Network response was not ok: ${errorMessage}`);
            }



            const resData = await res.json();
            console.log('response data are', resData);
            setMessage('');

        } catch (error) {
            console.log('failed to send message', error);
        }
    }

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/users', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!res.ok) {
                    throw new Error(`Error fetching users: ${res.status} ${res.statusText}`);
                }

                const resData = await res.json();
                setUsers(resData);
            } catch (error) {
                console.error('Failed to fetch users:', error);
            }
        };

        fetchUsers();
    }, []);

    return (
        <>
            <div className='w-screen h-auto flex'>

                <div className="w-[25%] bg-secondary p-3 relative">

                    <div className='w-[100%]  absoulte '>
                        <div className="flex justify-center items-center my-4">
                            <div className="border border-primary rounded-full p-2">
                                <img src={Avatar} width={80} height={80} alt="User Avatar" className="rounded-full" />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-2xl md:text-4xl font-bold">{loggedInUser.fullName}</h3>
                                <p className="text-lg md:text-2xl font-light">{loggedInUser.email}</p>
                            </div>
                        </div>
                    </div>

                    <hr className="w-[300px] ml-[20px] border border-grey-900 shadow-lg flex absolute my-8" />

                    <div className="absolute bg-secondary w-[85%] my-12 ml-10 ">
                        <div className="text-2xl font-bold mr-auto my-5">Messages</div>
                        <div>
                            {
                                conversation.length > 0 ? (
                                    conversation.map(({ user, conversationId }) => (
                                        <div key={conversationId} className="flex items-center my-4 p-2 border-b border-gray-300 cursor-pointer" onClick={() => fetchMessages(conversationId, user)}>
                                            <div className="border border-blue-500 rounded-full p-1">
                                                <img src={Avatar} width={75} height={75} alt="User Avatar" className="rounded-full" />
                                            </div>
                                            <div className="ml-4">
                                                <h3 className="text-lg font-semibold">{user.fullName}</h3>
                                                <p className="text-sm text-gray-600">{user.email}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-2xl text-center font-semibold mt-10">No Conversations</div>
                                )
                            }
                        </div>
                    </div>
                </div>
                <div className='w-[50%]   h-screen bg-white flex flex-col items-center' >

                    {messages.receiver &&


                        <div className="w-full md:w-[75%] bg-secondary h-auto my-4 shadow-md rounded-full flex items-center p-4">
                            <div className="flex-shrink-0">
                                
                                <img src={messages.receiver.avatar || Avatar} width={65} height={65} alt="Receiver Avatar" className="rounded-full border-2 border-blue-500" />
                            </div>
                            <div className="flex flex-col ml-4 mr-auto">
                                <h3 className="text-lg md:text-[1.3rem] font-bold">{messages.receiver.fullName}</h3>
                                <p className="text-sm md:text-[.8rem] text-green-500 font-semibold">{messages.receiver.email}</p>
                            </div>
                            <div className="cursor-pointer align-center items-center justify-center mr-6 ml-auto">
                                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-phone-outgoing" width="35" height="35" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#6f32be" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
                                    <path d="M15 9l5 -5" />
                                    <path d="M16 4l4 0l0 4" />
                                </svg>
                            </div>
                        </div>

                    }

                    <div className="h-[80%]   w-full overflow-y-scroll scrollbar-y-hidden border-b mb-2">
                        <div className="px-10 py-14">
                            {

                                messages?.messages?.length > 0 ?
                                    messages.messages.map((message) => {
                                        console.log('message is ', message);

                                        const isSender = message.user.id === loggedInUser.id;


                                        return (
                                            <>
                                            <div className={`max-w-[250px] text-[1rem] p-4 mb-4
                                                ${isSender ? 'bg-primary rounded-tl-xl rounded-tr-xl rounded-bl-xl  rounded-br-none text-white ml-auto' :
                                                'bg-secondary rounded-tl-xl rounded-bl-none rounded-br-xl '}`
                                            }>
                                                {message.message}
                                            </div>
                                            <div ref={messageRef}></div>
                                        </>

                                        )
                                    }) :
                                    <div className="text-[2rem] text-center font-semibold mt-[10rem]"> No Messages </div>
                            }
                        </div>

                    </div>
                    {
                        messages.receiver &&

                        <div className="flex items-center justify-center  w-full p-14">
                            <input className="w-[70%] bg-secondary border-0 h-[60px]  rounded-full outline-none shadow-lg items-center flex px-14"
                                value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a messages...." />
                            <div
                                className={`ml-4 p-2  cursor-pointer bg-light align-center justify-center items-center rounded-full ${!message ? 'pointer-events-none cursor-default' : ''}`}
                                onClick={() => message && sendMessage()} // Ensures sendMessage is called only if message is not null
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-send cursor-pointer" width="44" height="40" viewBox="0 0 24 24" stroke-width="1.5" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path d="M10 14l11 -11" />
                                    <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
                                </svg>
                            </div>
                            <div className="ml-4 p-2  cursor-pointer bg-light align-center justify-center items-center rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-circle-plus cursor-pointer" width="44" height="40" viewBox="0 0 24 24" stroke-width="1.5" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
                                    <path d="M9 12h6" />
                                    <path d="M12 9v6" />
                                </svg>
                            </div>
                        </div>
                    }

                </div>
                <div className='w-[25%]  h-screen bg-secondary p-4'>
                    <h2 className="text-xl font-bold mb-4">Users</h2>
                    <div className="bg-secondary">
                        {users.length > 0 ? (
                            users.map(user => (
                                <div key={user.id} className="flex items-center my-2 mb-10 p-2 border-b border-gray-300 cursor-pointer" onClick={() => fetchMessages(conversationId, user)}>
                                    <img src={Avatar} width={50} height={50} alt="User Avatar" className="rounded-full border-2 border-blue-500" />
                                    <div className="ml-3">
                                        <h3 className="text-lg font-semibold">{user.users.fullName}</h3>
                                        <p className="text-sm text-gray-600">{user.users.email}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No users found.</p>
                        )}
                    </div>
                </div>
            </div>


        </>
    )
}
export default DashBoard;