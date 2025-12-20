import React from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Movies from './pages/Movies'
import MovieDetails from './pages/MovieDetails'
import SeatLayout from './pages/SeatLayout'
import Favorite from './pages/Favorite'
import MovieBookings from './pages/MyBookings'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Footer from './components/Footer'
import Layout from './pages/admin/Layout'
import Dashbord from './pages/admin/Dashbord'
import AddShows from './pages/admin/AddShows'
import ListShows from './pages/admin/ListShows'
import ListBookings from './pages/admin/ListBookings'
import { SignIn, useUser } from '@clerk/clerk-react'
import Loading from './components/Loading'

const App = () => {

  const isAdminRoute =useLocation().pathname.startsWith('/admin')

  const { user } = useUser();

  return (
    <>
    <Toaster/>
      {!isAdminRoute && <Navbar/>}
      <Routes>
        <Route path='/' element = {<Home/>}/>
        <Route path='/movies' element = {<Movies/>}/>
        <Route path='/movies/:id' element = {<MovieDetails/>}/>
        <Route path='/movies/:id/:date' element = {<SeatLayout/>}/>
        <Route path='/favorite' element = {<Favorite/>}/>
        <Route path='/my-bookings' element = {<MovieBookings/>}/>
        <Route path='/loading/:nextUrl' element = {<Loading/>}/>
        <Route path='/admin/*' element = { user ?<Layout/>: (
          <div className='min-h-small flex justify-center items-center'>
            <SignIn fallbackRedirectUrl={ '/admin'}/>
          </div>
        )}>
          <Route index element= {<Dashbord/>}/>
          <Route path='add-shows' element= {<AddShows/>}/>
          <Route path='list-shows' element= {<ListShows/>}/>
          <Route path='list-bookings' element= {<ListBookings/>}/>
        </Route>
      </Routes>
      {!isAdminRoute && <Footer/>}

    </>
  )
}

export default App