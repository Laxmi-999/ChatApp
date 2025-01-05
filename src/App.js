import logo from './logo.svg';
import './App.css';
import Form from './modules/Forms';
import DashBoard from './modules/Dashboard';
import { Routes, Route, Navigate } from 'react-router-dom';



  const ProtectedRoute = ({ children, auth = false }) => {
    const isLoggedIn = localStorage.getItem('user:token') !== null ||false;
    console.log(` loggged in status : ${isLoggedIn}`)

    if (!isLoggedIn && auth) {
      return <Navigate to={'/users/sign_in'} />
    }
    else if (isLoggedIn && ['/sign_in', '/sign_up'].includes(window.location.pathname)) {
      return <Navigate to ={'/'} />
    }
    return children;
  }

  function App() 
{
  return (
    < >
      <div className='bg-grey-900 flex justify-center flex justify-center h-screen items-center'>
        {/* <Form /> */}
        <Routes>

          <Route path='/' element={
            <ProtectedRoute auth = {true}>
              <DashBoard />
            </ProtectedRoute>
          } />
          <Route path='users/sign_in' element={
            <ProtectedRoute>
                <Form isSingInPage={true} />
            </ProtectedRoute>
          } />
          <Route path='users/sign_up' element={
            <ProtectedRoute>
                <Form isSingInPage={false} />
            </ProtectedRoute>
          } />
        </Routes>
        {/* <DashBoard /> */}
      </div>
    </>
  );
}

export default App;
