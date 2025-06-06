import React from "react";

const Input = ({
    label = '',
    name = '',
    type ='text',
    className='',
    inPutclassName = '',
    isRequired = true,
    placeHolder = '',
    value = '',
    onChange = () => {},

}) => {
                                                    // className={`max-w-[70%] p-3 text-sm  ${isSender ? ' text-black bg-yellow-200 rounded-tl-lg rounded-tr-lg rounded-bl-lg' : ' text-black bg-yellow-300 rounded-tl-lg rounded-tr-lg rounded-br-lg'}`}


    return(
        <>
        <div className= {"w-1/2 ${className}"}>
            <label for={name} className="block mb-2 text-sm font-medium text-grey-900 dark:text-grey-300">
            {label}
            </label>
            <input type= {type} id= {name} placeholder={placeHolder} 
            required= {isRequired}
            className={`bg-grey-50 border 
            border-grey-300 text-black text-[1rem] 
            rounded-lg focus:ring-blue-500 
            focus:border-blue-500 block
             w-full p-2.5  mb-9
             dark:border-grey-600 dark:placeholder-grey-400 
             dark:focus-blue-500 dark:focus-border-blue-500 ${className} ${inPutclassName} `} value = {value} onChange={onChange} />
        </div>

        </>
    )
}
export default Input;