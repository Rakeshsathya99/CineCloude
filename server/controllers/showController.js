import axios from 'axios';
import Movie from '../models/movie.js';
import Show from '../models/show.js';
import { inngest } from '../inngest/index.js';

export const getNowPlayingMovies = async (req, res) => {
    try {
        const { data } = await axios.get('https://api.themoviedb.org/3/movie/now_playing', {
            headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
        });
        const movies = data.results;
        return res.json({ success: true, movies });
    } catch (error) {
        console.error('getNowPlayingMovies error:', error?.message || error);
        return res.status(500).json({ success: false, message: error?.message || 'Server error' });
    }
}


// API to add a new show to the database

export const addShow = async (req, res) => {
    try{
        const {movieId, showsInput, showPrice} = req.body;

        if (!movieId) return res.status(400).json({ success: false, message: 'movieId is required' });
        if (!Array.isArray(showsInput) || showsInput.length === 0) return res.status(400).json({ success: false, message: 'showsInput must be a non-empty array' });

        let movie = await Movie.findById(movieId);

        if(!movie){
            //fetch movie details and credits from tmdb api
            const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
                    headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` }
                }),
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
                    headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` }
                })
            ])

            const movieApiData = movieDetailsResponse.data;
            const movieCreditsData = movieCreditsResponse.data;

            const movieDetails = {
                _id: String(movieApiData.id || movieId),
                title: movieApiData.title || '',
                overview: movieApiData.overview || '',
                poster_path: movieApiData.poster_path || '',
                backdrop_path: movieApiData.backdrop_path || '',
                genres: (movieApiData.genres || []).map(g => g.name),
                casts: movieCreditsData.cast || [],
                release_date: movieApiData.release_date || '',
                original_language: movieApiData.original_language || '',
                tagline: movieApiData.tagline || '',
                vote_average: movieApiData.vote_average || 0,
                runtime: movieApiData.runtime || 0,
            }

            // add movie to the data base

            movie= await Movie.create(movieDetails)
        }

        const showsToCreate = [];
        showsInput.forEach(show => {
            const showDate = show.date;
            const times = Array.isArray(show.times) ? show.times : (Array.isArray(show.time) ? show.time : []);
            if (!times || times.length === 0) return; // skip this show entry if no times
            times.forEach(time => {
                const dateTimeString = `${showDate}T${time}:00`;
                showsToCreate.push({
                    movie: String(movie._id),
                    showDateTime: new Date(dateTimeString),
                    showPrice: Number(showPrice)
                });
            })
        })

        if (showsToCreate.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid show times provided' });
        }

        if (showsToCreate.length > 0) {
            await Show.insertMany(showsToCreate);
        }

        // triger inngest event 

        await inngest.send({
            name: 'app/show.added',
            data: {
                movieTitle: movie.title
            }
        })


        return res.json({success: true, message: 'Shows added successfully'})
    }catch(error){
        console.error('addShow error:', error)
        return res.status(500).json({success: false, message: error.message})
    }
}

// APi to get all shows from the data base

export const getShows = async (req, res) => {
    try{
        const shows = await Show.find({ showDateTime: { $gte: new Date() } }).populate('movie').sort({ showDateTime: 1 });

        // Deduplicate movies by id and return movie list
        const uniqueMovieIds = [...new Set(shows.map(s => String(s.movie._id || s.movie)))];
        const movies = await Movie.find({ _id: { $in: uniqueMovieIds } });

        return res.json({ success: true, shows: movies });
    } catch (error) {
        console.error('getShows error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}


// api to get single shows (grouped by date) for a movie
export const getShow = async (req, res) => {
    try {
        const { movieId } = req.params;
        if (!movieId) return res.status(400).json({ success: false, message: 'movieId is required' });

        // get all upcoming shows for the movie
        const shows = await Show.find({ movie: movieId, showDateTime: { $gte: new Date() } }).sort({ showDateTime: 1 });
        const movie = await Movie.findById(movieId);
        if (!movie) return res.status(404).json({ success: false, message: 'Movie not found' });

        const dateTime = {};

        shows.forEach(s => {
            const date = s.showDateTime.toISOString().split('T')[0];
            if (!dateTime[date]) dateTime[date] = [];
            dateTime[date].push({ time: s.showDateTime.toISOString(), showId: s._id });
        });

        return res.json({ success: true, movie, dateTime });
    } catch (error) {
        console.error('getShow error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}