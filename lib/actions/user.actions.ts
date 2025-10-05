"use server"

import {connectToDatabase} from "@/database/mongoose";

export const getAllUsersForNewsEmail = async () => {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error('Mongoose connection not connected');

        const users = await db.collection('user').find(
            {email: {$exists: true, $ne: null}},
            {projection: {_id: 1, id: 1, email: 1, name: 1, country: 1}}
        ).toArray();

        return users.filter((user) => user.email && user.name).map((user) => ({
            id: user.id || user._id?.toString() || '',
            email: user.email,
            name: user.name
        }))
    } catch (e) {
        console.error('Error fetching users for news email:', e)
        return []
    }
}

export const updateUserLastVisit = async (email: string): Promise<void> => {
    if (!email) return;

    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error('MongoDB connection not found');

        await db.collection('user').updateOne(
            {email},
            {$set: {lastVisit: new Date()}},
            {upsert: false}
        );
    } catch (err) {
        console.error('Error updating user last visit:', err);
    }
}

export const getInactiveUsers = async (daysSinceLastVisit: number = 15) => {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error('MongoDB connection not found');

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastVisit);

        // Find users who either have never visited (no lastVisit field) or haven't visited in 15+ days
        const users = await db.collection('user').find(
            {
                email: {$exists: true, $ne: null},
                name: {$exists: true, $ne: null},
                $or: [
                    {lastVisit: {$exists: false}}, // Users who have never been tracked
                    {lastVisit: {$lt: cutoffDate}}  // Users inactive for 15+ days
                ]
            },
            {projection: {_id: 1, id: 1, email: 1, name: 1, lastVisit: 1}}
        ).toArray();

        return users.map((user) => ({
            id: user.id || user._id?.toString() || '',
            email: user.email,
            name: user.name,
            lastVisit: user.lastVisit || null
        }));
    } catch (err) {
        console.error('Error fetching inactive users:', err);
        return [];
    }
}
