import React, { useEffect } from 'react'
import AdminNavBar from '../../components/admin/AdminNavBar'
import AdminSidebar from '../../components/admin/AdminSidebar'
import { Outlet } from 'react-router-dom'
import { useAppContext } from '../../context/AppContextCore'
import Loading from '../../components/Loading'

const Layout = () => {

  const {isAdmin, fetchIsAdmin} = useAppContext();

  useEffect(() => {
    // fetch admin status when this layout mounts
    if (typeof fetchIsAdmin === 'function') fetchIsAdmin();
  }, [fetchIsAdmin])

  // `isAdmin` is a boolean; don't call it like a function.
  // Show loading while admin status is being determined (optional enhancement: use `null` initial state)
  if (isAdmin === null || isAdmin === undefined) return <Loading />;

  return isAdmin ? (
    <>
      <AdminNavBar/>
      <div className='flex'>
        <AdminSidebar/>
        <div className='flex-1 px-4 py-10 md:px-10 h-[calc(100vh-64px)] '>
          <Outlet/>
        </div>
      </div>
    </>
  ) : <Loading/>
}

export default Layout