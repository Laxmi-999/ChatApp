import React from "react";

const Button  = ({
    label ='button',
    type = 'button',
    className = '',
    disabled = false,

}) =>{
    return(
        <>
    <button type={type}  disabled = {disabled} className={`text-white bg-primary hover:bg-primary focus:ring-4 focus:outline-none
    focus:ring-blue-300 rounded-lg font-medium text-sm  w-[50%] py-2.5 px-5 text-center ${className} `}>{label}</button>
        </>
    )
}
export default Button;