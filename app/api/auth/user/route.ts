import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/options';
import axios from 'axios';

export async function GET() {
    console.log("GET /api/auth/user");

    try {
        const session = await getServerSession(authOptions);
        console.log("session", session);

        if (!session || !session.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data } = await axios.get(
            `${process.env.NEXTAUTH_BACKEND_URL}/accounts/user`,
            {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching user:', error);
        return NextResponse.json({
            error: 'Failed to fetch user data',
            details: error.message,
        }, { status: 500 });
    }
}
