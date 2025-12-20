import {clerkClient} from '@clerk/express';

export const protectAdmin = async (req, res, next) => {
    try {
        // Clerk attaches an auth() function to the request; call it to get auth details
        const auth = req.auth && typeof req.auth === 'function' ? req.auth() : req.auth;
        const userId = auth?.userId;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Not Authorised' });
        }

        const user = await clerkClient.users.getUser(userId);

        // Debug info: log user id and role (non-sensitive)
        console.log('protectAdmin - userId:', userId, 'role:', user.publicMetadata?.role);

        if (!user?.publicMetadata || user.publicMetadata.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
        }
        next();
    } catch (error) {
        console.error('protectAdmin error:', error?.message || error);
        return res.status(500).json({ success: false, message: 'Not Authorised' });
    }
}