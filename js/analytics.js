// XoFilmy analytics.js - Analytics functionality

import { collection, getDocs, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import { db } from './firebase-config.js';

// Get total movies count
export async function getTotalMoviesCount() {
    try {
        const moviesRef = collection(db, 'movies');
        const querySnapshot = await getDocs(moviesRef);
        return querySnapshot.size;
    } catch (error) {
        console.error('Error getting total movies count:', error);
        return 0;
    }
}

// Get trending movies count
export async function getTrendingMoviesCount() {
    try {
        const moviesRef = collection(db, 'movies');
        const querySnapshot = await getDocs(moviesRef);
        
        // Filter trending movies manually
        const trendingMovies = querySnapshot.docs.filter(doc => doc.data().trending === true);
        return trendingMovies.length;
    } catch (error) {
        console.error('Error getting trending movies count:', error);
        return 0;
    }
}

// Get recent additions count (added this month)
export async function getRecentAdditionsCount() {
    try {
        const moviesRef = collection(db, 'movies');
        const querySnapshot = await getDocs(moviesRef);
        
        // Get current date
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Filter movies added this month
        const recentMovies = querySnapshot.docs.filter(doc => {
            const createdAt = doc.data().createdAt;
            if (!createdAt) return false;
            
            const createdDate = new Date(createdAt.seconds * 1000);
            return createdDate >= firstDayOfMonth;
        });
        
        return recentMovies.length;
    } catch (error) {
        console.error('Error getting recent additions count:', error);
        return 0;
    }
}

// Get category distribution data
export async function getCategoryDistribution() {
    try {
        const moviesRef = collection(db, 'movies');
        const querySnapshot = await getDocs(moviesRef);
        
        // Initialize categories
        const categories = {
            'Bollywood Movie': 0,
            'Hollywood Movie': 0,
            'South Movie': 0,
            'Webseries': 0,
            'Other': 0
        };
        
        // Count movies by category
        querySnapshot.docs.forEach(doc => {
            const category = doc.data().category;
            if (category && categories[category] !== undefined) {
                categories[category]++;
            } else {
                categories['Other']++;
            }
        });
        
        return categories;
    } catch (error) {
        console.error('Error getting category distribution:', error);
        return {};
    }
}

// Get monthly additions data (for the last 6 months)
export async function getMonthlyAdditions() {
    try {
        const moviesRef = collection(db, 'movies');
        const querySnapshot = await getDocs(moviesRef);
        
        // Get current date
        const now = new Date();
        
        // Initialize months (last 6 months)
        const monthlyData = {};
        for (let i = 5; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = month.toLocaleString('default', { month: 'short' });
            monthlyData[`${monthName} ${month.getFullYear()}`] = 0;
        }
        
        // Count movies by month
        querySnapshot.docs.forEach(doc => {
            const createdAt = doc.data().createdAt;
            if (!createdAt) return;
            
            const createdDate = new Date(createdAt.seconds * 1000);
            
            // Check if the movie was created in the last 6 months
            for (let i = 5; i >= 0; i--) {
                const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
                
                if (createdDate >= month && createdDate < nextMonth) {
                    const monthName = month.toLocaleString('default', { month: 'short' });
                    monthlyData[`${monthName} ${month.getFullYear()}`]++;
                    break;
                }
            }
        });
        
        return monthlyData;
    } catch (error) {
        console.error('Error getting monthly additions:', error);
        return {};
    }
}

// Get recent activity data
export async function getRecentActivity(limit = 3) {
    try {
        const moviesRef = collection(db, 'movies');
        const querySnapshot = await getDocs(query(moviesRef, orderBy('createdAt', 'desc'), limit(limit)));
        
        // Format recent activity
        const recentActivity = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                type: 'add',
                title: data.title,
                date: new Date(data.createdAt.seconds * 1000)
            };
        });
        
        return recentActivity;
    } catch (error) {
        console.error('Error getting recent activity:', error);
        return [];
    }
}
