import { useEffect, useState } from 'react'
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AppContext } from './AppContextCore.jsx';

// Ensure VITE_API_BASE_URL (if set) does NOT include a trailing `/api` — server routes expect `/api/*` paths.
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const AppProvider = ({ children }) => {

    // `null` indicates status not yet checked; `true`/`false` are resolved states
    const [isAdmin, setIsAdmin] = useState(null);
    const [shows, setShows] = useState([]);
    const [favoriteMovies, setFavoriteMovies] = useState([]);

    const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

    const { user } = useUser();
    const { getToken } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const fetchIsAdmin = async () => {
        try {
            const { data } = await axios.get('/api/admin/is-admin', {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });

            // If server explicitly denies access, show message and redirect
            if (data?.success === false) {
                setIsAdmin(false);
                if (location.pathname.startsWith('/admin')) {
                    navigate('/');
                    toast.error(data.message || 'Access Denied. Admins Only');
                }
                return;
            }

            setIsAdmin(data.isAdmin);

            if (!data.isAdmin && location.pathname.startsWith('/admin')) {
                navigate('/');
                toast.error('Access Denied. Admins Only');
            }
        } catch (error) {
            console.log(error)
            toast.error('Unable to verify admin status');
            // Ensure caller doesn't stay stuck in a "loading" state
            setIsAdmin(false);
        }
    }

    const fetchShows = async () => {
        try {
            const { data } = await axios.get('/api/show/all')
            if (data?.success) {
                setShows(data.shows)
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const fetchFavoriteMovies = async () => {
        try {
            const { data } = await axios.get('/api/user/favorites', {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            if (data?.success) {
                setFavoriteMovies(data.movies)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        fetchShows();
    }, [])

    useEffect(() => {
        if(user?.id) {
            fetchIsAdmin();
            fetchFavoriteMovies();
        }
    },[user])



    const value = {
        axios,
        fetchIsAdmin,
        user, getToken, navigate, isAdmin, shows,
        favoriteMovies, fetchFavoriteMovies, image_base_url
     }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

