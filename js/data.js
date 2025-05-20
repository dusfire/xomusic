// XoFilmy data.js - Firebase data operations

import { db, storage, auth } from './firebase-config.js';
import { collection, addDoc, getDocs, query, orderBy, limit, startAfter, where, doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import { ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-storage.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

// Verify admin credentials
export async function verifyAdmin(email, password) {
    try {
        // Check if email is the admin email
        if (email !== 'xomovie@admin.com') {
            return false;
        }
        
        // Attempt to sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user !== null;
    } catch (error) {
        console.error('Admin verification error:', error);
        return false;
    }
}

// Get trending movies
export async function getTrendingMovies(count = 5) {
    try {
        console.log('Fetching trending movies...');
        const moviesRef = collection(db, 'movies');
        
        // First get all movies to debug
        const allMoviesQuery = query(moviesRef);
        const allMoviesSnapshot = await getDocs(allMoviesQuery);
        
        console.log(`Total movies in database: ${allMoviesSnapshot.size}`);
        
        // Log movies with trending flag
        const trendingMoviesDebug = allMoviesSnapshot.docs
            .filter(doc => doc.data().trending === true)
            .map(doc => ({
                id: doc.id,
                title: doc.data().title,
                trending: doc.data().trending
            }));
        
        console.log('Movies with trending flag:', trendingMoviesDebug);
        
        // Use where with '===' for boolean comparison and explicitly filter in JS
        const querySnapshot = await getDocs(query(moviesRef, orderBy('createdAt', 'desc')));
        
        // Filter trending movies manually to ensure boolean comparison works correctly
        const trendingMovies = querySnapshot.docs
            .filter(doc => doc.data().trending === true)
            .slice(0, count)
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
        console.log(`Found ${trendingMovies.length} trending movies after manual filtering`);
        
        // If no trending movies found, get latest movies instead
        if (trendingMovies.length === 0) {
            console.log('No trending movies found, fetching latest movies instead');
            const latestQuery = query(moviesRef, orderBy('createdAt', 'desc'), limit(count));
            const latestSnapshot = await getDocs(latestQuery);
            
            return latestSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        
        return trendingMovies;
    } catch (error) {
        console.error('Error getting trending movies:', error);
        return [];
    }
}

// Get latest movies with pagination
export async function getLatestMovies(lastDoc = null, itemsPerPage = 20) {
    try {
        const moviesRef = collection(db, 'movies');
        let q;
        
        if (lastDoc) {
            q = query(moviesRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(itemsPerPage));
        } else {
            q = query(moviesRef, orderBy('createdAt', 'desc'), limit(itemsPerPage));
        }
        
        const querySnapshot = await getDocs(q);
        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
        
        const movies = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        return {
            movies,
            lastVisible
        };
    } catch (error) {
        console.error('Error getting latest movies:', error);
        return {
            movies: [],
            lastVisible: null
        };
    }
}

// Get movie by ID
export async function getMovieById(movieId) {
    try {
        const movieRef = doc(db, 'movies', movieId);
        const movieDoc = await getDoc(movieRef);
        
        if (movieDoc.exists()) {
            return {
                id: movieDoc.id,
                ...movieDoc.data()
            };
        } else {
            console.error('Movie not found');
            return null;
        }
    } catch (error) {
        console.error('Error getting movie:', error);
        return null;
    }
}

// Get movie by slug name
export async function getMovieBySlug(slug) {
    try {
        const moviesRef = collection(db, 'movies');
        const querySnapshot = await getDocs(moviesRef);
        
        // Find the movie with matching slug
        const movies = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Create slugs for each movie and find a match
        const movie = movies.find(movie => {
            const movieSlug = movie.title
                .toLowerCase()
                .replace(/[^\w\s-]/g, '') // Remove special characters
                .replace(/\s+/g, '-') // Replace spaces with hyphens
                .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
            
            return movieSlug === slug;
        });
        
        if (movie) {
            return movie;
        } else {
            console.error('Movie not found by slug:', slug);
            return null;
        }
    } catch (error) {
        console.error('Error getting movie by slug:', error);
        return null;
    }
}

// Search movies
export async function searchMovies(searchTerm) {
    try {
        const moviesRef = collection(db, 'movies');
        const querySnapshot = await getDocs(moviesRef);
        
        // Client-side filtering (Firestore doesn't support full-text search)
        const searchResults = querySnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            .filter(movie => {
                const title = movie.title.toLowerCase();
                const term = searchTerm.toLowerCase();
                return title.includes(term);
            });
        
        return searchResults;
    } catch (error) {
        console.error('Error searching movies:', error);
        return [];
    }
}

// Get related movies
export async function getRelatedMovies(currentMovie, count = 7) {
    try {
        const moviesRef = collection(db, 'movies');
        let q;
        
        // If we have genre, get movies with same genre
        if (currentMovie.genre) {
            q = query(moviesRef, where('genre', '==', currentMovie.genre), limit(count + 1));
        } else {
            // Otherwise just get random movies
            q = query(moviesRef, limit(count + 1));
        }
        
        const querySnapshot = await getDocs(q);
        
        // Filter out the current movie and limit to count
        return querySnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            .filter(movie => movie.id !== currentMovie.id)
            .slice(0, count);
    } catch (error) {
        console.error('Error getting related movies:', error);
        return [];
    }
}

// Add new movie
export async function addMovie(movieData, coverUrl, screenshotUrls = []) {
    try {
        // Ensure trending is a boolean
        const trending = movieData.trending === true;
        
        // Add timestamp
        const movieWithTimestamp = {
            ...movieData,
            trending, // Explicitly set as boolean
            coverUrl,
            screenshots: screenshotUrls,
            createdAt: new Date(),
            status: 'published'
        };
        
        console.log('Adding new movie with data:', {
            title: movieWithTimestamp.title,
            trending: movieWithTimestamp.trending
        });
        
        // Add to Firestore
        const docRef = await addDoc(collection(db, 'movies'), movieWithTimestamp);
        
        return docRef.id;
    } catch (error) {
        console.error('Error adding movie:', error);
        throw error;
    }
}

// Get all movies for admin
export async function getAllMovies() {
    try {
        const moviesRef = collection(db, 'movies');
        const q = query(moviesRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting all movies:', error);
        return [];
    }
}

// Update movie
export async function updateMovie(movieId, movieData) {
    try {
        // Ensure trending is a boolean
        const updatedData = { ...movieData };
        
        // Explicitly set trending as boolean
        if ('trending' in updatedData) {
            updatedData.trending = updatedData.trending === true;
        }
        
        console.log('Updating movie with data:', {
            id: movieId,
            title: updatedData.title,
            trending: updatedData.trending
        });
        
        const movieRef = doc(db, 'movies', movieId);
        await updateDoc(movieRef, updatedData);
        return true;
    } catch (error) {
        console.error('Error updating movie:', error);
        return false;
    }
}

// Delete movie
export async function deleteMovie(movieId) {
    try {
        const movieRef = doc(db, 'movies', movieId);
        await deleteDoc(movieRef);
        return true;
    } catch (error) {
        console.error('Error deleting movie:', error);
        return false;
    }
}