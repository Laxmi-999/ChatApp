import React from "react";
import Avatar from '../../assets/avatar.png';


const DashBoard = () =>{

    const contacts = [
        {
            name:'maya',
            status:'available',
            img: Avatar
        },
        {
            name:'shrida',
            status:'available',
            img: Avatar
        },
        {
            name:'raman',
            status:'available',
            img: Avatar
        },
        {
            name:'keshave',
            status:'available',
            img: Avatar
        },
        {
            name:'kishori',
            status:'available',
            img: Avatar
        },
        {
            name:'radha',
            status:'available',
            img: Avatar
        },
    ]
    return (
        <>
        <div className='w-screen flex'>


            <div className='w-[25%]  h-screen bg-secondary' >
                <div className="flex justify-center item-center my-8">
                    <div className="border border-primary rounded-full p-[2px]"> <img src = {Avatar} width = {80} height={80} /></div>
                    <div className="ml-8">
                        <h3 className="text-4xl font-bold">chat application</h3>
                        <p className="text-2xl font-light">my account</p>
                    </div>
                </div>
            </div>
           <hr className="w-[600px] ml-[20px] border border-grey-900 shadow-lg flex absolute my-[200px]"/>
           <div className="absolute my-[300px] ml-10">
             <div className="text-2xl font-bold ml-3">Messages</div>
             <div>
             {
                 contacts.map(( { name, status, img})=> {
                    return(
                        <div className="justify-center flex items-center my-8">
                            <div className="border border-primary rounded-full p-[2px]"> <img src={img} width={75} height={50} /></div>
                            <div className="ml-8">
                                <h3 className="text-lg">{name}</h3>
                                <p className="text-sm font-light">{status}</p>
                            </div>
                        </div>

                    )
                })
             }
          </div>
       </div>

            <div className='w-[50%]   h-screen bg-white flex flex-col items-center' >
                <div className="w-[75%] bg-secondary h-[80px] my-14 shadow-md rounded-full items-center flex px-14"> 
                   <div><img src={Avatar} width={75} height={50} /></div>
                   <div className="flex-col items-center ml-4 mr-auto">
                        <h3 className="text-2xl font-bold">shridha</h3>
                        <p className="text-sm text-green-500 font-bold">online</p>
                   </div>
                   <div className="cursor-pointer">
                   <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-phone-outgoing ml-6" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#6f32be" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
                    <path d="M15 9l5 -5" />
                    <path d="M16 4l4 0l0 4" />
                    </svg>
                   </div>
                </div>
                <div className="h-[75%] w-full overflow-y-scroll scrollbar-y-hidden border-b mb-2">
                  <div className="px-10 py-14">
                    <div className="max-w-[400px] bg-secondary rounded-b-xl rounded-tr-xl text-2xl mb-10 p-4">
                    hello there! how you doing ? is it all right? hope to meet you soon.

                    </div>
                    <div className="max-w-[400px] bg-primary rounded-b-xl rounded-tl-xl ml-auto text-white text-2xl p-4">
                       hello there! how you doing ? is it all right? hope to meet you soon.

                    </div>
                    <div className="max-w-[400px] bg-secondary rounded-b-xl rounded-tr-xl text-2xl mb-10 p-4">
                    hello there! how you doing ? is it all right? hope to meet you soon.

                    </div>
                    <div className="max-w-[400px] bg-primary rounded-b-xl rounded-tl-xl ml-auto text-white text-2xl p-4">
                       hello there! how you doing ? is it all right? hope to meet you soon.

                    </div>
                    <div className="max-w-[400px] bg-secondary rounded-b-xl rounded-tr-xl text-2xl mb-10 p-4">
                    hello there! how you doing ? is it all right? hope to meet you soon.

                    </div>
                    <div className="max-w-[400px] bg-primary rounded-b-xl rounded-tl-xl ml-auto text-white text-2xl p-4">
                       hello there! how you doing ? is it all right? hope to meet you soon.

                    </div>
                    <div className="max-w-[400px] bg-secondary rounded-b-xl rounded-tr-xl text-2xl mb-10 p-4">
                    hello there! how you doing ? is it all right? hope to meet you soon.

                    </div>
                    <div className="max-w-[400px] bg-primary rounded-b-xl rounded-tl-xl ml-auto text-white text-2xl p-4">
                       hello there! how you doing ? is it all right? hope to meet you soon.

                    </div>
                    <div className="max-w-[400px] bg-secondary rounded-b-xl rounded-tr-xl text-2xl mb-10 p-4">
                    hello there! how you doing ? is it all right? hope to meet you soon.

                    </div>
                    <div className="max-w-[400px] bg-primary rounded-b-xl rounded-tl-xl ml-auto text-white text-2xl p-4">
                       hello there! how you doing ? is it all right? hope to meet you soon.

                    </div>

                  </div>

                </div>
                <div className="flex items-center justify-center mt-1 w-full p-14">
                        <input  className="w-[50%] bg-secondary border-0 h-[80px]  rounded-full outline-none shadow-lg items-center flex px-14" placeholder="Type a messages...." />
                        <div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-send ml-4 cursor-pointer" width="44" height="40" viewBox="0 0 24 24" stroke-width="1.5" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M10 14l11 -11" />
                        <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
                        </svg>
                </div>
                <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-4 icon icon-tabler icon-tabler-circle-plus cursor-pointer" width="44" height="40" viewBox="0 0 24 24" stroke-width="1.5" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
                    <path d="M9 12h6" />
                    <path d="M12 9v6" />
                    </svg>
                </div>
              </div>
            </div>
            <div className='w-[25%]  h-screen bg-light' ></div>
        </div>


        </>
    )
}
export default DashBoard;