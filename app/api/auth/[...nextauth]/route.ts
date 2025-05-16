import NextAuth from "next-auth";
import { authOptions } from "./options";

// Handle GET and POST requests using App Router API
const handler = NextAuth(authOptions);

// Export named route handlers
export { handler as GET, handler as POST };

