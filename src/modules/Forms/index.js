import React, { useState } from "react";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useNavigate } from "react-router-dom";

const Form = ({
    isSingInPage = true,
}) => {

 const [data, setData] = useState({
    ...(!isSingInPage && {
        fullName : '',
    }),
    email:'',
    password:'',

 });
 console.log(data);

 const navigate = useNavigate();

 const handleSubmit = async() => {
    console.log(data);

    const res = await fetch(`http://localhost:8000/api/${isSingInPage ? 'login' :'register'}`, {
        method:'POST',
        headers:{
            'Content-type':'application/JSON'
        },
        body:JSON.stringify(data)
    });
    const resData = await res.json();
    console.log(resData);


 }
    return(
        <>
            <div className='text-yellow bg-white h-[800px] w-[600px] shadow-lg rounded-lg items-center flex flex-col justify-center'>
                    <div className="text-4xl font-extrabold">welcome {isSingInPage && 'back'}</div>
                    <div className="text-xl font-light mb-14">{isSingInPage ? 'sign is to get explore' : 'sing up now  to get started'} </div>
                    <form className="justify-center flex flex-col items-center w-full" onSubmit={()=> handleSubmit() }>

                        {!isSingInPage &&

                         <Input label="full name" onChange={(e) => setData({...data, fullName:e.target.value})} placeHolder="enter your full name" name = "name"  className="mb-10" value= {data.fullName}/>}                 
                         <Input label="Email" onChange={(e) => setData({...data, email:e.target.value})} placeHolder="enter your email" name = "email" className="" value= {data.email} />
                         <Input label="Password" onChange={(e) => setData({...data, password:e.target.value})} placeHolder="enter your password" name = "password" className = 'mb-8' value={data.password}/>

                        <Button type = 'submit' label = {isSingInPage ? 'sign in' :'sign up' }  className="shadow-lg w-1/2 mb-2 mt-10" />
                    </form>


                    <div>{isSingInPage ? 'did not have an account' : 'Already have an account ?'} <span onClick={() => navigate(`/${isSingInPage ? 'users/sign_up' : 'users/sign_in'}`)}  className="cursor-pointer text-blue underline"> {isSingInPage ? 'sign up' : 'sign in'}</span></div>

            </div>
        </>
        
    );
}
export default Form;