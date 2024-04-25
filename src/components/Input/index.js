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

    return(
        <>
        <div className= {"w-1/2 ${className}"}>
            <label for={name} className="block mb-2 text-sm font-medium text-grey-900 dark:text-grey-300">
            {label}
            </label>
            <input type= {type} id= {name} placeholder={placeHolder} 
            required= {isRequired}
            className={`bg-grey-50 border 
            border-grey-300 text-grey-900 text-sm 
            rounded-lg focus:ring-blue-500 
            focus:border-blue-500 block
             w-full p-2.5 dark:bg-grey-500  mb-9
             dark:border-grey-600 dark:placeholder-grey-400 dark:text-white
             dark:focus-blue-500 dark:focus-border-blue-500 ${inPutclassName} `} value = {value} onChange={onChange} />
        </div>

        </>
    )
}
export default Input;